import bcrypt from "bcrypt";

export const hashPassword = (password: string): Promise<string> => {
    return new Promise(async(resolve, reject) => {
        try {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);
            resolve(hashedPassword);
        }catch(e) {
            reject(e);
        }
    })
}

export const comparePassword = (password: string, submittedPassword: string): Promise<boolean> => {
    return new Promise(async(resolve, reject) => {
        try {
            const isMatch = await bcrypt.compare(submittedPassword, password);
            resolve(isMatch);
        }catch(e) {
            reject(e);
        }
    })
}