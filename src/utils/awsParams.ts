export enum EmailSendingTypes {
    SIGNUP = "signup",
    RESET_PASSWORD = "reset-password",
}

export enum SmsMessagingTypes {
    SIGNUP = "signup",
    RESET_PASSWORD = "reset-password",
}

interface EmailSendingConfig {
    type: EmailSendingTypes;
    email: string;
    otp: string;
}

interface SmsMessagingConfig {
    type: SmsMessagingTypes;
    rawTel: string;
    otp: string;
}

export const createEmailParams = (config: EmailSendingConfig) => {
    const { type, email, otp } = config;

    return {
        Destination: {
            CcAddresses: [],
            ToAddresses: [email],
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `
                        <div style="width: 100%;"}>
                            <h2 style="margin: 0 auto;">
                                ${type === EmailSendingTypes.SIGNUP ? "Email verification" : "Reset password procedure"}
                            </h2>
                            <div style="width: 75%; margin: 0 auto;">
                                <div style="padding: 5px; border-radius: 5px; backgroundColor: green; color: black; text-align: center;">
                                    <span>${otp}</span>
                                </div>
                                <span>The OTP is valid for 10 minute.</span>
                            </div>
                        </div>
                    `,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: type === EmailSendingTypes.SIGNUP ? "Email verification" : "Reset password procedure",
            },
        },
        Source: process.env.EMAIL!,
        ReplyToAddresses: [process.env.EMAIL!],
    };
};

export const createSmsParams = (config: SmsMessagingConfig) => {
    const { type, rawTel, otp } = config;
    const formattedTel = "+66" + rawTel;

    return {
        Message: `From Super Secure Authentication Company, Your OTP for ${
            type === SmsMessagingTypes.SIGNUP ? "Sign up procedure" : "Reset password"
        } is ${otp}. This OTP is valid for 10 minutes.`,
        PhoneNumber: formattedTel,
    };
};
