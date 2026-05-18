import { IUser } from "../common/interfaces/IUser" 
import { BusinessConfig } from "../config/relationalDB" 

export const createUserDB = async (newUser: IUser) => {
    await BusinessConfig.user.create({
        data: newUser
    })
}

export const obtainUserByEmail = async (email: string) => {
    return await BusinessConfig.user.findFirst({
        where: {
            email: email,
            status: true
        },
        select: {
            uuid: true,
            name: true,
            role: {
                select: {
                    name: true
                }
            },
            password: true
        }
    })
}

export const obtainUserByUuid = async (uuid: string) => {
    return await BusinessConfig.user.findUnique({
        where: {
            uuid: uuid,
            status: true
        },
        select: {
            uuid: true,
            role: {
                select: {
                    name: true
                }
            }
        }
    })
}

export const obtainAllUsersDB = async () => {
    return await BusinessConfig.user.findMany({
        where: {
            status: true
        },
        select: {
            uuid: true,
            name: true,
            email: true,
            role: {
                select: {
                    name: true
                }
            },
            createdAt: true
        }
    })
}

export const obtainUsersByRole = async (roleUuid: string) => {
    return await BusinessConfig.user.findMany({
        where: {
            roleUuid: roleUuid,
            status: true
        },
        select: {
            uuid: true
        }
    })
}

export const updateUserDB = async (newUser: IUser) => {
    await BusinessConfig.user.update({
        where: { uuid: newUser.uuid },
        data: {
            name: newUser.name,
            email: newUser.email,
            roleUuid: newUser.roleUuid,
            ...(newUser.password ? { password: newUser.password } : {})
        }
    })
}

export const removeUserDB = async (userUuid: string) => {
    await BusinessConfig.user.update({
        where: { uuid: userUuid },
        data: {
            status: false
        }
    })
}