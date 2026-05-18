import { CONNECTION } from '../common/enums/USER'
import { ConnectionCacheEntry } from '../common/interfaces/IUser'

const cache = new Map<string, ConnectionCacheEntry>()

export const setConnectionCache = (data: ConnectionCacheEntry) => {
    cache.set(data.userUuid, { ...data })
}

export const getConnectionCache = (userUuid: string): ConnectionCacheEntry | undefined => {
    return cache.get(userUuid)
}

export const deleteConnectionCache = (userUuid: string) => {
    cache.delete(userUuid)
}

export const updateConnectionStatusCache = (userUuid: string, status: CONNECTION) => {

    const entry = cache.get(userUuid)

    if (entry) {
        entry.status = status
    }

}

export const incrementConversationsCache = (userUuid: string) => {

    const entry = cache.get(userUuid)

    if (entry) {
        entry.conversationsActive++
    }

}

export const decrementConversationsCache = (userUuid: string) => {

    const entry = cache.get(userUuid)

    if (entry && entry.conversationsActive > 0) {
        entry.conversationsActive--
    }

}

export const setConversationsActiveCache = (userUuid: string, count: number) => {

    const entry = cache.get(userUuid)

    if (entry) {
        entry.conversationsActive = count
    }

}

export const getAllConnectionsCache = (): ConnectionCacheEntry[] => {
    return Array.from(cache.values()).filter((operator) => operator.status == CONNECTION.ONLINE)
}
