import bcrypt from 'bcrypt'

import { RequestResponse } from "../helpers/requestResponse"

import {
    createUserDB,
    obtainAllUsersDB,
    obtainUserByEmail,
    obtainUserByUuid,
    removeUserDB,
    updateUserDB
} from "../repositories/user.repository"

import { generateToken } from '../helpers/generateToken'
import { encryptPassword } from '../helpers/encryptPassword'
import { IUser } from '../common/interfaces/IUser'
import { CONNECTION, USER_ROLE } from '../common/enums/USER'
import { obtainRoleByUuid } from '../repositories/role.repository'
import { generateUuid } from '../helpers/generateUuid'

import {
    createConnectionDB,
    deleteConnectionDB,
    setConnectionStatusDB,
    refreshConnectionCacheFromDB
} from '../repositories/userConnection.repository'

export const newUserLogin = async (email: string, password: string) => {

    const user = await obtainUserByEmail(email)

    if (!user) {
        return RequestResponse(401, "Invalid credentials", true, [])
    }

    const validatePassword = await bcrypt.compare(password, user.password);

    if (!validatePassword) {
        return RequestResponse(401, "Invalid credentials", true, [])
    }

    const token = generateToken({
        uuid: user.uuid,
        name: user.name,
        roleName: user.role.name,
        email: email
    })

    if (user.role.name === USER_ROLE.OPERATOR) {
        await setConnectionStatusDB(user.uuid, CONNECTION.ONLINE)
    }

    return RequestResponse(200, "User logged successfully", false, token)

}

export const obtainUsers = async () => {

    const users = await obtainAllUsersDB()

    const allUsers = users.map((user) => {
        return {
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            role: user.role.name,
            createdAt: user.createdAt
        }
    })

    return RequestResponse(200, "Users obtained successfully", false, allUsers)

}

export const createUser = async (user: IUser) => {

    const userExists = await obtainUserByEmail(user.email)

    if (userExists) {
        return RequestResponse(409, "Email already exists", true, [])
    }

    const role = await obtainRoleByUuid(user.roleUuid)

    if (!role) {
        return RequestResponse(404, "Role not found", true, [])
    }

    user.password = await encryptPassword(user.password)

    await createUserDB(user)

    if (role.name === USER_ROLE.OPERATOR) {
        await createConnectionDB(user.uuid, generateUuid())
    }

    return RequestResponse(200, "User was created successfully", false, [])

}

export const updateUser = async (user: IUser) => {

    const userExists = await obtainUserByEmail(user.email)

    if (userExists && userExists.uuid !== user.uuid) {
        return RequestResponse(409, "Email already exists", true, [])
    }

    const role = await obtainRoleByUuid(user.roleUuid)

    if (!role) {
        return RequestResponse(404, "Role not found", true, [])
    }

    if (user.password) {
        user.password = await encryptPassword(user.password)
    }

    await updateUserDB(user)
    await refreshConnectionCacheFromDB(user.uuid)
    return RequestResponse(200, "User was updated successfully", false, [])

}

export const deleteUser = async (userUuid: string) => {

    const userExists = await obtainUserByUuid(userUuid)

    if (!userExists) {
        return RequestResponse(404, "User not found", true, [])
    }

    if (userExists.role.name == USER_ROLE.ADMIN) {
        return RequestResponse(403, "User not allowed", true, [])
    }

    await removeUserDB(userUuid)

    if (userExists.role.name === USER_ROLE.OPERATOR) {
        await deleteConnectionDB(userUuid)
    }

    return RequestResponse(200, "User was removed successfully", false, [])

}