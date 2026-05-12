import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';

// Initialize Razorpay
// Note: Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in your .env
const razorpayInstance = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay Order
 * POST /api/payment/create-order
 */
export const createOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.user._id;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // 1. Ownership & Status Validation
        if (booking.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to pay for this booking" });
        }

        if (booking.status !== 'confirmed') {
            return res.status(400).json({ success: false, message: "Booking must be approved by owner before payment" });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: "Booking is already paid" });
        }

        // 2. Razorpay expects amount in subunits (e.g., paise for INR)
        // Multiplying by 100 for subunits
        const options = {
            amount:   Number(booking.price) * 100, 
            currency: process.env.CURRENCY_CODE || "INR",
            receipt:  `receipt_booking_${bookingId}`,
        };

        const order = await razorpayInstance.orders.create(options);

        // Save Order ID to booking
        booking.razorpayOrderId = order.id;
        await booking.save();

        res.status(200).json({
            success: true,
            order,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Verify Razorpay Payment Signature
 * POST /api/payment/verify
 */
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment successful
            const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });

            if (booking) {
                booking.paymentStatus     = 'paid';
                booking.razorpayPaymentId = razorpay_payment_id;
                booking.paidAt            = new Date();
                // Optionally update booking status to 'confirmed' if you want to use that as 'fully complete'
                await booking.save();

                return res.status(200).json({ success: true, message: "Payment Verified & Success" });
            } else {
                return res.status(404).json({ success: false, message: "Booking for this order not found" });
            }
        } else {
            return res.status(400).json({ success: false, message: "Invalid Payment Signature" });
        }

    } catch (error) {
        console.error("Razorpay Verify Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
