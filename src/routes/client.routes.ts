import { Router } from "express"
import { check } from "express-validator"
import { validateFields } from "../middlewares/validateBodyFields"
import { validateToken } from "../middlewares/validateToken"
import {
    clientLogin,
    createNewClient,
    getMyUser,
    obtainClient,
    obtainClients,
    setClient
} from "../controllers/client.controller"
import { validateTokenClient } from "../middlewares/validateTokenClient"

const router = Router()

router.post("/login", [
    check("email", "email is required").trim().not().isEmpty(),
    validateFields
], clientLogin)

router.get("/:uuid", validateToken, obtainClient)
router.get("/information", validateTokenClient, getMyUser)

router.post("/obtain", validateToken , obtainClients)

router.post("/", [
    validateToken,
    check("name", "name is required").trim().not().isEmpty(),
    check("email", "email is required").trim().not().isEmpty(),
    check("email", "email does not comply with the format").isEmail(),
    validateFields
], createNewClient)

router.patch("/:uuid", [
    validateToken,
    check("email", "email does not comply with the format").optional().isEmail(),
    validateFields
], setClient)

export default router
