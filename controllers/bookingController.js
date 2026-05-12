import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import mongoose from "mongoose";

// ─── Utility: Overlap check (reusable) ───────────────────────────────────────
/**
 * Returns true if no non-cancelled booking exists for the car in the given range.
 * Optionally excludes a specific bookingId (for edit flows).
 */
export const isCarAvailable = async (carId, pickupDate, returnDate, excludeBookingId = null, session = null) => {
    const query = {
        car:    carId,
        status: { $nin: ["cancelled"] },
        $or: [
            {
                pickupDate:  { $lt: new Date(returnDate) },
                returnDate:  { $gt: new Date(pickupDate) },
            },
        ],
    };
    if (excludeBookingId) query._id = { $ne: excludeBookingId };

    const opts = session ? { session } : {};
    const conflict = await Booking.findOne(query, null, opts);
    return conflict === null;
};


// ─── API: Check availability for search page ─────────────────────────────────
export const checkAvailabilityOfCar = async (req, res) => {
    try {
        const { location, pickupDate, returnDate } = req.body;

        // Aggregation: find all cars at location → exclude those with overlapping bookings
        const cars = await Car.aggregate([
            { $match: { location, isAvailable: true } },
            {
                $lookup: {
                    from: "bookings",
                    let:  { carId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$car", "$$carId"] },
                                status:     { $nin: ["cancelled"] },
                                pickupDate: { $lte: new Date(returnDate) },
                                returnDate: { $gte: new Date(pickupDate) },
                            },
                        },
                    ],
                    as: "conflicts",
                },
            },
            { $match: { conflicts: { $size: 0 } } },
            { $project: { conflicts: 0 } },
        ]);

        res.json({ success: true, availableCars: cars });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ─── API: Create booking (atomic — prevents race conditions) ──────────────────
export const createBooking = async (req, res) => {
    try {
        const { _id } = req.user;
        const { car, pickupDate, returnDate } = req.body;

        const available = await isCarAvailable(car, pickupDate, returnDate);
        if (!available) {
            return res.status(409).json({ success: false, message: "Car is not available for those dates." });
        }

        const carData = await Car.findById(car);
        if (!carData) {
            return res.status(404).json({ success: false, message: "Car not found." });
        }

        if (!carData.isAvailable) {
            return res.status(409).json({ success: false, message: "This car is currently unlisted." });
        }

        const days  = Math.max(1, Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86_400_000));
        const price = carData.pricePerDay * days;

        await Booking.create({
            car,
            owner: carData.owner,
            user: _id,
            pickupDate: new Date(pickupDate),
            returnDate: new Date(returnDate),
            price,
            status: "pending"
        });

        res.json({ success: true, message: "Booking created successfully. Awaiting owner approval." });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ─── API: Get user bookings ───────────────────────────────────────────────────
export const getUserBookings = async (req, res) => {
    try {
        const { _id } = req.user;
        const bookings = await Booking.find({ user: _id })
            .populate("car")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, bookings });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ─── API: Get owner bookings ──────────────────────────────────────────────────
export const getOwnerBookings = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const bookings = await Booking.find({ owner: req.user._id })
            .populate("car")
            .populate({ path: "user", select: "-password" })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, bookings });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ─── API: Owner changes booking status ───────────────────────────────────────
export const changeBookingStatus = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId, status } = req.body; // validated by Zod in route

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (booking.owner.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        booking.status = status;
        await booking.save();

        res.json({ success: true, message: `Booking marked as ${status}` });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ─── API: User cancels booking ────────────────────────────────────────────────
export const cancelBooking = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (booking.user.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({ success: false, message: "Booking is already cancelled" });
        }

        if (booking.status === "completed") {
            return res.status(400).json({ success: false, message: "Completed bookings cannot be cancelled" });
        }

        booking.status = "cancelled";
        await booking.save();

        res.json({ success: true, message: "Booking cancelled successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ─── API: User edits booking dates ───────────────────────────────────────────
export const editBooking = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId, pickupDate, returnDate } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (booking.user.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        if (["cancelled", "completed"].includes(booking.status)) {
            return res.status(400).json({ success: false, message: `Cannot edit a ${booking.status} booking` });
        }

        const available = await isCarAvailable(booking.car, pickupDate, returnDate, bookingId);
        if (!available) {
            return res.status(409).json({ success: false, message: "Car is not available for those dates" });
        }

        const carData = await Car.findById(booking.car);
        const days    = Math.max(1, Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86_400_000));
        const price   = carData.pricePerDay * days;

        booking.pickupDate = new Date(pickupDate);
        booking.returnDate = new Date(returnDate);
        booking.price      = price;
        booking.status     = "pending"; // reset to pending on date change — owner must re-approve
        await booking.save();

        res.json({ success: true, message: "Booking updated. Awaiting owner re-approval." });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};