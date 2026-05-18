import { Request, Response } from "express"
import { RequestResponse } from "../helpers/requestResponse"
import { generateUuid } from "../helpers/generateUuid"

import {
    createClient,
    getClientByUuid,
    getClients,
    loginClient,
    updateClient
} from "../services/client"

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000

export const clientLogin = async (req: Request, res: Response) => {

    try {

        const { email } = req.body

        const response = await loginClient(email)

        if (response.error) {
            return res.status(response.code).send(response)
        }

        const { token } = response.data as { token: string }

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === "production",
            sameSite: "strict",
            maxAge: TEN_YEARS_MS
        })

        return res.status(200).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error on client login:", error.message)
            return res.status(500).send(RequestResponse(500, `Error on client login: ${error.message}`, true, []))
        }

        console.log("Unknown error on client login:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error on client login", true, []))

    }

}

export const getMyUser = async (req: Request, res: Response) => {

    try {

        const { iat: _iat, exp: _exp, ...userInfo } = req.user!
        return res.status(200).send(RequestResponse(200, "Client information found", false, userInfo))

    } catch (error: unknown) {
        
        if (error instanceof Error) {
            console.log("Error obtaining user information:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining client information: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining client information:", error)
        return res.status(500).send(RequestResponse(500, `Unknown error obtaining client information`, true, []))

    }

}

export const obtainClients = async (req: Request, res: Response) => {

    try {

        const { uuid, name, email, startDate, endDate } = req.query

        const response = await getClients({
            uuid: uuid as string,
            name: name as string,
            email: email as string,
            startDate: startDate as string,
            endDate: endDate as string,
        })

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error obtaining clients:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining clients: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining clients:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error obtaining clients", true, []))

    }

}

export const obtainClient = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const clientUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const response = await getClientByUuid(clientUuid || "")
        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error obtaining client:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining client: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining client:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error obtaining client", true, []))

    }

}

export const createNewClient = async (req: Request, res: Response) => {

    try {

        const { name, phone, email } = req.body

        const response = await createClient({
            uuid: generateUuid(),
            name,
            phone,
            email
        })

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error creating client:", error.message)
            return res.status(500).send(RequestResponse(500, `Error creating client: ${error.message}`, true, []))
        }

        console.log("Unknown error creating client:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error creating client", true, []))

    }

}

export const setClient = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params
        const { name, phone, email } = req.body

        const clientUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const response = await updateClient(clientUuid || "", { name, phone, email })
        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error updating client:", error.message)
            return res.status(500).send(RequestResponse(500, `Error updating client: ${error.message}`, true, []))
        }

        console.log("Unknown error updating client:", error)
        return res.status(500).send(RequestResponse(500, "Unknown error updating client", true, []))

    }

}