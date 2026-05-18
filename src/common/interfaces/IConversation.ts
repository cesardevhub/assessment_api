export interface IConversationFilters {
    active?: boolean
    startDate: Date,
    endDate: Date,
    userUuid?: string
    search?: string
}

export interface IPagination {
    page: number
    limit: number
}
