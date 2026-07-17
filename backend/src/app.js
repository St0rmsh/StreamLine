import express from "express"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import cors from "cors"
import multer from "multer"
import fs from "fs"
import path from "path";
import { fileURLToPath } from "url";


const app = express()

const CLIENT_URL = "http://localhost:5173";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, "../public");

app.use(express.static(publicPath));

app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}))


// auth
import authRoutes from "./routes/auth.routes.js"
app.use("/api/auth", authRoutes)

// channel
import channelRoutes from "./routes/channel.route.js"
app.use("/api/channel", channelRoutes)

// video
import videoRoutes from "./routes/video.routes.js"
app.use("/api/video", videoRoutes)

// comment
import commentRoutes from "./routes/comment.routes.js"
app.use("/api/comment", commentRoutes)

// like
import likeRoutes from "./routes/like.routes.js"
app.use("/api/like", likeRoutes)

// subscription
import subscriptionRoutes from "./routes/subscriber.routes.js"
app.use("/api/subscription", subscriptionRoutes)

// analytics
import analyticsRoutes from "./routes/analytics.routes.js"
app.use("/api/analytics", analyticsRoutes)


// 🧹 Cleanup leftover frame directories every hour
setInterval(async () => {
  try {
    const files = await fs.promises.readdir(".");

    for (const file of files) {
      if (file.startsWith("frames-")) {
        await fs.promises.rm(file, {
          recursive: true,
          force: true
        });
        console.log("🧹 Deleted leftover:", file);
      }
    }
  } catch (err) {
    console.log("Cleanup cron error:", err.message);
  }
}, 60 * 60 * 1000);




app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});


// 404 handler — must come after all routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Multer / file-validation errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("Invalid file") || err.message?.includes("Only")) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server Error" });
});




export default app