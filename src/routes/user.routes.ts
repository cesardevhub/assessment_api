import { Router } from "express";

import {
    login,
    obtainAllUsers,
    getMyUser,
    logout,
    createNewUser,
    setUser,
    removeUser
} from "../controllers/user.controller";

import { check } from "express-validator";
import { validateFields } from "../middlewares/validateBodyFields";
import { validateToken } from "../middlewares/validateToken";
import { validateAdminRole } from "../middlewares/validateAdminRole";
import { loginLimiter } from "../middlewares/validateLoginAccess";

const router = Router()

router.post("/login", [
    loginLimiter,
    check("email", "email is required").trim().not().isEmpty(),
    check("password", "password is required").trim().not().isEmpty(),
    validateFields
], login)

router.get("/information", validateToken, getMyUser)
router.post("/logout", validateToken, logout)

router.get("/", [
    validateToken,
    validateAdminRole
], obtainAllUsers)

router.post("/", [
    validateToken,
    validateAdminRole,
    check("name", "name is required").trim().not().isEmpty(),
    check("email", "email is required").trim().not().isEmpty(),
    check("password", "password is required").trim().not().isEmpty(),
    check("roleUuid", "roleUuid is required").trim().not().isEmpty(),
    validateFields
], createNewUser)

router.patch("/:uuid", [
    validateToken,
    validateAdminRole,
    check("name", "name is required").trim().not().isEmpty(),
    check("email", "email is required").trim().not().isEmpty(),
    check("roleUuid", "roleUuid is required").trim().not().isEmpty(),
    validateFields
], setUser)

router.delete("/:uuid", [
    validateToken,
    validateAdminRole
], removeUser)

export default router