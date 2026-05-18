import mongoose from 'mongoose'

export const connectMongo = async (): Promise<void> => {

    const uriMongo = `${process.env['URI_MONGO'] || ""}`.trim();

    if (!uriMongo) throw new Error('MONGODB_URI is not defined in environment variables');

    mongoose.set("strictQuery", false);
    await mongoose.connect(uriMongo);

    console.log(`Connected to db`);

}
