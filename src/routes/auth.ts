import { Router } from "express";
const router = Router();
import {
    signInController,
    refreshTokenController,
    logoutController,
    signupController,
    sendOtpAgainController,
    verifyAccountController,
    getProfileController,
    changePasswordController,
    resetPasswordSendOtpController,
    resetPasswordController
} from "../controllers/auth";
import {
    signupValidator,
    sendOtpAgainValidator,
    verifyAccountValidator,
    signInValidator,
    changePasswordValidator,
    resetPasswordSendOtpValidator,
    resetPasswordValidator,
} from "../validations/auth";
import setRateLimit from "../services/rateLimit";
import {authorizedMiddleware, verifyRefreshTokenMiddleware} from "../services/middlewares";

router.post(
    "/signup",
    setRateLimit(60, 180, "Too many signup, please try again later."),
    signupValidator,
    signupController
);

router.post(
    "/signup/otp",
    setRateLimit(60, 120, "Too many send new OTP, please try again later."),
    sendOtpAgainValidator,
    sendOtpAgainController
);

router.put(
    "/verify",
    setRateLimit(60, 120, "Too many verify account, please try again later."),
    verifyAccountValidator,
    verifyAccountController
);

router.post(
    "/sign-in",
    setRateLimit(60, 180, "Too many sign in, please try again later."),
    signInValidator,
    signInController
);

router.get("/refresh-token", authorizedMiddleware, verifyRefreshTokenMiddleware, refreshTokenController);

router.put("/logout", authorizedMiddleware, logoutController);

router.get("/profile", authorizedMiddleware, getProfileController);

router.put("/password/change", authorizedMiddleware, changePasswordValidator, changePasswordController);

router.put("/password/reset/otp", setRateLimit(60, 180, "Too many send otp. Please try again later."), resetPasswordSendOtpValidator, resetPasswordSendOtpController);

router.put("/password/reset", setRateLimit(60, 180, "Too many reset password. Please try again later."), resetPasswordValidator, resetPasswordController);

export default router;
