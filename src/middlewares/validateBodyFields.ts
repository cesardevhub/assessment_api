import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { RequestResponse } from "../helpers/requestResponse";

export const validateFields = (req: Request, res: Response, next: NextFunction) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).send(RequestResponse(400, "Some params are required", true, errors.mapped()));
    }

    return next();

};