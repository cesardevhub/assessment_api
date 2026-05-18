import mongoose from 'mongoose'
import { CONNECTION } from '../common/enums/USER'

const userConnectionSchema = new mongoose.Schema({
    connectionUuid: {
        type: String,
        required: true,
        unique: true
    },
    userUuid: {
        type: String,
        required: true
    },
    conversationsActive: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: [CONNECTION.ONLINE, CONNECTION.OFFLINE],
        default: CONNECTION.OFFLINE,
        required: true
    },
}, { timestamps: true })

export const UserConnectionModel = mongoose.model('UserConnection', userConnectionSchema)
