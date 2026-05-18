import mongoose from 'mongoose'
import { STATUS } from '../common/enums/APPOINTMENT'

const appointmentSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    clientUuid: {
        type: String,
        required: true
    },
    propertyEstateId: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: [STATUS.PENDING, STATUS.CANCELLED, STATUS.COMPLETED],
        required: true,
        default: STATUS.PENDING
    },
}, { timestamps: true })

export const AppointmentModel = mongoose.model('Appointment', appointmentSchema)
