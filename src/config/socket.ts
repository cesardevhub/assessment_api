import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'

let io: Server

export const initSocket = (server: HttpServer): Server => {

    io = new Server(server, {
        cors: { origin: '*' }
    })

    io.on('connection', (socket) => {

        socket.on('join:conversation', (conversationUuid: string) => {
            socket.join(`conversation:${conversationUuid}`)
        })

        socket.on('leave:conversation', (conversationUuid: string) => {
            socket.leave(`conversation:${conversationUuid}`)
        })

    })

    return io
}

export const getIO = (): Server => {

    if (!io) {
        throw new Error('Socket not initialized')
    }

    return io

}

export const emitToConversation = (conversationUuid: string, event: string, data: unknown) => {
    getIO().to(`conversation:${conversationUuid}`).emit(event, data)
}
