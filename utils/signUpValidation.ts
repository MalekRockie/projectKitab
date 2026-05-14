import { checkEmailAvailability, checkUsernameAvailability } from "../services/api/signUp/signUpRequsts";

export async function validateEmailStep(email: string): Promise<string | null> {
    const formatError = checkEmailFormat(email)
    if (formatError){
        return formatError;
    }
    try{
        const isAvailable = await checkEmailAvailability({email: email})
        if(!isAvailable){
            return "Email is already taken";
        }
    } catch (error){
        return "An internal error occured, please try again later."
    }
    return null;
}

export function checkEmailFormat(email: string): string | null {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) return "Email is required";
    if (!regex.test(email)) return "Please enter a valid email address";

    return null;
};

export function checkPassword(password: string): string | null {
    if (!password.trim()) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";

    return null;
}

export function verifyAge(dateOfBirth: Date, minimumAge: number): string | null{
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const birthdayThisYear = new Date(
        today.getFullYear(),
        dateOfBirth.getMonth(),
        dateOfBirth.getDate()
    );

    if (age < minimumAge || (age === minimumAge && today < birthdayThisYear)){
        return `You must be at least ${minimumAge} years old to sign up.`;
    };
    return null;
}

export async function validateUsernameStep(username: string): Promise<SuggestionResult | null>{
    if (username == null){
        return {error: "Username is required", suggestions: null}
    }
    try{
        const response = await checkUsernameAvailability({username: username})
        if(!response.Available){
            return {error: "Username is already taken", suggestions: response.Suggestions};
        }
        return null;
    } catch (error){
        return {error: "An internal error occured, please try again later.", suggestions:null}
    }
}

interface SuggestionResult {
    error: string | null;
    suggestions: string[] | null;
}