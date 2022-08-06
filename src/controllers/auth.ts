import { query, Request, Response } from "express";
import {
    AuthenticationType,
    SignupInput,
    verificationBody,
    SignInBody,
    changePasswordInput,
    resetPasswordSendOtpBody,
    resetPasswordBody,
} from "../types/auth";
import AWS from "aws-sdk";
import jwt from "jsonwebtoken";
import ObjectId from "bson-objectid";
import { comparePassword, hashPassword } from "../utils/passwordActions";
import prismaClient from "../services/mysql";
import { randomInteger } from "../utils/utilityFunctions";
import { createEmailParams, createSmsParams, EmailSendingTypes, SmsMessagingTypes } from "../utils/awsParams";
import { addTokenToWhiteList, removeTokenFromWhiteList, removeAllTokenFromWhiteList } from "../services/redisActions";
import { Prisma } from "@prisma/client";
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

        let queryConditionObj: Prisma.UserWhereInput;
        if (type === AuthenticationType.EMAIL) {
            queryConditionObj = {
                email: authenticatedBy,
                isVerified: true,
            };
        } else {
            queryConditionObj = {
                tel: authenticatedBy,
                isVerified: true,
            };
        }

        const user = await prismaClient.user.findFirst({
            where: queryConditionObj,
            select: {
                id: true,
                password: true,
                passwordUpdateVersion: true,
                blockings: {
                    select: {
                        blockedUntil: true,
                        enteredWrongPasswordTime: true,
                        isBlocked: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(400).send({
                message: "Account does not exist",
            });
        }

        if (user.blockings?.isBlocked) {
            const now = new Date();
            const blockedUntil = new Date(user.blockings.blockedUntil!);
            if (now < blockedUntil) {
                res.status(403).send({
                    message: "Your account is blocked. Please wait.",
                });
            } else {
                const isMatch = await comparePassword(user.password, password);
                if (!isMatch) {
                    if (user.blockings?.enteredWrongPasswordTime === 5) {
                        res.status(403).send({
                            message: "Your has entered wrong password many time. Your account is blocked, please wait.",
                        });
                        const blockedUntil = new Date();
                        blockedUntil.setMinutes(blockedUntil.getMinutes() + 10);
                        await prismaClient.blocking.update({
                            where: {
                                userId: user.id,
                            },
                            data: {
                                enteredWrongPasswordTime: 0,
                                isBlocked: true,
                                blockedUntil,
                            },
                        });
                    } else {
                        res.status(400).send({
                            message: "Password is incorrect",
                        });
                        await prismaClient.blocking.update({
                            where: {
                                userId: user.id,
                            },
                            data: {
                                enteredWrongPasswordTime: {
                                    increment: 1,
                                },
                                blockedUntil: null
                            },
                        });
                    }
                } else {
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
                    await prismaClient.blocking.update({
                        where: {
                            userId: user.id,
                        },
                        data: {
                            enteredWrongPasswordTime: 0,
                            blockedUntil: null,
                            isBlocked: false
                        },
                    });
                }
            }
        } else {
            const isMatch = await comparePassword(user.password, password);
            if (!isMatch) {
                if (user.blockings?.enteredWrongPasswordTime === 5) {
                    res.status(403).send({
                        message: "Your has entered wrong password many time. Your account is blocked, please wait.",
                    });
                    const blockedUntil = new Date();
                    blockedUntil.setMinutes(blockedUntil.getMinutes() + 10);
                    await prismaClient.blocking.update({
                        where: {
                            userId: user.id,
                        },
                        data: {
                            enteredWrongPasswordTime: 0,
                            isBlocked: true,
                            blockedUntil,
                        },
                    });
                } else {
                    res.status(400).send({
                        message: "Password is incorrect",
                    });
                    await prismaClient.blocking.update({
                        where: {
                            userId: user.id,
                        },
                        data: {
                            enteredWrongPasswordTime: {
                                increment: 1,
                            },
                        },
                    });
                }
            } else {
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
                await prismaClient.blocking.update({
                    where: {
                        userId: user.id,
                    },
                    data: {
                        enteredWrongPasswordTime: 0,
                        blockedUntil: null,
                        isBlocked: false
                    },
                });
            }
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

export const resetPasswordSendOtpController = async (req: Request, res: Response) => {
    try {
        const { authenticatedBy, type } = req.body as resetPasswordSendOtpBody;

        if (type === AuthenticationType.EMAIL) {
            const user = await prismaClient.user.findFirst({
                where: {
                    email: authenticatedBy,
                    isVerified: true,
                },
                select: {
                    id: true,
                },
            });

            if (!user) {
                return res.status(400).send({
                    message: "Account not found",
                });
            }

            const otp = randomInteger(100000, 999999).toString();
            const otpExpiredAt = new Date();
            otpExpiredAt.setMinutes(otpExpiredAt.getMinutes() + 10);

            await prismaClient.otp.update({
                where: {
                    userId: user.id,
                },
                data: {
                    resetPasswordOtp: otp,
                    resetPasswordExpiredAt: otpExpiredAt,
                },
            });

            const token = jwt.sign(
                {
                    userId: user.id,
                },
                process.env.JWT_RESET_PASSWORD_KEY!,
                {
                    expiresIn: "10m",
                }
            );

            const params = createEmailParams({
                type: EmailSendingTypes.RESET_PASSWORD,
                email: authenticatedBy,
                otp,
            });
            SES.sendEmail(params, (err) => {
                if (err) {
                    return res.status(500).send({
                        message: "Could not send OTP to your email",
                    });
                }
                res.status(202).send({
                    message: "Please check your email to reset your password",
                    token,
                });
            });
        } else {
            const user = await prismaClient.user.findFirst({
                where: {
                    tel: authenticatedBy,
                    isVerified: true,
                },
                select: {
                    id: true,
                },
            });

            if (!user) {
                return res.status(400).send({
                    message: "Account not found",
                });
            }

            const otp = randomInteger(100000, 999999).toString();
            const otpExpiredAt = new Date();
            otpExpiredAt.setMinutes(otpExpiredAt.getMinutes() + 10);

            await prismaClient.otp.update({
                where: {
                    userId: user.id,
                },
                data: {
                    resetPasswordOtp: otp,
                    resetPasswordExpiredAt: otpExpiredAt,
                },
            });

            const token = jwt.sign(
                {
                    userId: user.id,
                },
                process.env.JWT_RESET_PASSWORD_KEY!,
                {
                    expiresIn: "10m",
                }
            );
            const params = createSmsParams({
                type: SmsMessagingTypes.RESET_PASSWORD,
                otp,
                rawTel: authenticatedBy,
            });
            SNS.publish(params, (err) => {
                if (err) {
                    return res.status(500).send({
                        message: "Could not send OTP to your phone number",
                    });
                }
                res.status(202).send({
                    message: "Please check your phone to reset your password",
                    token,
                });
            });
        }
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const resetPasswordController = async (req: Request, res: Response) => {
    try {
        const { userId, otp, password } = req.body as resetPasswordBody;

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                otps: {
                    select: {
                        resetPasswordOtp: true,
                        resetPasswordExpiredAt: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).send({
                message: "Account not found",
            });
        }
        if (otp !== user.otps?.resetPasswordOtp) {
            return res.status(400).send({
                message: "OTP is incorrect",
            });
        }

        const now = new Date();
        if (new Date(user.otps.resetPasswordExpiredAt!) < now) {
            res.status(400).send({
                message: "OTP has already expired",
            });
        } else {
            const hashedPassword = await hashPassword(password);

            await prismaClient.user.update({
                where: {
                    id: userId,
                },
                data: {
                    password: hashedPassword,
                    passwordUpdateVersion: {
                        increment: 1,
                    },
                },
            });

            res.status(202).send({
                message: "Password has been reset. Let's login!!",
            });

            await removeAllTokenFromWhiteList(userId);
        }

        await prismaClient.otp.update({
            where: {
                userId,
            },
            data: {
                resetPasswordOtp: null,
                resetPasswordExpiredAt: null,
            },
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
