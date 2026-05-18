export interface IClient {
    uuid: string
    name: string
    phone: string
    email: string
}

export interface IClientFilters {
    uuid?: string
    name?: string
    email?: string
    startDate?: string
    endDate?: string,
    filterDate?: boolean
}