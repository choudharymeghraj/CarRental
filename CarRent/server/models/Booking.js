import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema({
    car:         { type: ObjectId, ref: "Car",  required: true },
    user:        { type: ObjectId, ref: "User", required: true },
    owner:       { type: ObjectId, ref: "User", required: true },
    pickupDate:  { type: Date, required: true },
    returnDate:  { type: Date, required: true },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    price: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod:     { type: String, default: 'razorpay' },
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },
    paidAt:            { type: Date }
}, { timestamps: true });

// Compound indexes for fast overlap queries and owner/user list views
bookingSchema.index({ car: 1, pickupDate: 1, returnDate: 1 });
bookingSchema.index({ owner: 1, createdAt: -1 });
bookingSchema.index({ user:  1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;