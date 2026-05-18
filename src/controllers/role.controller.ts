import { Request, Response } from "express"
import { RequestResponse } from "../helpers/requestResponse"

import { obtainRoles } from "../services/role"

export const obtainAllRoles = async (_: Request, res: Response) => {

    try {

        const response = await obtainRoles()
        return res.status(response.code).send(response)

    } catch (error: unknown) {
        
        if (error instanceof Error) {
            console.log("Error obtaining roles:", error.message)
            return res.status(400).send(RequestResponse(400, `Error obtaining roles: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining roles:", error)
        return res.status(400).send(RequestResponse(400, `Unknown error obtaining roles`, true, []))

    }

}