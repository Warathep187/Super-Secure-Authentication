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