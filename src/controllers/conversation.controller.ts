import { Request, Response } from "express"
import { RequestResponse } from "../helpers/requestResponse"

import {
    finishConversation,
    getConversation,
    getConversations,
    getMessagesByClientUuid,
    receiveMessage,
    sendMessage,
    transferConversation
} from "../services/conversation"

import { MESSAGE_TYPE } from "../common/enums/MESSAGE"
import { IConversationFilters } from "../common/interfaces/IConversation"

export const receiveClientMessage = async (req: Request, res: Response) => {

    try {

        const { content } = req.body

        const response = await receiveMessage(req.user!.uuid, content)
        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error receiving message:", error.message)
            return res.status(500).send(RequestResponse(500, `Error receiving message: ${error.message}`, true, []))
        }

        console.log("Unknown error receiving message:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error receiving message", true, []))

    }

}

export const obtainConversations = async (req: Request, res: Response) => {

    try {

        const { page, limit, active, userUuid, startDate, endDate, search } = req.body

        const filters: IConversationFilters = {
            active,
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string),
        }

        if (typeof userUuid === 'string') filters.userUuid = userUuid
        if (typeof search === 'string') filters.search = search

        const response = await getConversations(
            filters,
            { page: Number(page), limit: Number(limit) },
            req.user!.roleName,
            req.user!.uuid
        )

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error obtaining conversations:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining conversations: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining conversations:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error obtaining conversations", true, []))

    }

}

export const obtainConversation = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const { page, limit } = req.body

        const conversationUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const response = await getConversation(
            conversationUuid || "",
            { page: Number(page), limit: Number(limit) },
            req.user!.roleName,
            req.user!.uuid
        )

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error obtaining conversation:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining conversation: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining conversation:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error obtaining conversation", true, []))

    }

}

export const obtainMessagesByClientUuid = async (req: Request, res: Response) => {

    try {

        const { page, limit } = req.body

        const response = await getMessagesByClientUuid(
            req.user!.uuid,
            { page: Number(page), limit: Number(limit) },
        )

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error obtaining client conversation:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining client conversation: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining client conversation:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error obtaining client conversation", true, []))

    }

}

export const createMessage = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const { type, content, clientUuid } = req.body

        const conversationUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const response = await sendMessage(
            conversationUuid || "",
            clientUuid,
            req.user!.roleName,
            req.user!.uuid,
            type as MESSAGE_TYPE,
            content
        )

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error sending message:", error.message)
            return res.status(500).send(RequestResponse(500, `Error sending message: ${error.message}`, true, []))
        }

        console.log("Unknown error sending message:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error sending message", true, []))

    }

}

export const finishActiveConversation = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const { reason } = req.body

        const conversationUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const response = await finishConversation(
            conversationUuid || "",
            reason,
            req.user!.roleName,
            req.user!.uuid
        )

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error finishing conversation:", error.message)
            return res.status(500).send(RequestResponse(500, `Error finishing conversation: ${error.message}`, true, []))
        }

        console.log("Unknown error finishing conversation:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error finishing conversation", true, []))

    }

}

export const transferActiveConversation = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const { userUuid } = req.body

        const conversationUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const response = await transferConversation(conversationUuid || "", userUuid)
        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error transferring conversation:", error.message)
            return res.status(500).send(RequestResponse(500, `Error transferring conversation: ${error.message}`, true, []))
        }

        console.log("Unknown error transferring conversation:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error transferring conversation", true, []))

    }

}
