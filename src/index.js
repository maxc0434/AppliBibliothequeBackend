import express from "express";
import "dotenv/config";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import { connectDB } from "./lib/db.js"
import job from "./lib/cron.js";

// Création de l'instance de l'application Express
const app = express();
const PORT = process.env.PORT || 3000 // condition de connexion sur le port defini dans le .env || ou solution de repli 

//Définition du middleware pour parser les requetes HTTP en JSON
job.start();
app.use(express.json());
app.use(cors());




//Definition des routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);


//Definition du port d'écoute du serveur
app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
    connectDB();
   });

   