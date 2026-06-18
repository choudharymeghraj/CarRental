import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();
export default app; // Export for Vercel
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";
const allowStartWithoutDb = process.env.ALLOW_START_WITHOUT_DB === "true" || !isProduction;

// ─── CORS — restrict to known frontend origins ────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps, Postman, curl)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));

app.use(express.json({ limit: "1mb" }));   // reject oversized JSON payloads

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("Server is running ✓"));
app.use("/api/user",     userRoutes);
app.use("/api/owner",    ownerRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payment",  paymentRouter);
app.use("/api/ai",       aiRoutes);

// ─── Centralized error handler ────────────────────────────────────────────────
// Must be registered AFTER routes
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // Multer: file size limit exceeded
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "File too large. Maximum size is 5 MB." });
    }
    // Multer: invalid file type
    if (err.message?.startsWith("Invalid file type")) {
        return res.status(415).json({ success: false, message: err.message });
    }
    // CORS rejection
    if (err.message?.startsWith("CORS")) {
        return res.status(403).json({ success: false, message: err.message });
    }

    console.error("[Server Error]", err);
    res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        let dbConnected = false;
        try {
            await connectDB();
            dbConnected = true;
        } catch (error) {
            if (!allowStartWithoutDb) throw error;
            console.warn(`[DB] Connection skipped: ${error.message}`);
            console.warn("[DB] Running in degraded mode — set valid MongoDB credentials.");
        }

        app.listen(PORT, () => {
            const dbStatus = dbConnected ? "DB connected ✓" : "DB not connected ✗";
            console.log(`[Server] Running on port ${PORT} | ${dbStatus}`);
        });
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

// For local development
if (process.env.NODE_ENV !== "production") {
    startServer();
} else {
    // In production (Vercel), we still need to connect to the DB
    connectDB().catch(err => console.error("DB connection error:", err));
}