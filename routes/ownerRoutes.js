import express from "express";
import { addCar, changeRoleToOwner, getDashboardData, getOwnerCars, toggleCarAvailability, deleteCar, updateUserImage } from "../controllers/ownerController.js";
import { protect, isOwner } from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const ownerRouter = express.Router();

ownerRouter.post('/change-role', protect, changeRoleToOwner);
ownerRouter.post("/add-car", protect, isOwner, upload.single("image"), addCar)
ownerRouter.get("/cars", protect, isOwner, getOwnerCars)
ownerRouter.post("/toggle-car", protect, isOwner, toggleCarAvailability)
ownerRouter.post("/delete-car", protect, isOwner, deleteCar)
ownerRouter.get("/dashboard", protect, isOwner, getDashboardData)
ownerRouter.post("/update-image", protect, isOwner, upload.single("image"), updateUserImage)

export default ownerRouter;