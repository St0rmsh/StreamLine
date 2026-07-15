import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
        const allowed = ["video/mp4", "video/webm", "video/mkv", "image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (allowed.includes(file.mimetype.toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file format. Only MP4, WEBM, MKV for videos, and JPEG, PNG, WEBP for thumbnails"));
        }
    }
});

export default upload;