import { MessageModel } from "../models/message"
import { IMessage } from "../common/interfaces/IMessage"
import { IPagination } from "../common/interfaces/IConversation"

export const createMessageDB = async (message: IMessage) => {
    await MessageModel.create(message)
}

export const obtainRecentMessagesByConversationDB = async (conversationUuid: string): Promise<IMessage[]> => {

    const messages = await MessageModel
        .find({ conversationUuid }, { _id: 0 })
        .sort({ createdAt: -1 })
        .lean()

    return (messages as unknown as IMessage[]).reverse()

}

export const obtainMessagesByConversationDB = async (conversationUuid: string, pagination: IPagination) => {

    const skip  = (pagination.page - 1) * pagination.limit
    const total = await MessageModel.countDocuments({ conversationUuid })

    const messages = await MessageModel.find({ conversationUuid }, { _id: 0 })
        .sort({ createdAt: 1 }).skip(skip).limit(pagination.limit).lean()

    const nextPage = (pagination.page + 1) * pagination.limit < total ? true : false

    return {
        messages,
        total,
        nextPage,
        totalPages: Math.ceil(total / pagination.limit)
    }

}

export const obtainMessagesByClientUuidDB = async (clientUuid: string, pagination: IPagination) => {

    const skip  = (pagination.page - 1) * pagination.limit
    const total = await MessageModel.countDocuments({ clientUuid })

    const messages = await MessageModel.find({ clientUuid }, { _id: 0 })
        .sort({ createdAt: 1 }).skip(skip).limit(pagination.limit).lean()

    const nextPage = (pagination.page + 1) * pagination.limit < total ? true : false

    return {
        messages,
        total,
        nextPage,
        totalPages: Math.ceil(total / pagination.limit)
    }

}
