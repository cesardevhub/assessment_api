import cron from 'node-cron'
import axios, { AxiosResponse} from "axios"

import { setPropertiesCache } from '../cache/propertyEstateCache'

const fetchCatalog = async () => {

    try {

        const url = process.env['URL_CATALOG'] || ""
        const apiKey = process.env['APIKEY_CATALOG']

        const response = await axios.get(url, {
            headers: {
                'x-api-key': apiKey,
                "Accept": "application/json"
            }
        }).then((response: AxiosResponse) => response.data)

        if (response.success) {
            setPropertiesCache(response.data)
            console.log(`[syncCatalog] Cache updated — ${response.data.length} catalog at ${new Date().toISOString()}`)
        } else {
            console.log("[syncCatalog] Error obtaining catalog");
        }

    } catch (error: unknown) {

        if (error instanceof Error) {
            console.log("Error updating catalog:", error.message);
            return
        }

        console.log("Unknown error updating catalog:", error);

    }

}

export const syncCatalog = async () => {

    await fetchCatalog()

    cron.schedule('*/15 * * * *', async () => {
        await fetchCatalog()
    })

}
