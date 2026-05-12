/**
 * validate.js — Zod-based request validation middleware
 * Wraps Zod schemas and returns 400 with structured errors on failure.
 */
import { z } from "zod";

export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.errors.map(
            (e) => `${e.path.join(".") || "body"}: ${e.message}`
        );
        return res.status(400).json({ success: false, message: errors.join("; ") });
    }
    req.body = result.data; // use sanitised & coerced data downstream
    next();
};
