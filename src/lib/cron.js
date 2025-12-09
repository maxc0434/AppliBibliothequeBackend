// Importer le module cron pour planifier des tâches
import cron from "cron";
// Importer le module https pour effectuer des requêtes HTTP
import https from "https";

// Créer un nouveau travail cron qui s'exécute toutes les 14 minutes
const job = new cron.CronJob("*/14 * * * *", function () {
    // Effectuer une requête GET vers l'URL de l'API spécifiée dans les variables d'environnement
    https
        .get(process.env.API_URL, (res) => {
            // Vérifier le code de statut de la réponse
            if (res.statusCode === 200) console.log("GET Demande envoyé avec succés");
            else console.log("GET requête echoué", res.statusCode);
        })
        // Gérer les erreurs qui se produisent pendant la requête
        .on("error", (e) => console.error("Erreur durant l'envoie de la requête", e));
});

export default job;

//Exemple et explication
//pour nous on a définit sur toutes les 14 minutes
//! Minute, Heure, Jour du mois, Mois, Jour de la semaine
 
// * 14 * * * *
// * 0 0 * * 0
// * 30 3 15 * *
// * 0 0 1 1 * 