import mongoose from "mongoose";
import "dotenv/config";
import Booking from "./models/Booking.js";

const updateBookings = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Update all pending and confirmed bookings to booked
        await Booking.updateMany(
            { status: { $in: ["pending", "confirmed"] } },
            { $set: { status: "booked" } }
        );

        console.log("Bookings successfully updated to 'booked'!");
        process.exit(0);
    } catch (err) {
        console.error("Error updating bookings:", err);
        process.exit(1);
    }
};

updateBookings();
