import { Request, Response, NextFunction } from "express";
import { AuthenticationType, SignInInput, SignupInput, verificationInput, changePasswordInput } from "../types/auth";
import { emailRegex, thailandTelRegex } from "../utils/regex";
import jwt from "jsonwebtoken";

export const signupValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, password } = req.body as SignupInput;
        if (type === AuthenticationType.EMAIL) {
            const { email } = req.body as SignupInput;
            if (!email || email!.trim() === "") {
                res.status(400).send({
                    message: "Email must be provided",
                });
            } else if (!emailRegex.test(email!.toLowerCase())) {
                res.status(400).send({
                    message: "Email is invalid",
                });
            } else if (!password || password.trim() === "") {
                res.status(400).send({
                    message: "Password must be provided",
                });
            } else if (password.trim().length < 8) {
                res.status(400).send({
                    message: "Password must be greater than 8 characters",
                });
            } else {
                next();
            }
        } else if (type === AuthenticationType.TEL) {
            const { tel } = req.body as SignupInput;
            if (!tel) {
                res.status(400).send({
                    message: "Phone number must be provided",
                });
            } else if (!thailandTelRegex.test(tel!)) {
                res.status(400).send({
                    message: "Phone number is invalid",
                });
            } else if (!password || password.trim() === "") {
                res.status(400).send({
                    message: "Password must be provided",
                });
            } else if (password.trim().length < 8) {
                res.status(400).send({
                    message: "Password must be greater than 8 characters",
                });
            } else {
                next();
            }
        } else {
            res.status(400).send({
                message: "Invalid authentication type",
            });
        }
    } catch (e) {}
};

export const sendOtpAgainValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.body.token as string;
        if (!token || token.trim() === "") {
            return res.status(400).send({
                message: "Token must be provided",
            });
        }
        jwt.verify(token, process.env.JWT_SIGNUP_KEY!, (err, result) => {
            if (err) {
                return res.status(400).send({
                    message: "Invalid signup token",
                });
            }
            req.body.userId = result;
            next();
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const verifyAccountValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, otp } = req.body as verificationInput;

        if (!token || token.trim() === "") {
            return res.status(400).send({
                message: "Token must be provided",
            });
        }
        jwt.verify(token, process.env.JWT_SIGNUP_KEY!, (err, result) => {
            if (err) {
                return res.status(400).send({
                    message: "Invalid signup token",
                });
            }
            if (Number.isNaN(+otp)) {
                res.status(400).send({
                    message: "Invalid OTP",
                });
            } else if (+otp < 100000 || +otp > 999999) {
                res.status(400).send({
                    message: "Invalid OTP",
                });
            } else {
                req.body.userId = result;
                next();
            }
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const signInValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {authenticatedBy, password} = req.body as SignInInput;
        if(emailRegex.test(authenticatedBy)) {
            if(!password || password.trim() === "") {
                res.status(400).send({
                    message: "Password must be provided"
                })
            } else if(password.trim().length < 8) {
                res.status(400).send({
                    message: "Password must be at least 8 characters"
                })
            } else {
                req.body.type = AuthenticationType.EMAIL;
                next();
            }
        } else if(thailandTelRegex.test(authenticatedBy)) {
            if(!password || password.trim() === "") {
                res.status(400).send({
                    message: "Password must be provided"
                })
            } else if(password.trim().length < 8) {
                res.status(400).send({
                    message: "Password must be at least 8 characters"
                })
            } else {
                req.body.type = AuthenticationType.TEL;
                next();
            }
        } else {
            res.status(400).send({
                message: "Invalid email or tel."
            })
        }
    }catch(e) {
        res.status(500).send({
            message: "Something went wrong"
        })
    }
}

export const changePasswordValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {oldPassword, newPassword, confirmNewPassword} = req.body as changePasswordInput;

        if(!oldPassword || oldPassword.trim() === "") {
            res.status(400).send({
                message: "Old password must be provided"
            })
        } else if(oldPassword.trim().length < 8) {
            res.status(400).send({
                message: "Password must be at least 8 characters"
            })
        } else if(!newPassword || newPassword.trim() === "") {
            res.status(400).send({
                message: "New password must be provided"
            })
        } else if(newPassword.trim().length < 8) {
            res.status(400).send({
                message: "Password must be at least 8 characters"
            })
        } else if(newPassword !== confirmNewPassword) {
            res.status(400).send({
                message: "Password does not match"
            })
        } else {
            next();
        }
    }catch(e) {
        res.status(500).send({
            message: "Something went wrong"
        })
    }
}