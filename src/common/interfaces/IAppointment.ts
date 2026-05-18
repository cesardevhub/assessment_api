export interface IAppointment {
    uuid: string
    clientUuid: string
    propertyEstateId: string
    date: Date
}

export interface IAppointmentFilters {
    status?: string
    startDate: Date
    endDate: Date
    clientUuid?: string
    propertyEstateId?: string
    page: number
    limit: number
}

export interface IClientAppointmentFilters {
    clientUuid: string
    page: number
    limit: number
}