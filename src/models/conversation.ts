import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    clientUuid: {
        type: String,
        required: true
    },
    analized: {
        type: Boolean,
        default: false
    },
    userUuid: {
        type: String,
        default: null,
        required: false
    },
    finishedAt: {
        type: Date,
        default: null
    },
    reason: {
        type: String,
        default: ""
    }
}, { timestamps: true })

export const ConversationModel = mongoose.model('Conversation', conversationSchema)
