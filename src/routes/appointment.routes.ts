import { Router } from "express"
import { check } from "express-validator"
import { validateFields } from "../middlewares/validateBodyFields"
import { validateToken } from "../middlewares/validateToken"
import { STATUS } from "../common/enums/APPOINTMENT"

import {
    addAppointment,
    createNewAppointment,
    getClientAppointments,
    obtainAppointment,
    obtainAppointments,
    setAppointment,
    setAppointmentStatus
} from "../controllers/appointment.controller"

import { validateTokenClient } from "../middlewares/validateTokenClient"

const router = Router()

router.post("/obtain", [
    validateToken,
    check("page", "page is required").trim().not().isEmpty(),
    check("page", "page must be a positive integer").isInt({ min: 1 }),
    check("limit", "limit is required").trim().not().isEmpty(),
    check("limit", "limit must be a positive integer").isInt({ min: 1 }),
    validateFields
], obtainAppointments)

router.post("/client", [
    validateTokenClient,
    check("page", "page must be a positive integer").isInt({ min: 1 }),
    check("limit", "limit must be a positive integer").isInt({ min: 1 }),
    validateFields
], getClientAppointments)

router.get("/:uuid", validateToken, obtainAppointment)

router.post("/create", [
    validateTokenClient,
    check("propertyEstateId", "propertyEstateId is required").trim().not().isEmpty(),
    check("date", "date is required").trim().not().isEmpty(),
    validateFields
], createNewAppointment)

router.post("/add", [
    validateToken,
    check("clientUuid", "clientUuid is required").trim().not().isEmpty(),
    check("propertyEstateId", "propertyEstateId is required").trim().not().isEmpty(),
    check("date", "date is required").trim().not().isEmpty(),
    validateFields
], addAppointment)

router.patch("/:uuid", [
    validateToken,
    check("propertyEstateId", "propertyEstateId must be a string").optional().isString(),
    check("date", "date must be a valid date").optional().trim().not().isEmpty(),
    validateFields
], setAppointment)

router.patch("/:uuid/status", [
    validateToken,
    check("status", "status is required").trim().not().isEmpty(),
    check("status", "status must be pending, cancelled or completed").isIn([STATUS.PENDING, STATUS.CANCELLED, STATUS.COMPLETED]),
    validateFields
], setAppointmentStatus)

export default router
