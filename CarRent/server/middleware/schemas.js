/**
 * schemas.js — Zod validation schemas for all API routes
 */
import { z } from "zod";

const mongoId = z.string().length(24, "Must be a valid 24-char MongoDB ID");
const dateStr  = (field) =>
    z.string().refine((d) => !isNaN(Date.parse(d)), { message: `${field} must be a valid date` });

// ─── Booking ──────────────────────────────────────────────────────────────────

export const createBookingSchema = z
    .object({
        car:        mongoId,
        pickupDate: dateStr("pickupDate"),
        returnDate: dateStr("returnDate"),
    })
    .refine((d) => new Date(d.returnDate) > new Date(d.pickupDate), {
        message: "Return date must be after pickup date",
        path: ["returnDate"],
    });

export const changeStatusSchema = z.object({
    bookingId: mongoId,
    status:    z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

export const cancelBookingSchema = z.object({
    bookingId: mongoId,
});

export const editBookingSchema = z
    .object({
        bookingId:  mongoId,
        pickupDate: dateStr("pickupDate"),
        returnDate: dateStr("returnDate"),
    })
    .refine((d) => new Date(d.returnDate) > new Date(d.pickupDate), {
        message: "Return date must be after pickup date",
        path: ["returnDate"],
    });

// ─── Car ─────────────────────────────────────────────────────────────────────

export const addCarSchema = z.object({
    brand:            z.string().min(1).max(50),
    model:            z.string().min(1).max(60),
    year:             z.number().int().min(1990).max(new Date().getFullYear() + 1),
    category:         z.string().min(1).max(50),
    seating_capacity: z.number().int().min(1).max(20),
    fuel_type:        z.enum(["Petrol", "Diesel", "Electric", "Hybrid", "CNG"]),
    transmission:     z.enum(["Automatic", "Manual"]),
    pricePerDay:      z.number().positive().max(100_000),
    location:         z.string().min(2).max(100),
    description:      z.string().min(10).max(1000),
});

export const toggleCarSchema = z.object({
    carId: mongoId,
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
    name:     z.string().min(2).max(60),
    email:    z.string().email(),
    password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
    email:    z.string().email(),
    password: z.string().min(1),
});
