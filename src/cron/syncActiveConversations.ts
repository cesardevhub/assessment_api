import cron from 'node-cron'

import { countActiveConversationsByUser } from '../repositories/conversation.repository'
import { obtainAllConnectionUserUuids, syncConversationsActiveDB } from '../repositories/userConnection.repository'

const syncOperators = async () => {

    try {

        const [counts, userUuids] = await Promise.all([
            countActiveConversationsByUser(),
            obtainAllConnectionUserUuids()
        ])

        const countMap = new Map(counts.map(({ userUuid, count }) => [userUuid, count]))

        await Promise.all(
            userUuids.map((userUuid) =>
                syncConversationsActiveDB(userUuid, countMap.get(userUuid) ?? 0)
            )
        )

        console.log(`[syncOperators] conversationsActive synced for ${userUuids.length} operators`)

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error updating active conversations cache:", error.message)
            return
        }

        console.log("Unknown error updating active conversations cache:", error);

    }

}

export const syncActiveConversations = () => {

    cron.schedule('0 0 * * *', async () => {
        await syncOperators()
    })

    console.log('[syncActiveConversations] scheduled — runs every day at midnight')

}
