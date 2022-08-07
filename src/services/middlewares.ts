import { Request, Response, NextFunction } from "express";
import { addTokenToWhiteList, checkTokenFromWhiteList, removeTokenFromWhiteList } from "./redisActions";
import prismaClient from "./mysql";
import jwt from "jsonwebtoken";

interface JwtAuthorizationResult extends jwt.JwtPayload {
    userId: string;
    version: number;
}

declare global {
    namespace Express {
        interface Request {
            user: {
                userId: string;
            } | null;
        }
    }
}

export const authorizedMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).send();
        }
        jwt.verify(token, process.env.JWT_AUTHORIZATION_KEY!, async (err, result) => {
            if (err) {
                res.status(401).send();
                if (err.name === "TokenExpiredError") {
                    const { userId } = jwt.decode(token) as { userId: string };
                    await removeTokenFromWhiteList(userId, token);
                }
            } else {
                const { userId, version } = result as JwtAuthorizationResult;
                const isTokenInWhiteList = await checkTokenFromWhiteList(userId, token);
                if (!isTokenInWhiteList) {
                    const user = await prismaClient.user.findUnique({
                        where: {
                            id: userId,
                        },
                        select: {
                            id: true,
                            passwordUpdateVersion: true,
                        },
                    });
                    if (!user) {
                        return res.status(401).send();
                    }
                    if (user.passwordUpdateVersion > version) {
                        res.status(401).send();
                    } else {
                        await addTokenToWhiteList(userId, token);
                        req.user = {
                            userId,
                        };
                        next();
                    }
                } else {
                    req.user = {
                        userId,
                    };
                    next();
                }
            }
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};

export const verifyRefreshTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.headers.refreshtoken as string;

        if (!refreshToken) {
            return res.status(401).send();
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_KEY!, (err, result) => {
            if (err) {
                return res.status(401).send();
            }
            const { userId } = result as { userId: string };
            req.body.userId = userId;
            next();
        });
    } catch (e) {
        res.status(500).send({
            message: "Something went wrong",
        });
    }
};
