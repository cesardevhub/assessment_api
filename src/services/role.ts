import { RequestResponse } from '../helpers/requestResponse'
import { obtainAllRolesDB } from "../repositories/role.repository"

export const obtainRoles = async () => {
    const roles = await obtainAllRolesDB()
    return RequestResponse(200, "Roles obtained successfully", false, roles)
}