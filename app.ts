import 'dotenv/config'
import 'reflect-metadata'
import { initServer } from './src/config/appServer';
import { exit } from 'node:process';
import { connectMongo } from './src/config/mongoDB';
import { connectToRelationDB } from './src/config/relationalDB';

const execute = async () => {
    await initServer();
    await connectMongo();
    await connectToRelationDB();
}

execute().catch(() => {
    console.log("Stopping execution");
    exit(1)
});