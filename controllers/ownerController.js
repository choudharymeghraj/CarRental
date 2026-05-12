import imageKit from "../config/imagekit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import fs from "fs";

// ─── Change user role to owner ────────────────────────────────────────────────
export const changeRoleToOwner = async (req, res) => {
    try {
        const { _id } = req.user;
        await User.findByIdAndUpdate(_id, { role: "owner" });
        res.json({ success: true, message: "Now you can list cars" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Add a car listing ────────────────────────────────────────────────────────
export const addCar = async (req, res) => {
    try {
        const { _id } = req.user;
        let car = JSON.parse(req.body.carData);
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ success: false, message: "Image is required" });
        }

        const fileBuffer = fs.readFileSync(imageFile.path);
        const response = await imageKit.upload({
            file:     fileBuffer,
            fileName: imageFile.filename,   // use our random filename, not original
            folder:   "/car",
        });

        // Clean up temp file
        fs.unlinkSync(imageFile.path);

        const optimizedImageUrl = imageKit.url({
            path: response.filePath,
            transformation: [
                { width: "1280" },
                { quality: "auto" },
                { format: "webp" },
            ],
        });

        await Car.create({ ...car, owner: _id, image: optimizedImageUrl });
        res.json({ success: true, message: "Car added successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Get owner's cars ─────────────────────────────────────────────────────────
export const getOwnerCars = async (req, res) => {
    try {
        const { _id } = req.user;
        const cars = await Car.find({ owner: _id }).lean();
        res.json({ success: true, cars });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Toggle car availability ──────────────────────────────────────────────────
export const toggleCarAvailability = async (req, res) => {
    try {
        const { _id } = req.user;
        const { carId } = req.body;

        const car = await Car.findById(carId);
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        if (car.owner.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        car.isAvailable = !car.isAvailable;
        await car.save();

        res.json({ success: true, message: `Car is now ${car.isAvailable ? "available" : "unavailable"}` });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Delete car (actually deletes the document) ───────────────────────────────
export const deleteCar = async (req, res) => {
    try {
        const { _id } = req.user;
        const { carId } = req.body;

        const car = await Car.findById(carId);
        if (!car) return res.status(404).json({ success: false, message: "Car not found" });

        if (car.owner.toString() !== _id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        // Cancel any pending bookings for this car
        await Booking.updateMany(
            { car: carId, status: { $in: ["pending", "confirmed"] } },
            { $set: { status: "cancelled" } }
        );

        await Car.findByIdAndDelete(carId);

        res.json({ success: true, message: "Car removed and related bookings cancelled" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Dashboard — single aggregation pipeline ──────────────────────────────────
export const getDashboardData = async (req, res) => {
    try {
        const { _id, role } = req.user;
        if (role !== "owner") {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const ownerId = new mongoose.Types.ObjectId(String(_id));

        // One aggregation instead of 4 separate queries
        const [summary] = await Booking.aggregate([
            { $match: { owner: ownerId } },
            {
                $facet: {
                    total: [{ $count: "n" }],
                    pending: [
                        { $match: { status: "pending" } },
                        { $count: "n" },
                    ],
                    confirmed: [
                        { $match: { status: "confirmed" } },
                        { $count: "n" },
                    ],
                    revenue: [
                        { $match: { status: "confirmed" } },
                        { $group: { _id: null, sum: { $sum: "$price" } } },
                    ],
                    monthlyRevenue: [
                        {
                            $match: {
                                status: "confirmed",
                                createdAt: {
                                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                                },
                            },
                        },
                        { $group: { _id: null, sum: { $sum: "$price" } } },
                    ],
                    recentBookings: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from:         "cars",
                                localField:   "car",
                                foreignField: "_id",
                                as:           "car",
                            },
                        },
                        { $unwind: { path: "$car", preserveNullAndEmptyArrays: true } },
                    ],
                },
            },
        ]);

        const totalCars = await Car.countDocuments({ owner: ownerId });

        const dashboardData = {
            totalCars,
            totalBookings:     summary?.total?.[0]?.n          ?? 0,
            pendingBookings:   summary?.pending?.[0]?.n        ?? 0,
            completedBookings: summary?.confirmed?.[0]?.n      ?? 0,
            totalRevenue:      summary?.revenue?.[0]?.sum      ?? 0,
            monthlyRevenue:    summary?.monthlyRevenue?.[0]?.sum ?? 0,
            recentBookings:    summary?.recentBookings        ?? [],
        };

        res.json({ success: true, dashboardData });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Update owner profile image ───────────────────────────────────────────────
export const updateUserImage = async (req, res) => {
    try {
        const { _id } = req.user;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ success: false, message: "Image file is required" });
        }

        const fileBuffer = fs.readFileSync(imageFile.path);
        const response = await imageKit.upload({
            file:     fileBuffer,
            fileName: imageFile.filename,
            folder:   "/user",
        });

        fs.unlinkSync(imageFile.path);

        const optimizedImageUrl = imageKit.url({
            path: response.filePath,
            transformation: [
                { width: "400" },
                { quality: "auto" },
                { format: "webp" },
            ],
        });

        await User.findByIdAndUpdate(_id, { image: optimizedImageUrl });
        res.json({ success: true, message: "Profile image updated" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
