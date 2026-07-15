import dotenv from "dotenv"

dotenv.config()


const requiredEnvVars = [
  "PORT",
  "MONGODB_URI",
  "REDIS_HOST",
  "REDIS_PASSWORD",
  "REDIS_PORT",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_URL_ENDPOINT",
  "JWT_SECRET",
  "TAVILY_API_KEY",
  "MISTRAL_API_KEY",
  "ASSEMBLY_API_KEY",
  "GOOGLE_USER",
  "GOOGLE_PASS",
  "GOOGLE_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingVars = requiredEnvVars.filter(
  (key) => !process.env[key]
);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables:\n${missingVars.join("\n")}`
  );
}


const config = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_HOST:process.env.REDIS_HOST,
    REDIS_PASSWORD:process.env.REDIS_PASSWORD,
    REDIS_PORT:process.env.REDIS_PORT,
    IMAGEKIT_PRIVATE_KEY:process.env.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_PUBLIC_KEY:process.env.IMAGEKIT_PUBLIC_KEY,
    JWT_SECRET:process.env.JWT_SECRET,
    TAVILY_API_KEY:process.env.TAVILY_API_KEY,
    MISTRAL_API_KEY:process.env.MISTRAL_API_KEY,
    ASSEMBLY_API_KEY:process.env.ASSEMBLY_API_KEY,
    GOOGLE_USER:process.env.GOOGLE_USER,
    GOOGLE_PASS:process.env.GOOGLE_PASS,
    IMAGEKIT_URL_ENDPOINT:process.env.IMAGEKIT_URL_ENDPOINT,
    GOOGLE_API_KEY:process.env.GOOGLE_API_KEY,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5174"],
}


export default config