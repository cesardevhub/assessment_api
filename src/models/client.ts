import mongoose from "mongoose"

const clientSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        defalt: "",
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
}, { timestamps: true })

export const ClientModel = mongoose.model('Client', clientSchema)
