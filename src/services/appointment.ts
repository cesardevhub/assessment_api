import { RequestResponse } from "../helpers/requestResponse"
import { IAppointment, IAppointmentFilters, IClientAppointmentFilters } from "../common/interfaces/IAppointment"

import {
    createAppointmentDB,
    obtainAppointmentByUuid,
    obtainAppointmentsDB,
    obtainClientAppointmentsDB,
    obtainPendingAppointmentByClientAndProperty,
    updateAppointmentDB,
    updateAppointmentStatusDB,
} from "../repositories/appointment.repository"

import { obtainClientByUuid } from "../repositories/client.repository"
import { STATUS } from "../common/enums/APPOINTMENT"
import { isAfter, isValid } from "date-fns"

export const getAppointmentsService = async (filters: IAppointmentFilters) => {

    if (!isValid(filters.startDate) || !isValid(filters.endDate)) {
        return RequestResponse(400, "invalid dates format", true, [])
    }

    if (!isAfter(filters.endDate, filters.startDate)) {
        return RequestResponse(400, "startDate must be before endDate", true, [])
    }

    const appointments = await obtainAppointmentsDB(filters)

    return RequestResponse(200, "Appointments obtained successfully", false, appointments)

}

export const getClientAppointmentsService = async (filters: IClientAppointmentFilters) => {
    const appointments = await obtainClientAppointmentsDB(filters)
    return RequestResponse(200, "Appointments obtained successfully", false, appointments)
}

export const getAppointmentByUuid = async (uuid: string) => {

    const appointment = await obtainAppointmentByUuid(uuid)

    if (!appointment) {
        return RequestResponse(404, "Appointment not found", true, [])
    }

    return RequestResponse(200, "Appointment found", false, appointment)

}

export const createAppointment = async (appointment: IAppointment) => {

    if (!isValid(appointment.date)) {
        return RequestResponse(400, "date must have the format yyyy-MM-dd HH:mm:ss", true, [])
    }

    const client = await obtainClientByUuid(appointment.clientUuid)

    if (!client) {
        return RequestResponse(404, "Client not found", true, [])
    }

    if (!isAfter(appointment.date, new Date())) {
        return RequestResponse(400, "Appointment date must be in the future", true, [])
    }

    const pending = await obtainPendingAppointmentByClientAndProperty(appointment.clientUuid, appointment.propertyEstateId)

    if (pending) {
        return RequestResponse(409, "Client already has a pending appointment for this property", true, [])
    }

    await createAppointmentDB(appointment)
    return RequestResponse(201, "Appointment created successfully", false, [])

}

export const updateAppointment = async (uuid: string, data: { propertyEstateId?: string; date?: Date }) => {

    const appointment = await obtainAppointmentByUuid(uuid)

    if (!appointment) {
        return RequestResponse(404, "Appointment not found", true, [])
    }

    if (appointment.status === STATUS.CANCELLED || appointment.status === STATUS.COMPLETED) {
        return RequestResponse(400, `Cannot update a ${appointment.status} appointment`, true, [])
    }

    if (data.date && (!isValid(data.date) || !isAfter(new Date(), data.date))) {
        return RequestResponse(400, "Appointment date must be in the future", true, [])
    }

    await updateAppointmentDB(uuid, data)
    return RequestResponse(200, "Appointment updated successfully", false, [])

}

export const updateAppointmentStatus = async (uuid: string, status: string) => {

    const appointment = await obtainAppointmentByUuid(uuid)

    if (!appointment) {
        return RequestResponse(404, "Appointment not found", true, [])
    }

    if (appointment.status === status) {
        return RequestResponse(400, `Appointment is already ${status}`, true, [])
    }

    await updateAppointmentStatusDB(uuid, status)
    return RequestResponse(200, "Appointment status updated successfully", false, [])

}
