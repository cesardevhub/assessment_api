import { AppointmentModel } from "../models/appointment"
import { IAppointment, IAppointmentFilters, IClientAppointmentFilters } from "../common/interfaces/IAppointment"
import { STATUS } from "../common/enums/APPOINTMENT"

export const createAppointmentDB = async (appointment: IAppointment) => {
    await AppointmentModel.create(appointment)
}

export const obtainAppointmentByUuid = async (uuid: string) => {
    return await AppointmentModel.findOne({ uuid }).select('-__v')
}

export const obtainAppointmentsDB = async (filters: IAppointmentFilters) => {

    const query: Record<string, unknown> = {}

    if (filters.status) query['status'] = filters.status
    if (filters.clientUuid) query['clientUuid'] = filters.clientUuid
    if (filters.propertyEstateId) query['propertyEstateId'] = filters.propertyEstateId

    query['date'] = {
        $gte: new Date(filters.startDate).toISOString(),
        $lte: new Date(filters.endDate).toISOString()
    }

    const skip = (filters.page - 1) * filters.limit

    const [appointments, total] = await Promise.all([
        AppointmentModel.find(query).select('-__v').sort({ date: -1 }).skip(skip).limit(filters.limit).lean(),
        AppointmentModel.countDocuments(query)
    ])

    const nextPage = (filters.page + 1) * filters.limit < total ? true : false

    return {
        appointments,
        total,
        nextPage,
        totalPages: Math.ceil(total / filters.limit)
    }

}

export const obtainClientAppointmentsDB = async (filters: IClientAppointmentFilters) => {

    const query: Record<string, unknown> = {}

    const skip = (filters.page - 1) * filters.limit

    const [appointments, total] = await Promise.all([
        AppointmentModel.find(query).select('-__v').skip(skip).limit(filters.limit).lean(),
        AppointmentModel.countDocuments(query)
    ])

    const nextPage = (filters.page + 1) * filters.limit < total ? true : false

    return {
        appointments,
        total,
        nextPage,
        totalPages: Math.ceil(total / filters.limit)
    }

}

export const obtainPendingAppointmentByClientAndProperty = async (clientUuid: string, propertyEstateId: string) => {
    return await AppointmentModel.findOne({ clientUuid, propertyEstateId, status: STATUS.PENDING }).lean()
}

export const updateAppointmentDB = async (uuid: string, data: { propertyEstateId?: string; date?: Date }) => {
    await AppointmentModel.updateOne({ uuid }, { $set: data }).lean()
}

export const updateAppointmentStatusDB = async (uuid: string, status: string) => {
    await AppointmentModel.updateOne({ uuid }, { $set: { status } }).lean()
}