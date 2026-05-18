import { FROM, MESSAGE_TYPE } from "../enums/MESSAGE"

export interface IMessage {
    uuid: string
    conversationUuid: string
    clientUuid: string
    from: FROM
    message: {
        type: MESSAGE_TYPE
        content: {
            header?: string
            text?: string
        }
    }
    createdAt?: string
}
