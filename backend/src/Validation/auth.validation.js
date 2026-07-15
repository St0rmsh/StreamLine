import { body, validationResult } from "express-validator";

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export const registerValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Full name is required")
        .isString().withMessage("Name must be a text string")
        .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),

    body("username")
        .trim()
        .notEmpty().withMessage("Username is required")
        .isString().withMessage("Username must be a text string")
        .isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Username can only contain letters, numbers, and underscores"),

    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .normalizeEmail()
        .isString().withMessage("Email must be a text string")
        .isEmail().withMessage("Invalid email address"),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isString().withMessage("Password must be a text string")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

    handleValidationErrors
];

export const loginValidation = [
    body().custom((value, { req }) => {
        if (!req.body.email && !req.body.username) {
            throw new Error("Email or Username is required");
        }
        return true;
    }),

    body("email")
        .optional()
        .trim()
        .notEmpty().withMessage("Email is required if provided")
        .isString().withMessage("Email must be a text string")
        .isEmail().withMessage("Invalid email address"),

    body("username")
        .optional()
        .trim()
        .isString().withMessage("Username must be a text string")
        .notEmpty().withMessage("Username is required if provided"),

    body("password")
        .trim()
        .isString().withMessage("Password must be a text string")
        .notEmpty().withMessage("Password is required"),

    handleValidationErrors
];