import express from "express";
import {
    checkAvailabilityOfCar,
    createBooking,
    getUserBookings,
    getOwnerBookings,
    changeBookingStatus,
    cancelBooking,
    editBooking,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
    createBookingSchema,
    changeStatusSchema,
    cancelBookingSchema,
    editBookingSchema,
} from "../middleware/schemas.js";
import rateLimit from "express-rate-limit";

const bookingRouter = express.Router();

// Rate-limit booking creation: max 10 per minute per IP
const createLimiter = rateLimit({
    windowMs: 60_000,
    max: 10,
    message: { success: false, message: "Too many booking requests. Please wait a minute." },
    standardHeaders: true,
    legacyHeaders: false,
});

bookingRouter.post("/check-availability", protect, checkAvailabilityOfCar);
bookingRouter.post("/create",             protect, createLimiter, validate(createBookingSchema), createBooking);
bookingRouter.get("/user",                protect, getUserBookings);
bookingRouter.get("/owner",               protect, getOwnerBookings);
bookingRouter.post("/change-status",      protect, validate(changeStatusSchema),  changeBookingStatus);
bookingRouter.post("/cancel",             protect, validate(cancelBookingSchema),  cancelBooking);
bookingRouter.post("/edit",               protect, validate(editBookingSchema),    editBooking);

export default bookingRouter;
