import { Request, Response, NextFunction } from "express";
import { RequestResponse } from "../helpers/requestResponse";
import { USER_ROLE } from "../common/enums/USER";

export const validateAdminRole = (req: Request, res: Response, next: NextFunction) => {

    const token = req.user;

    if (!token) {
        return res.status(403).send(RequestResponse(403, "Invalid Token", true, []));
    }

    if (token.roleName == USER_ROLE.ADMIN) {
        return next();
    }

    return res.status(403).send(RequestResponse(403, "User must be an Administrador", true, []))
}