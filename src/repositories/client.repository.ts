import { ClientModel } from "../models/client"
import { IClient, IClientFilters } from "../common/interfaces/IClient"

export const createClientDB = async (client: IClient) => {
    return await ClientModel.create(client)
}

export const obtainClientByUuid = async (uuid: string) => {
    return await ClientModel.findOne({ uuid }).lean()
}

export const obtainClientByEmail = async (email: string) => {
    return await ClientModel.findOne({ email }).lean()
}

export const obtainClientsDB = async (filters: IClientFilters) => {

    const query: Record<string, unknown> = {}

    if (filters.uuid) query['uuid'] = filters.uuid
    if (filters.email) query['email'] = filters.email
    if (filters.name) query['name'] = { $regex: filters.name, $options: 'i' }

    if (filters.filterDate) {

        const from = new Date(filters.startDate || "").toISOString()
        const to = new Date(filters.endDate || "").toISOString()

        query['createdAt'] = {
            $gte: from,
            $lte: to
        }

    }

    return await ClientModel.find(query).sort({ createdAt: -1 }).select('-__v').lean()

}

export const updateClientDB = async (uuid: string, data: Partial<IClient>) => {
    await ClientModel.updateOne({ uuid }, { $set: data }).lean()
}
