import { Request, Response } from "express"
import { RequestResponse } from "../helpers/requestResponse"
import { generateUuid } from "../helpers/generateUuid"

import {
    createAppointment,
    getAppointmentByUuid,
    getAppointmentsService,
    getClientAppointmentsService,
    updateAppointment,
    updateAppointmentStatus
} from "../services/appointment"

export const obtainAppointments = async (req: Request, res: Response) => {

    try {

        const { status, startDate, endDate, clientUuid, propertyEstateId, page, limit } = req.body

        const response = await getAppointmentsService({
            status: status as string,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            clientUuid: clientUuid as string,
            propertyEstateId: propertyEstateId as string,
            page: Number(page),
            limit: Number(limit)
        })

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error obtaining appointments:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining appointments: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining appointments:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error obtaining appointments", true, []))

    }

}

export const getClientAppointments = async (req: Request, res: Response) => {

    try {

        const { page, limit } = req.body

        const response = await getClientAppointmentsService({
            clientUuid: req.user!.uuid,
            page: Number(page),
            limit: Number(limit)
        })

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error getting client appointments:", error.message)
            return res.status(500).send(RequestResponse(500, `Error getting client appointments: ${error.message}`, true, []))
        }

        console.log("Unknown error getting client appointments:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error getting client appointments", true, []))

    }

}

export const obtainAppointment = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const appointmentUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const response = await getAppointmentByUuid(appointmentUuid || "")
        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error obtaining appointment:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining appointment: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining appointment:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error obtaining appointment", true, []))

    }

}

export const createNewAppointment = async (req: Request, res: Response) => {

    try {

        const { propertyEstateId, date } = req.body

        const response = await createAppointment({
            uuid: generateUuid(),
            clientUuid: req.user!.uuid,
            propertyEstateId,
            date: new Date(date)
        })

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error creating appointment:", error.message)
            return res.status(500).send(RequestResponse(500, `Error creating appointment: ${error.message}`, true, []))
        }

        console.log("Unknown error creating appointment:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error creating appointment", true, []))

    }

}

export const addAppointment = async (req: Request, res: Response) => {

    try {

        const { clientUuid, propertyEstateId, date } = req.body

        const response = await createAppointment({
            uuid: generateUuid(),
            clientUuid,
            propertyEstateId,
            date: new Date(date)
        })

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error adding appointment:", error.message)
            return res.status(500).send(RequestResponse(500, `Error adding appointment: ${error.message}`, true, []))
        }

        console.log("Unknown error adding appointment:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error adding appointment", true, []))

    }

}

export const setAppointment = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const { propertyEstateId, date } = req.body

        const appointmentUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const data: { propertyEstateId?: string; date?: Date } = {}

        if (propertyEstateId) data.propertyEstateId = propertyEstateId

        if (date) {
            data.date = new Date(date)
        }

        const response = await updateAppointment(appointmentUuid || "", data)
        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error updating appointment:", error.message)
            return res.status(500).send(RequestResponse(500, `Error updating appointment: ${error.message}`, true, []))
        }

        console.log("Unknown error updating appointment:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error updating appointment", true, []))

    }

}

export const setAppointmentStatus = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const { status } = req.body

        const appointmentUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const response = await updateAppointmentStatus(appointmentUuid || "", status)
        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error updating appointment status:", error.message)
            return res.status(500).send(RequestResponse(500, `Error updating appointment status: ${error.message}`, true, []))
        }

        console.log("Unknown error updating appointment status:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error updating appointment status", true, []))

    }

}
