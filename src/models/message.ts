import mongoose from 'mongoose'
import { FROM, MESSAGE_TYPE } from '../common/enums/MESSAGE'

const messageSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    conversationUuid: {
        type: String,
        index: true,
        required: true,
    },
    clientUuid: {
        type: String,
        index: true,
        required: true,
    },
    from: {
        type: String,
        enum: [FROM.AGENT, FROM.CLIENT, FROM.OPERATOR, FROM.ADMIN],
        required: true
    },
    message: {
        type: {
            type: String,
            enum: [
                MESSAGE_TYPE.TEXT,
                MESSAGE_TYPE.PRODUCT,
                MESSAGE_TYPE.DOCUMENT,
                MESSAGE_TYPE.IMAGE
            ],
            required: true
        },
        content: {
            header: {
                type: String,
                required: false
            },
            text: {
                type: String,
                required: false
            }
        },
    },
}, { timestamps: true })

export const MessageModel = mongoose.model('Message', messageSchema)
