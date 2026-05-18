import { RequestResponse } from "../helpers/requestResponse"
import { generateUuid } from "../helpers/generateUuid"
import { IConversationFilters, IPagination } from "../common/interfaces/IConversation"
import { IMessage } from "../common/interfaces/IMessage"
import { FROM, MESSAGE_TYPE } from "../common/enums/MESSAGE"
import { CONNECTION, USER_ROLE } from "../common/enums/USER"

import {
    createConversationDB,
    finishConversationDB,
    obtainActiveConversationByClientUuid,
    obtainConversationByUuid,
    obtainConversationsDB,
    updateConversationDB,
    transferConversationDB
} from "../repositories/conversation.repository"

import {
    createMessageDB,
    obtainMessagesByClientUuidDB,
    obtainMessagesByConversationDB,
    obtainRecentMessagesByConversationDB
} from "../repositories/message.repository"

import { generateAgentReply, generateDecision } from "./llm"

import {
    obtainConnectionByUserUuid,
    incrementConversationsActiveDB,
    decrementConversationsActiveDB,
    obtainAllOnlineUser
} from "../repositories/userConnection.repository"

import { emitToConversation, getIO } from "../config/socket"
import { format, isAfter, isValid } from "date-fns"
import { getAllConnectionsCache } from "../cache/connectionCache"
import { obtainClientAppointmentsDB } from "../repositories/appointment.repository"

const dispatchAgentReply = async (conversationUuid: string, clientUuid: string) => {

    try {

        const history = await obtainRecentMessagesByConversationDB(conversationUuid)
        const decision = await generateDecision(history)

        if (decision.length !== 0 && (decision[0] != "no" || decision[1] != "no")) {

            if (decision[1] == "si") {
                await finishConversation(conversationUuid, "Usuario pidió finalizar la conversación", FROM.AGENT, "")

            } else if (decision[0] == "si") {

                let connections = getAllConnectionsCache()

                if (connections.length == 0) {
                    connections = await obtainAllOnlineUser();
                }

                if (connections.length !== 0) {
                    const sorted = connections.sort((a, b) => a.conversationsActive - b.conversationsActive);
                    await transferConversation(conversationUuid, sorted[0]?.userUuid || "", false)

                } else {

                    const agentMessage: IMessage = {
                        uuid: generateUuid(),
                        conversationUuid,
                        clientUuid,
                        from: FROM.AGENT,
                        message: { type: MESSAGE_TYPE.TEXT, content: { text: "Lo sentimos, en este momento no tenemos asesores disponibles." } },
                        createdAt: new Date().toISOString()
                    }

                    await createMessageDB(agentMessage)
                    await updateConversationDB(conversationUuid)
                    emitToConversation(conversationUuid, 'message:new', agentMessage)

                }

            }

            return

        }

        const page = 1;
        const limit = 5;

        const { appointments } = await obtainClientAppointmentsDB({clientUuid, page, limit})

        const replyText = await generateAgentReply(history, appointments.map(appointment => {
            return {
                idPropiedad: appointment.propertyEstateId,
                fechaVisita: format(appointment.date, "yyyy-MM-dd HH:mm:ss"),
                fechaCreacion: format(appointment.updatedAt, "yyyy-MM-dd HH:mm:ss"),
                estado: appointment.status
            }
        }))

        if (!replyText) {
            return
        }

        const agentMessage: IMessage = {
            uuid: generateUuid(),
            conversationUuid,
            clientUuid,
            from: FROM.AGENT,
            message: { type: MESSAGE_TYPE.TEXT, content: { text: replyText } },
            createdAt: new Date().toISOString()
        }

        await createMessageDB(agentMessage)
        await updateConversationDB(conversationUuid)

        emitToConversation(conversationUuid, 'message:new', agentMessage)

    } catch (error: unknown) {
        console.error('[receiveMessage] Agent reply failed:', error)
    }

}

export const receiveMessage = async (clientUuid: string, content: string) => {

    let conversation = await obtainActiveConversationByClientUuid(clientUuid)
    let isNew = false

    if (!conversation) {
        const newUuid = generateUuid()
        conversation = await createConversationDB(newUuid, clientUuid)
        isNew = true
    }

    const message: IMessage = {
        uuid: generateUuid(),
        conversationUuid: conversation.uuid,
        clientUuid,
        from: FROM.CLIENT,
        message: {
            type: MESSAGE_TYPE.TEXT,
            content: { text: content }
        },
        createdAt: new Date().toISOString()
    }

    await createMessageDB(message)
    await updateConversationDB(conversation.uuid)

    if (isNew) {
        getIO().emit('conversation:new', { conversationUuid: conversation.uuid, clientUuid })
    } else {
        emitToConversation(conversation.uuid, 'message:new', message)
    }

    if (!conversation.userUuid) {
        await dispatchAgentReply(conversation.uuid, clientUuid)
    }

    return RequestResponse(201, "Message received", false, { conversationUuid: conversation.uuid })

}

export const getConversations = async (filters: IConversationFilters, pagination: IPagination, operator: string, userUuid: string) => {

    if (!isValid(filters.startDate) || !isValid(filters.endDate)) {
        return RequestResponse(400, "Invalid date format", true, [])
    }

    if (!isAfter(filters.endDate, filters.startDate)) {
        return RequestResponse(400, "Invalid date. start date must be before", true, [])
    }

    const user = operator === USER_ROLE.OPERATOR ? userUuid : undefined
    const conversations = await obtainConversationsDB(filters, pagination, user)

    return RequestResponse(200, "Conversations obtained successfully", false, conversations)

}

export const getConversation = async (uuid: string, pagination: IPagination, role: string, userUuid: string) => {

    const conversation = await obtainConversationByUuid(uuid)

    if (!conversation) {
        return RequestResponse(404, "Conversation not found", true, [])
    }

    if (role === USER_ROLE.OPERATOR && conversation.userUuid !== userUuid) {
        return RequestResponse(403, "Access denied", true, [])
    }

    const messages = await obtainMessagesByConversationDB(uuid, pagination)

    return RequestResponse(200, "Conversation found", false, {conversation, messages})

}

export const getMessagesByClientUuid = async (clientUuid: string, pagination: IPagination) => {

    const messages = await obtainMessagesByClientUuidDB(clientUuid, pagination)

    if (!messages) {
        return RequestResponse(404, "Messages not found", true, [])
    }

    return RequestResponse(200, "Messages found", false, messages)

}

const isActive = (conversation: { finishedAt: Date | null; updatedAt: Date }): boolean => {

    if (conversation.finishedAt !== null) {
        return false
    }

    const limit = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return new Date(conversation.updatedAt) >= limit

}

export const sendMessage = async (
conversationUuid: string,
clientUuid: string,
role: string,
userUuid: string,
type: MESSAGE_TYPE,
content: { header?: string; text?: string }
) => {

    const conversation = await obtainConversationByUuid(conversationUuid)

    if (!conversation) {
        return RequestResponse(404, "Conversation not found", true, [])
    }

    if (role === USER_ROLE.OPERATOR && conversation.userUuid !== userUuid) {
        return RequestResponse(403, "Access denied", true, [])
    }

    if (!isActive(conversation as { finishedAt: Date | null; updatedAt: Date })) {
        return RequestResponse(400, "Conversation is not active", true, [])
    }

    const message: IMessage = {
        uuid: generateUuid(),
        conversationUuid,
        clientUuid,
        from: role as FROM,
        message: { type, content },
        createdAt: new Date().toISOString()
    }

    await createMessageDB(message)
    await updateConversationDB(conversationUuid)

    emitToConversation(conversationUuid, 'message:new', message)

    return RequestResponse(201, "Message sent successfully", false, [])

}

export const finishConversation = async (uuid: string, reason: string, role: string, userUuid: string) => {

    const conversation = await obtainConversationByUuid(uuid)

    if (!conversation) {
        return RequestResponse(404, "Conversation not found", true, [])
    }

    if (role === USER_ROLE.OPERATOR && conversation.userUuid !== userUuid) {
        return RequestResponse(403, "Access denied", true, [])
    }

    if (!isActive(conversation as { finishedAt: Date | null; updatedAt: Date })) {
        return RequestResponse(400, "Conversation is not active", true, [])
    }

    await finishConversationDB(uuid, reason)

    if (conversation.userUuid) {
        await decrementConversationsActiveDB(conversation.userUuid)
    }

    getIO().emit('conversation:finished', { uuid, reason })

    return RequestResponse(200, "Conversation finished successfully", false, [])

}

export const transferConversation = async (conversationUuid: string, userUuid: string, validateData = true) => {

    const conversation = await obtainConversationByUuid(conversationUuid)

    if (!conversation) {
        return RequestResponse(404, "Conversation not found", true, [])
    }

    if (validateData) {

        if (!isActive(conversation as { finishedAt: Date | null; updatedAt: Date })) {
            return RequestResponse(400, "Conversation is not active", true, [])
        }

        const connection = await obtainConnectionByUserUuid(userUuid)

        if (!connection || connection.status !== CONNECTION.ONLINE) {
            return RequestResponse(400, "Operator is not connected", true, [])
        }

    }

    const previousUserUuid = conversation.userUuid

    await transferConversationDB(conversationUuid, userUuid)
    await incrementConversationsActiveDB(userUuid)

    if (previousUserUuid && previousUserUuid !== userUuid) {
        await decrementConversationsActiveDB(previousUserUuid)
    }

    getIO().emit('conversation:transferred', { conversationUuid, userUuid })

    return RequestResponse(200, "Conversation transferred successfully", false, [])

}