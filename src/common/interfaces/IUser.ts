import { CONNECTION } from "../enums/USER"

export interface IUser {
    uuid: string,
    name: string,
    email: string,
    password: string,
    roleUuid: string
}

export interface ConnectionCacheEntry {
    connectionUuid: string
    userUuid: string
    status: CONNECTION
    conversationsActive: number
}