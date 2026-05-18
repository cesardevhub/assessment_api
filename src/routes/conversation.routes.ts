import { Router } from "express"
import { check } from "express-validator"
import { validateFields } from "../middlewares/validateBodyFields"
import { validateToken } from "../middlewares/validateToken"
import { validateAdminRole } from "../middlewares/validateAdminRole"
import { MESSAGE_TYPE } from "../common/enums/MESSAGE"

import {
    createMessage,
    finishActiveConversation,
    obtainConversation,
    obtainConversations,
    obtainMessagesByClientUuid,
    receiveClientMessage,
    transferActiveConversation
} from "../controllers/conversation.controller"
import { validateTokenClient } from "../middlewares/validateTokenClient"

const router = Router()

router.post("/receive", [
    validateTokenClient,
    check("type", "type must be text, product, image or document").isIn(Object.values(MESSAGE_TYPE)),
    check("content", "content is required").trim().not().isEmpty(),
    validateFields
], receiveClientMessage)

router.post("/client", [
    validateTokenClient,
    check("page", "page must be a positive number").isInt({ min: 1 }),
    check("limit", "limit must be a positive number").isInt({ min: 1 }),
    validateFields
], obtainMessagesByClientUuid)

router.post("/", [
    validateToken,
    check("page", "page must be a positive number").isInt({ min: 1 }),
    check("limit", "limit must be a positive number").isInt({ min: 1 }),
    check("active", "acitve must be true or false").isBoolean(),
    check("startDate", "startDate is required").trim().not().isEmpty(),
    check("endDate", "endDate is required").trim().not().isEmpty(),
    validateFields
], obtainConversations)

router.post("/:uuid", [
    validateToken,
    check("page", "page must be a positive number").isInt({ min: 1 }),
    check("limit", "limit must be a positive number").isInt({ min: 1 }),
    validateFields
], obtainConversation)

router.post("/:uuid/messages", [
    validateToken,
    check("type", "type is required").trim().not().isEmpty(),
    check("type", "type must be text, product, image or document").isIn(Object.values(MESSAGE_TYPE)),
    check("content.text", "content is required").trim().not().isEmpty(),
    validateFields
], createMessage)

router.patch("/:uuid/finish", [
    validateToken,
    check("reason", "reason is required").trim().not().isEmpty(),
    validateFields
], finishActiveConversation)

router.patch("/:uuid/transfer", [
    validateToken,
    validateAdminRole,
    check("userUuid", "userUuid is required").trim().not().isEmpty(),
    validateFields
], transferActiveConversation)

export default router
