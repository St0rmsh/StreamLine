import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many requests, try again later"
});

export const deepVerifyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Deep verification limit reached. Try again in an hour."
});