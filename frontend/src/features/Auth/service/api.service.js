import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true
})

export const registerUser = async ({ name, username, email, password }) => {
    try {
        const response = await api.post("/api/auth/register", { name, username, email, password });
        return response.data;
    } catch (error) {
        throw error;
    }
}


export const loginUser = async ({ email, password }) => {
    try {
        const response = await api.post("/api/auth/login", {
            email,
            username: email,
            password
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};


export const getMe = async () => {
    try {
        const response = await api.get("/api/auth/getMe");
        return response.data;
    } catch (error) {
        return { success: false, user: null };
    }
}

export const verifyOTP = async ({ email, otp }) => {
    try {
        const response = await api.post("/api/auth/verify-otp", { email, otp });
        return response.data;
    } catch (error) {
        throw error;
    }
}


export const resendOtp = async (email) => {
    try {
        const response = await api.post("/api/auth/send-otp", { email });
        return response.data;
    } catch (error) {
        throw error;
    }
}


export const logoutUser = async () => {
    try {
        const response = await api.post("/api/auth/logout");
        return response.data;
    } catch (error) {
        throw error;
    }
}