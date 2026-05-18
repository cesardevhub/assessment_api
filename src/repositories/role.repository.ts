import { BusinessConfig } from "../config/relationalDB"

export const obtainRoleByUuid = async (uuid: string) => {
    return await BusinessConfig.user_role.findUnique({
        where: {
            uuid: uuid
        },
        select: {
            name: true
        }
    })
}

export const obtainAllRolesDB = async () => {
    return await BusinessConfig.user_role.findMany({
        select: {
            uuid: true,
            name: true
        }
    })
}