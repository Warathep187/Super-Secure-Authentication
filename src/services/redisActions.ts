import { createClient } from "redis";

export const redisClient = createClient({
    url: process.env.REDIS_URL,
});

export const connectToRedisServer = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            await redisClient.connect();
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

export const addTokenToWhiteList = (userId: string, token: string): Promise<void> => {
    return new Promise(async(resolve, reject) => {
        try {
            await redisClient.sAdd(`${userId}-white-list`, token);
            resolve();
        }catch(e) {
            reject(e);
        }
    })
}

export const checkTokenFromWhiteList = (userId: string, token: string): Promise<boolean> => {
    return new Promise(async(resolve, reject) => {
        try {
            const isExisted = await redisClient.sIsMember(`${userId}-white-list`, token);
            resolve(isExisted);
        }catch(e) {
            reject(e);
        }
    })
}

export const removeTokenFromWhiteList = (userId: string, token: string): Promise<void> => {
    return new Promise(async(resolve, reject) => {
        try {
            await redisClient.sRem(`${userId}-white-list`, token);
            resolve();
        }catch(e) {
            reject(e);
        }
    })
}

export const removeAllTokenFromWhiteList = (userId: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            await redisClient.del(`${userId}-white-list`);
            resolve();
        }catch(e) {
            reject(e);
        }
    })
}