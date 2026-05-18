import { Request, Response } from "express"
import { RequestResponse } from "../helpers/requestResponse"

import {
    createUser,
    deleteUser,
    newUserLogin,
    obtainUsers,
    updateUser
} from "../services/user"

import { generateUuid } from "../helpers/generateUuid"
import { CONNECTION, USER_ROLE } from "../common/enums/USER"
import { setConnectionStatusDB } from "../repositories/userConnection.repository"

export const login = async (req: Request, res: Response) => {

    try {

        const { email, password } = req.body

        const response = await newUserLogin(email, password);

        if (response.code == 200) {

            res.cookie("token", response.data, {
                httpOnly: true,
                secure: process.env['NODE_ENV'] === 'production',
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 2
            });

            response.data = [];

        }

        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error login:", error.message)
            return res.status(500).send(RequestResponse(500, `Error login: ${error.message}`, true, []))
        }

        console.log("Unknown error login:", error)
        return res.status(500).send(RequestResponse(500, `Unknown error login`, true, []))

    }

}

export const obtainAllUsers = async (_: Request, res: Response) => {

    try {

        const response = await obtainUsers();
        return res.status(response.code).send(response)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error obtaining all users:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining all users: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining all users:", error)
        return res.status(500).send(RequestResponse(500, `Unknown error obtaining all users`, true, []))

    }

}

export const getMyUser = async (req: Request, res: Response) => {

    try {

        const { iat: _iat, exp: _exp, ...userInfo } = req.user!
        return res.status(200).send(RequestResponse(200, "User information found", false, userInfo))

    } catch (error: unknown) {
        
        if (error instanceof Error) {
            console.log("Error obtaining user information:", error.message)
            return res.status(500).send(RequestResponse(500, `Error obtaining user information: ${error.message}`, true, []))
        }

        console.log("Unknown error obtaining user information:", error)
        return res.status(500).send(RequestResponse(500, `Unknown error obtaining user information`, true, []))

    }

}

export const logout = async (req: Request, res: Response) => {

    try {

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'strict'
        });

        if (req.user!.roleName === USER_ROLE.OPERATOR) {
            await setConnectionStatusDB(req.user!.uuid, CONNECTION.OFFLINE)
        }

        return res.status(200).send(RequestResponse(200, "Successful session closure", false, []))

    } catch (error: unknown) {
        
        if (error instanceof Error) {
            console.log("Error closing session:", error.message)
            return res.status(500).send(RequestResponse(500, `Error closing session: ${error.message}`, true, []))
        }

        console.log("Unknown error closing session:", error)
        return res.status(500).send(RequestResponse(500, `Unknown error closing session`, true, []))

    }

}

export const createNewUser = async (req: Request, res: Response) => {

    try {

        const { name, email, password, roleUuid } = req.body

        const user = {
            uuid: generateUuid(),
            name: name,
            email: email,
            password: password,
            roleUuid: roleUuid
        }

        const response = await createUser(user)
        return res.status(response.code).send(response)

    } catch (error: unknown) {
        
        if (error instanceof Error) {
            console.log("Error creating user:", error.message)
            return res.status(500).send(RequestResponse(500, `Error creating user: ${error.message}`, true, []))
        }

        console.log("Unknown error creating user:", error)
        return res.status(500).send(RequestResponse(500, `Unknown error creating user`, true, []))

    }

}

export const setUser = async (req: Request, res: Response) => {

    try {

        const { name, email, password, roleUuid } = req.body
        const { uuid } = req.params

        let userUuid = Array.isArray(uuid) ? uuid[0] : uuid

        const user = {
            uuid: userUuid || "",
            name: name,
            email: email,
            password: password,
            roleUuid: roleUuid
        }

        const response = await updateUser(user)
        return res.status(response.code).send(response)

    } catch (error: unknown) {
        
        if (error instanceof Error) {
            console.log("Error updating user:", error.message)
            return res.status(500).send(RequestResponse(500, `Error updating user: ${error.message}`, true, []))
        }

        console.log("Unknown error updating user:", error)
        return res.status(500).send(RequestResponse(500, `Unknown error updating user`, true, []))

    }

}

export const removeUser = async (req: Request, res: Response) => {

    try {

        const { uuid } = req.params

        let userUuid = Array.isArray(uuid) ? uuid[0] : uuid
        const response = await deleteUser(userUuid || "")

        return res.status(response.code).send(response)

    } catch (error: unknown) {
        
        if (error instanceof Error) {
            console.log("Error updating user:", error.message)
            return res.status(500).send(RequestResponse(500, `Error updating user: ${error.message}`, true, []))
        }

        console.log("Unknown error updating user:", error)
        return res.status(500).send(RequestResponse(500, `Unknown error updating user`, true, []))

    }

}