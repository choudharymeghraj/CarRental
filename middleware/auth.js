import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.headers.authorization;

    if (!token) {
        return res.json({ success: false, message: "not authorized" })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (!decoded || !decoded._id) {
            return res.json({ success: false, message: "not authorized" })
        }

        req.user = await User.findById(decoded._id).select("-password")
        if (!req.user) {
            return res.status(401).json({ success: false, message: "User not found" })
        }

        next();

    }
    catch (error) {
        return res.json({ success: false, message: "not authorized" })
    }
}
