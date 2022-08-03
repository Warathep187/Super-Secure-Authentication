import { Request, Response } from "express";
import { AuthenticationType, SignupInput, verificationBody, SignInBody, changePasswordInput } from "../types/auth";
import AWS from "aws-sdk";
import jwt from "jsonwebtoken";
import ObjectId from "bson-objectid";
import { comparePassword, hashPassword } from "../utils/passwordActions";
import prismaClient from "../services/mysql";
import { randomInteger } from "../utils/utilityFunctions";
import { createEmailParams, createSmsParams, EmailSendingTypes, SmsMessagingTypes } from "../utils/awsParams";
import { addTokenToWhiteList, removeTokenFromWhiteList, removeAllTokenFromWhiteList } from "../services/redisActions";
AWS.config.update({ region: "us-east-1" });

const SES = new AWS.SES({ apiVersion: "2010-12-01" });

const SNS = new AWS.SNS({ apiVersion: "2010-03-31" });

export const signupController = async (req: Request, res: Response) => {
    const { type, password } = req.body as SignupInput;

    if (type === AuthenticationType.EMAIL) {
        try {
            const email = (<SignupInput>req.body).email!;

            const user = await prismaClient.user.findUnique({
                where: {
                    email,
                },
                select: {
                    id: true,
                    email: true,
                    isVerified: true,
                },
            });
            if (user) {
                if (user.isVerified) {
                    return res.status(400).send({
                        message: "Email has already used",
                    });
                } else {
                    const hashedPassword = await hashPassword(password);
                    const otp = randomInteger(100000, 999999).toString();
                    const signupOtpExpiredAt = new Date();
                    signupOtpExpiredAt.setMinutes(signupOtpExpiredAt.getMinutes() + 10);
                    await prismaClient.user.update({
                        where: {
                            email: user.email!,
                        },
                        data: {
                            password: hashedPassword,
                        },
                    });
                    await prismaClient.otp.update({
                        where: {
                            userId: user.id,
                        },
                        data: {
                            signupOtp: otp,
                            signupExpiredAt: signupOtpExpiredAt,
                        },
                    });
                    const params = createEmailParams({
                        email: email,
                        type: EmailSendingTypes.SIGNUP,
                        otp,
                    });
                    SES.sendEmail(params, (err) => {
                        if (err) {
                            return res.status(500).send({
                                message: "Could not send message to your email",
                            });
                        }
                        const signupToken = jwt.sign(user.id, process.env.JWT_SIGNUP_KEY!);
                        res.send({
                            message: "OTP has been sent to your email",
                            token: signupToken,
                        });
                    });
                }
            } else {
                const userId = ObjectId().toHexString();
                const hashedPassword = await hashPassword(password);
                const otp = randomInteger(100000, 999999).toString();
                const signupOtpExpiredAt = new Date();
                signupOtpExpiredAt.setMinutes(signupOtpExpiredAt.getMinutes() + 10);
                const user = await prismaClient.user.create({
                    data: {
                        id: userId,
                        authenticationType: AuthenticationType.EMAIL,
                        email,
                        password: hashedPassword,
                        otps: {
                            create: {
                                signupOtp: otp,
                                signupExpiredAt: signupOtpExpiredAt,
                                resetPasswordOtp: "",
                            },
                        },
                        blockings: {
                            create: {},
                        },
                    },
                });
                const params = createEmailParams({
                    email: email,
                    type: EmailSendingTypes.SIGNUP,
                    otp,
                });
                SES.sendEmail(params, (err) => {
                    if (err) {
                        return res.status(500).send({
                            message: "Could not send message to your email",
                        });
                    }
                    const signupToken = jwt.sign(user.id, process.env.JWT_SIGNUP_KEY!);
                    res.send({
                        message: "OTP has been sent to your email",
                        token: signupToken,
                    });
                });
            }
        } catch (e) {
            res.status(500).send({
                message: "Something wen wrong",
            });
        }
    } else {
        try {
            const tel = (<SignupInput>req.body).tel!;

            const user = await prismaClient.user.findUnique({
                where: {
                    tel,
                },
                select: {
                    id: true,
                    tel: true,
                    isVerified: true,
                },
            });
            if (user) {
                if (user.isVerified) {
                    return res.status(400).send({
                        message: "Telephone number has already used",
                    });
                } else {
                    const hashedPassword = await hashPassword(password);
                    const otp = randomInteger(100000, 999999).toString();
                    const signupOtpExpiredAt = new Date();
                    signupOtpExpiredAt.setMinutes(signupOtpExpiredAt.getMinutes() + 10);
                    await prismaClient.user.update({
                        where: {
                            tel,
                        },
                        data: {
                            password: hashedPassword,
                            otps: {
                                update: {
                                    signupOtp: otp,
                                    signupExpiredAt: signupOtpExpiredAt,
                                },
                            },
                        },
                    });
                    const params = createSmsParams({
                        rawTel: tel,
                        type: SmsMessagingTypes.SIGNUP,
                        otp,
                    });
                    SNS.publish(params, (err) => {
                        if (err) {
                            return res.status(500).send({
                                message: "Could not sent OTP to your phone number",
                            });
                        }
                        const signupToken = jwt.sign(user.id, process.env.JWT_SIGNUP_KEY!);
                        res.send({
                            message: "OTP has been sent to your phone number",
                            token: signupToken,
                        });
                    });
                }
            } else {
                const userId = ObjectId().toHexString();
                const hashedPassword = await hashPassword(password);
                const otp = randomInteger(100000, 999999).toString();
                const signupOtpExpiredAt = new Date();
                signupOtpExpiredAt.setMinutes(signupOtpExpiredAt.getMinutes() + 10);
                const user = await prismaClient.user.create({
                    data: {
                        id: userId,
                        authenticationType: AuthenticationType.TEL,
                        tel,
                        password: hashedPassword,
                        otps: {
                            create: {
                                signupOtp: otp,
                                signupExpiredAt: signupOtpExpiredAt,
                            },
                        },
                        blockings: {
                            create: {},
                        },
                    },
                });
                const params = createSmsParams({
                    type: SmsMessagingTypes.SIGNUP,
                    rawTel: tel,
                    otp,
                });
                SNS.publish(params, (err) => {
                    if (err) {
                        return res.status(500).send({
                            message: "Could not sent OTP to your phone number",
                        });
                    }
                    const signupToken = jwt.sign(user.id, process.env.JWT_SIGNUP_KEY!);
                    res.send({
                        message: "OTP has been sent to your phone number",
                        token: signupToken,
                    });
                });
            }
        } catch (e) {
            res.status(500).send({
                message: "Something went wrong",
            });
        }
    }
};

export const sendOtpAgainController = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId as string;

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                isVerified: true,
                tel: true,
                email: true,
                authenticationType: true,
            },
        });
        if (!user) {
            return res.status(400).send({
                message: "Account not found",
            });
        }
        if (user.isVerified) {
            return res.status(400).send({
                message: "Account has already verified",
            });
        }
        const otp = randomInteger(100000, 999999).toString();

        if (user.authenticationType === AuthenticationType.EMAIL) {
            const params = createEmailParams({
                type: EmailSendingTypes.SIGNUP,
                otp: otp,
                email: user?.email!,
            });
            SES.sendEmail(params, (err) => {
                if (err) {
                    return res.status(500).send({
                        message: "Could not send OTP",
                    });
                }
                res.status(201).send({
                    message: "OTP has been sent",
                });
            });
        } else {
            const params = createSmsParams({
                type: SmsMessagingTypes.SIGNUP,
                otp: otp,
                rawTel: user?.tel!,
            });
            SNS.publish(params, (err) => {
                if (err) {
                    return res.status(500).send({
                        message: "Could not send OTP",
                    });
                }
                res.status(203).send({
                    message: "OTP has been sent",
                });
            });
        }

        const signupOtpExpiredAt = new Date();
        signupOtpExpiredAt.setMinutes(signupOtpExpiredAt.getMinutes() + 10);
        await prismaClient.user.update({
            where: {
                id: userId,
            },
            data: {
                otps: {
                    update: {
                        signupOtp: otp,
                        signupExpiredAt: signupOtpExpiredAt,
                    },
                },
            },
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const verifyAccountController = async (req: Request, res: Response) => {
    try {
        const { userId, otp } = req.body as verificationBody;

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                otps: {
                    select: {
                        signupOtp: true,
                        signupExpiredAt: true,
                    },
                },
                isVerified: true,
            },
        });

        if (!user) {
            return res.status(400).send({
                message: "Account not found",
            });
        }
        if (user.isVerified) {
            return res.status(409).send({
                message: "Account has been verified",
            });
        }

        const now = new Date();
        const expiredAt = new Date(user.otps?.signupExpiredAt!);
        if (expiredAt < now) {
            res.status(400).send({
                message: "OTP has already expired",
            });
            await prismaClient.otp.update({
                where: {
                    userId,
                },
                data: {
                    signupOtp: null,
                    signupExpiredAt: null,
                },
            });
        } else {
            if (user.otps?.signupOtp !== otp) {
                return res.status(400).send({
                    message: "OTP is incorrect",
                });
            }
            await prismaClient.user.update({
                where: {
                    id: userId,
                },
                data: {
                    isVerified: true,
                    otps: {
                        update: {
                            signupOtp: null,
                            signupExpiredAt: null,
                        },
                    },
                },
            });
            res.status(200).send({
                message: "Verified",
            });
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const signInController = async (req: Request, res: Response) => {
    try {
        const { authenticatedBy, type, password } = req.body as SignInBody;

        if (type === AuthenticationType.EMAIL) {
            const user = await prismaClient.user.findFirst({
                where: {
                    email: authenticatedBy,
                    isVerified: true,
                },
                select: {
                    id: true,
                    password: true,
                    passwordUpdateVersion: true,
                },
            });
            if (!user) {
                return res.status(400).send({
                    message: "Email does not exist",
                });
            }

            const isMatch = await comparePassword(user.password, password);
            if (!isMatch) {
                return res.status(400).send({
                    message: "Password is incorrect",
                });
            }
            const token = jwt.sign(
                { userId: user.id, version: user.passwordUpdateVersion },
                process.env.JWT_AUTHORIZATION_KEY!,
                {
                    expiresIn: "1d",
                }
            );
            const refreshToken = jwt.sign(
                {
                    userId: user.id,
                },
                process.env.JWT_REFRESH_TOKEN_KEY!,
                {
                    expiresIn: "7d",
                }
            );
            res.status(202).send({
                token,
                refreshToken,
                userId: user.id,
            });
            await addTokenToWhiteList(user.id, token);
        } else {
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const logoutController = async (req: Request, res: Response) => {
    try {
        const { userId } = req.user!;
        const token = req.headers.authorization!;

        res.status(202).send();

        await removeTokenFromWhiteList(userId, token);
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const getProfileController = async (req: Request, res: Response) => {
    try {
        const { userId } = req.user!;

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                authenticationType: true,
                email: true,
                tel: true,
            },
        });
        res.send({
            userDetail: user,
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const changePasswordController = async (req: Request, res: Response) => {
    try {
        const { userId } = req.user!;
        const { oldPassword, newPassword } = req.body as changePasswordInput;

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                password: true,
            },
        });
        const isMatch = await comparePassword(user!.password, oldPassword);
        if (!isMatch) {
            return res.status(400).send({
                message: "Old password does not match",
            });
        }
        const hashNewPassword = await hashPassword(newPassword);
        const updatedUser = await prismaClient.user.update({
            where: {
                id: userId,
            },
            data: {
                password: hashNewPassword,
                passwordUpdateVersion: {
                    increment: 1,
                },
            },
            select: {
                passwordUpdateVersion: true,
            },
        });

        const updatedToken = jwt.sign(
            {
                userId,
                version: updatedUser.passwordUpdateVersion,
            },
            process.env.JWT_AUTHORIZATION_KEY!,
            {
                expiresIn: "1d",
            }
        );
        res.status(202).send({
            updatedToken,
        });
        await removeAllTokenFromWhiteList(userId);
    } catch (e) {
        console.log(e);
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
