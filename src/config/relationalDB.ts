import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../prisma/inmuebles_el_exito/client";

export let BusinessConfig: PrismaClient;

export const connectToRelationDB = (): Promise<void> => {
    return new Promise((resolve, reject) => {

        const adapter = new PrismaMariaDb({
            host: process.env["DATABASE_HOST"] || "",
            user: process.env["DATABASE_USER"] || "",
            password: process.env["DATABASE_PASSWORD"] || "",
            database: process.env["DATABASE_NAME"] || "",
            connectionLimit: 5,
        });

        BusinessConfig = new PrismaClient({ adapter })

        BusinessConfig.$connect().then(() => {
            console.log("Connected to DB")
            resolve()

        }).catch((error: unknown) => {
            console.log("Error connecting to DB", error)
            reject()
        })

    })
}