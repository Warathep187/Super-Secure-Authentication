export enum AuthenticationType {
    TEL = "TEL",
    EMAIL = "EMAIL",
}

export interface SignupInput {
    type: AuthenticationType;
    email?: string;
    tel?: string;
    password: string;
}

export interface SignInInput {
    authenticatedBy: string;
    password: string;
}

export interface SignInBody extends SignInInput {
    type: AuthenticationType
}

export interface verificationInput {
    token: string;
    otp: string;
}

export interface verificationBody {
    userId: string;
    otp: string;
}

export interface changePasswordInput {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface resetPasswordSendOtpInput {
    authenticatedBy: string;
}

export interface resetPasswordSendOtpBody {
    authenticatedBy: string;
    type: AuthenticationType;
}

export interface resetPasswordInput {
    token: string;
    otp: string;
    password: string;
    confirmPassword: string;
}

export interface resetPasswordBody {
    userId: string;
    otp: string;
    password: string;
}