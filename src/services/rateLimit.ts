import { rateLimit } from "express-rate-limit";

const setRateLimit = (minute: number, maxRequest: number, message: string) => {
    return rateLimit({
        windowMs: minute * 60 * 1000,
        max: maxRequest,
        message: {
            message
        },
        standardHeaders: true,
        legacyHeaders: false
    })
}

export default setRateLimit;