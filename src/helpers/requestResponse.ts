export const RequestResponse = (code: number, message: string, error: boolean, data: any) => {
    return { code, message, error, data }
}