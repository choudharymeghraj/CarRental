import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Strict MIME type whitelist (checks actual MIME, not just extension)
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

// Max 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // Cryptographically random filename — prevents path traversal / guessing
        const unique = crypto.randomBytes(16).toString("hex");
        const ext    = path.extname(file.originalname).toLowerCase();
        cb(null, `${unique}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(
            new Error("Invalid file type. Only JPG, PNG, and WebP images are accepted."),
            false
        );
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;