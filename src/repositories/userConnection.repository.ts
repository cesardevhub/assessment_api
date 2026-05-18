import { UserConnectionModel } from "../models/userConnection"
import { CONNECTION } from "../common/enums/USER"

import {
    setConnectionCache,
    getConnectionCache,
    deleteConnectionCache,
    updateConnectionStatusCache,
    incrementConversationsCache,
    decrementConversationsCache,
    setConversationsActiveCache
} from "../cache/connectionCache"

export const createConnectionDB = async (userUuid: string, connectionUuid: string) => {

    const doc = await UserConnectionModel.create({ connectionUuid, userUuid })

    setConnectionCache({
        connectionUuid: doc.connectionUuid,
        userUuid: doc.userUuid,
        status: doc.status as CONNECTION,
        conversationsActive: doc.conversationsActive
    })

}

export const setConnectionStatusDB = async (userUuid: string, status: CONNECTION) => {
    updateConnectionStatusCache(userUuid, status)
    await UserConnectionModel.updateOne({ userUuid }, { $set: { status } })
}

export const deleteConnectionDB = async (userUuid: string) => {
    deleteConnectionCache(userUuid)
    await UserConnectionModel.deleteOne({ userUuid }).lean()
}

export const obtainConnectionByUserUuid = async (userUuid: string) => {

    const cached = getConnectionCache(userUuid)

    if (cached) return cached

    const doc = await UserConnectionModel.findOne({ userUuid }).lean()

    if (doc) {
        setConnectionCache({
            connectionUuid: doc.connectionUuid,
            userUuid: doc.userUuid,
            status: doc.status as CONNECTION,
            conversationsActive: doc.conversationsActive
        })
    }

    return doc
}

export const refreshConnectionCacheFromDB = async (userUuid: string) => {

    const doc = await UserConnectionModel.findOne({ userUuid }).lean()

    if (doc) {

        setConnectionCache({
            connectionUuid: doc.connectionUuid,
            userUuid: doc.userUuid,
            status: doc.status as CONNECTION,
            conversationsActive: doc.conversationsActive
        })

    } else {
        deleteConnectionCache(userUuid)
    }
}

export const incrementConversationsActiveDB = async (userUuid: string) => {
    incrementConversationsCache(userUuid)
    await UserConnectionModel.updateOne({ userUuid }, { $inc: { conversationsActive: 1 } })
}

export const decrementConversationsActiveDB = async (userUuid: string) => {
    decrementConversationsCache(userUuid)
    await UserConnectionModel.updateOne({ userUuid }, { $inc: { conversationsActive: -1 } })
}

export const syncConversationsActiveDB = async (userUuid: string, count: number) => {
    setConversationsActiveCache(userUuid, count)
    await UserConnectionModel.updateOne({ userUuid }, { $set: { conversationsActive: count } })
}

export const obtainAllConnectionUserUuids = async (): Promise<string[]> => {
    const docs = await UserConnectionModel.find({}, { userUuid: 1, _id: 0 }).lean()
    return docs.map((d) => d.userUuid)
}

export const obtainAllOnlineUser = async () => {
    return await UserConnectionModel.find({ status: CONNECTION.ONLINE}, { userUuid: 1, _id: 0 }).lean()
}