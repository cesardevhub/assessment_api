import { Request, Response, NextFunction } from "express";
import { RequestResponse } from "../helpers/requestResponse";
import { IReqToken } from "../common/interfaces/IUserToken";
import jwt from "jsonwebtoken";

export const validateToken = (req: Request, res: Response, next: NextFunction) => {

    try {

        const token = req.cookies["token"];

        if (!token) {
            return res.status(401).send(RequestResponse(401, "Invalid Token", true, []));
        }

        const JWT_SECRET = process.env['SECRET_KEY_JWT'] || ""
        const tokenParse = jwt.verify(token, JWT_SECRET);
        req.user = tokenParse as IReqToken
        return next();

    } catch (err) {
        console.log(err);
        return res.status(403).send(RequestResponse(403, "Invalid Token", true, []));
    }

}