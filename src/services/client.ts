import jwt from "jsonwebtoken"
import { RequestResponse } from "../helpers/requestResponse"
import { IClient, IClientFilters } from "../common/interfaces/IClient"

import {
    createClientDB,
    obtainClientByEmail,
    obtainClientByUuid,
    obtainClientsDB,
    updateClientDB,
} from "../repositories/client.repository"

import { FROM } from "../common/enums/MESSAGE"
import { isAfter, isValid } from "date-fns"
import { generateUuid } from "../helpers/generateUuid"

export const getClients = async (filters: IClientFilters) => {

    if (filters.startDate && !filters.endDate) {
        return RequestResponse(400, "endDate is required", true, [])

    } else if (filters.endDate && !filters.startDate) {
        return RequestResponse(400, "endDate is required", true, [])

    } else if (filters.startDate && filters.endDate) {

        if (!isValid(filters.startDate) || !isValid(filters.endDate)) {
            return RequestResponse(400, "invalid date format", true, [])

        } else if (!isAfter(filters.endDate, filters.startDate)) {
            return RequestResponse(400, "endDate must be after than startDate", true, [])
        }

        filters.filterDate = true

    }

    const clients = await obtainClientsDB(filters)
    return RequestResponse(200, "Clients obtained successfully", false, clients)
}

export const getClientByUuid = async (uuid: string) => {

    const client = await obtainClientByUuid(uuid)

    if (!client) {
        return RequestResponse(404, "Client not found", true, [])
    }

    return RequestResponse(200, "Client found", false, client)

}

export const createClient = async (client: IClient) => {

    const exists = await obtainClientByEmail(client.email)

    if (exists) {
        return RequestResponse(409, "Email already registered", true, [])
    }

    await createClientDB(client)
    return RequestResponse(201, "Client created successfully", false, [])

}

export const loginClient = async (email: string) => {

    let client = await obtainClientByEmail(email)

    if (!client) {
        client = await createClientDB({uuid: generateUuid(), name: email, email: email, phone: ""})
    }

    const JWT_SECRET = process.env['SECRET_KEY_JWT'] || ""

    const token = jwt.sign({
        uuid: client.uuid,
        name: client.name,
        email: client.email,
        roleName: FROM.CLIENT
    }, JWT_SECRET)

    return RequestResponse(200, "Login successful", false, token)

}

export const updateClient = async (uuid: string, data: Partial<IClient>) => {

    const client = await obtainClientByUuid(uuid)

    if (!client) {
        return RequestResponse(404, "Client not found", true, [])
    }

    if (data.email && data.email !== client.email) {

        const emailExists = await obtainClientByEmail(data.email)

        if (emailExists) {
            return RequestResponse(409, "Email already registered", true, [])
        }

    }

    await updateClientDB(uuid, data)
    return RequestResponse(200, "Client updated successfully", false, [])

}
