import mongoose from "mongoose";
import "dotenv/config";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully");
    } catch (e) {
        console.error("Connection failed:", e);
    }
    process.exit(0);
}

run();
