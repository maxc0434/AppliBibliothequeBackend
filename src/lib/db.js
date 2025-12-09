import mongoose from "mongoose";

export const connectDB = async () => {
    try{

        //Connexion à la BDD de mongoDB en utilisant l'uri stocké dans le .env
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to MongoDB ${conn.connection.host}`);
        
    }catch (error) {
        console.log("Error connecting to database", error);
        process.exit(1);
    }
}