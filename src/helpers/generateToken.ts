import jwt from "jsonwebtoken"
import { IUserToken } from "../common/interfaces/IUserToken";

export const generateToken = (payload: IUserToken) => {
    const JWT_SECRET = process.env['SECRET_KEY_JWT'] || ""
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}