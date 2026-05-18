import { ConversationModel } from "../models/conversation"
import { ClientModel } from "../models/client"
import { IConversationFilters, IPagination } from "../common/interfaces/IConversation"

export const obtainActiveConversationByClientUuid = async (clientUuid: string) => {
    return await ConversationModel.findOne({
        clientUuid, 
        finishedAt: null,
        updatedAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
    }).lean()
}

export const createConversationDB = async (uuid: string, clientUuid: string) => {
    return await ConversationModel.create({ uuid, clientUuid })
}

export const obtainConversationsDB = async (filters: IConversationFilters, pagination: IPagination, userUuid?: string) => {

    const query: Record<string, unknown> = {}

    if (userUuid) query['userUuid'] = userUuid
    if (filters.userUuid) query['userUuid'] = filters.userUuid

    if (filters.active) {
        query['finishedAt'] = null

    } else {
        query['finishedAt'] = { $ne: null }
    }

    query['updatedAt'] = {
        $gte: filters.startDate.toISOString(),
        $lte: filters.endDate.toISOString()
    }

    if (filters.search) {

        const regex = { $regex: filters.search, $options: "i" }

        const clients = await ClientModel.find({
            $or: [ { name: regex }, { email: regex } ]
        }, { _id: 0, uuid: 1 }).lean()

        query['clientUuid'] = { $in: clients.map(c => c.uuid) }

    }

    const skip  = (pagination.page - 1) * pagination.limit
    const total = await ConversationModel.countDocuments(query)

    const conversations = await ConversationModel.find(query, { _id: 0 })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean()

    const nextPage = (pagination.page + 1) * pagination.limit < total ? true : false

    return {
        conversations,
        total,
        nextPage,
        totalPages: Math.ceil(total / pagination.limit)
    }

}

export const obtainConversationByUuid = async (uuid: string) => {
    return await ConversationModel.findOne({ uuid }).lean()
}

export const obtainClientConversationsDB = async (clientUuid: string, pagination: IPagination) => {

    const skip  = (pagination.page - 1) * pagination.limit
    const total = await ConversationModel.countDocuments({ clientUuid })

    const conversations = await ConversationModel.find({ clientUuid }, { _id: 0 })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean()

    const nextPage = (pagination.page + 1) * pagination.limit < total ? true : false

    return {
        conversations,
        total,
        nextPage,
        totalPages: Math.ceil(total / pagination.limit)
    }

}

export const updateConversationDB = async (uuid: string) => {
    await ConversationModel.updateOne({ uuid }, { $set: { updatedAt: new Date() } })
}

export const finishConversationDB = async (uuid: string, reason: string) => {
    await ConversationModel.updateOne({uuid }, { $set: { finishedAt: new Date(), reason, analized: true } })
}

export const transferConversationDB = async (uuid: string, userUuid: string) => {
    await ConversationModel.updateOne({ uuid }, { $set: { userUuid } })
}

export const countActiveConversationsByUser = async (): Promise<{ userUuid: string; count: number }[]> => {

    const result = await ConversationModel.aggregate<{ _id: string; count: number }>([
        {
            $match: {
                finishedAt: null,
                userUuid: { $ne: null },
                updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
            }
        },
        {
            $group: {
                _id: '$userUuid',
                count: { $sum: 1 }
            }
        }
    ])

    return result.map(({ _id, count }) => ({ userUuid: _id, count }))

}