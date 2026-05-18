import { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { validateAdminRole } from "../middlewares/validateAdminRole";
import { obtainAllRoles } from "../controllers/role.controller";

const router = Router()

router.get("/", [
    validateToken,
    validateAdminRole
], obtainAllRoles)

export default router