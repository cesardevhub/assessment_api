import express from 'express'
import cors from 'cors'
import http from 'http'

import { initSocket } from './socket'
import { syncActiveConversations } from '../cron/syncActiveConversations'
// import { syncCatalog } from '../cron/syncCatalog'

import userRoutes from '../routes/user.routes'
import roleRoutes from '../routes/role.routes'
import clientRoutes from '../routes/client.routes'
import appointmentRoutes from '../routes/appointment.routes'
import conversationRoutes from '../routes/conversation.routes'
import cookieParser from 'cookie-parser'

const app = express();
const server = http.createServer(app)

app.set('trust proxy', 1)
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(cookieParser())

const allowedOrigins = (process.env['CORS_ORIGIN'] ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Cookie']
}))

app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/conversations', conversationRoutes)

export const initServer = (): Promise<void> => {
    return new Promise((resolve) => {

        const port = process.env['PORT'] || process.env['SERVER_PORT'];

        initSocket(server)
        syncActiveConversations()
        // syncCatalog()

        server.listen(port, () => {
            console.log('Server running on port', port);
            resolve();
        })

    })
}