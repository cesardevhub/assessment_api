import rateLimit from "express-rate-limit";
import { RequestResponse } from "../helpers/requestResponse";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: RequestResponse(429, "Too many login attempts, please try again in 15 minutes", true, []),
    standardHeaders: "draft-7",
    legacyHeaders: false
})