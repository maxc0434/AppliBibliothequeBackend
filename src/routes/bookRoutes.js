import express from "express";
import protectRoute from "../middleware/auth.middleware.js";
import Book from "../models/Books.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();
//#region Créer Un livre

// Route pour creer un nouveau livre
router.post("/", protectRoute, async (req, res) => {
    try {
        /**
         * Etape 1 : Recuperer les donnees envoyees par le client dans le corps de la requete
         * title = titre du livre, caption = description, rating = note, image = lien base64 de l'image
         */
        const { title, caption, rating, image } = req.body;

        /**
         * Etape 2 : Verifier que tous les champs obligatoires sont remplis
         * Si un champ manque, on renvoie une erreur 400 (Bad Request)
         */
        if (!title || !caption || !rating || !image) {
            return res.status(400).json({ message: "Veuillez fournir tous les champs" });
        }

        /**
         * Etape 3 : Uploader l'image sur Cloudinary et recuperer l'URL securisee
         * cloudinary.uploader.upload() prend l'image en base64 et la stocke dans le cloud
         */
        const uploadResponse = await cloudinary.uploader.upload(image);
        const imageUrl = uploadResponse.secure_url;

        /**
         * Etape 4 : Creer l'objet livre avec toutes les donnees
         * On ajoute l'ID de l'utilisateur connecte (req.user._id) comme proprietaire
         */
        const book =new Book ({
            title,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id,
        });

        /**
         * Etape 5 : Sauvegarder le livre dans la base de donnees
         * newBook.save() cree l'entree dans MongoDB et renvoie l'objet avec l'ID genere
         */
        await newBook.save();

        /**
         * Etape 6 : Repondre au client avec le livre cree (code 201 = Created)
         */
        res.status(201).json(newBook);

    } catch (error) {
        /**
         * Etape 7 : Gestion des erreurs
         * On log l'erreur complete et on renvoie un message d'erreur au client
         */
        console.log("Erreur de creation du livre", error);
        res.status(500).json({ message: error.message });
    }
});

//#endregion







//#region  Récup Tous les livres

// Route qui permet de recuperer tous les livres avec pagination
router.get("/", protectRoute, async (req, res) => {

    try {
        /**
         * Etape 1 : Lire les parametres de pagination envoyes dans l'URL
         * Exemple : /books?page=2&limit=10
         * Si ces parametres ne sont pas fournis, on utilise des valeurs par defaut.
         */
        const page = req.query.page || 1;    // Numero de page actuel
        const limit = req.query.limit || 5;  // Nombre de livres a afficher par page
        const skip = (page - 1) * limit;     // Nombre de livres a ignorer (pour sauter les pages precedentes)

        /**
         * Etape 2 : Chercher les livres dans la base de donnees
         * - .sort() trie les livres du plus recent au plus ancien
         * - .skip() saute un certain nombre d'elements (selon la page)
         * - .limit() limite combien on en recupere
         * - .populate() remplace l'ID de l'utilisateur par ses infos visibles (nom, image de profil)
         */
        const books = await Book.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("user", "username profileImage");

        /**
         * Etape 3 : Compter combien de livres existent au total
         * Cela permet de calculer ensuite le nombre total de pages.
         */
        const totalBooks = await Book.countDocuments();

        /**
         * Etape 4 : Envoyer la reponse au client (le frontend)
         * On inclut :
         * - la liste des livres recuperes
         * - la page actuelle
         * - le nombre total de livres
         * - le nombre total de pages disponibles
         */
        res.send({
            books,
            currentPage: page,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
        });

    } catch (error) {
        /**
         * Etape 5 : Gestion des erreurs
         * Si quelque chose se passe mal (ex. probleme de connexion BDD),
         * on affiche l'erreur dans la console et on envoie une reponse au client.
         */
        console.error("Erreur lors de la recuperation des livres :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
});
//#endregion




//#region Supprimer Un livre

// Route pour supprimer un livre selon son ID
router.delete("/:id", protectRoute, async (req, res) => {
    try {
        /**
         * Etape 1 : Chercher le livre dans la base avec l'ID fourni dans l'URL
         * Si le livre n'existe pas, on renvoie un message d'erreur 404.
         */
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Le livre n'a pas ete trouve" });

        /**
         * Etape 2 : Verifier que l'utilisateur qui fait la requete est bien le proprietaire du livre
         * Si ce n'est pas le cas, on renvoie une erreur 401 (non autorise).
         */
        if (book.user.toString() !== req.user._id.toString())
            return res.status(401).json({ message: "Pas autorise" });

        /**
         * Etape 3 : Supprimer l'image associee au livre si elle est stockee sur Cloudinary
         * - On recupere le publicId de l'image pour pouvoir la supprimer du cloud
         * - On essaye de supprimer l'image et on affiche une erreur si ca echoue mais on continue la suppression du livre.
         */
        if (book.image && book.image.includes("cloudinary")) {
            try {
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (deleteError) {
                console.log("Erreur de suppression d'image depuis cloudinary", deleteError);
            }
        }

        /**
         * Etape 4 : Supprimer le livre de la base de donnees
         */
        await book.deleteOne();

        /**
         * Etape 5 : Envoyer une reponse positive au client pour confirmer la suppression
         */
        res.json({ message: "Le livre a ete supprime avec succes" });

    } catch (error) {
        /**
         * Etape 6 : Gestion des erreurs serveur
         * En cas de probleme, on log l'erreur et on renvoie un message d'erreur au client.
         */
        console.log("Erreur de suppression du livre", error);
        res.status(500).json({ message: "Erreur serveur interne" });
    }
});

//#endregion





//#region Recommandation des livres sur profil

// Route pour recuperer tous les livres de l'utilisateur connecte (son profil)
router.get("/user", protectRoute, async (req, res) => {
    try {
        /**
         * Etape 1 : Chercher tous les livres qui appartiennent a l'utilisateur connecte
         * Book.find({ user: req.user._id }) = trouve les livres ou l'ID utilisateur correspond
         * .sort({ createdAt: -1 }) = trie du plus recent au plus ancien
         */
        const books = await Book.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        /**
         * Etape 2 : Envoyer la liste des livres au client
         * Le frontend pourra les afficher sur le profil de l'utilisateur
         */
        res.json(books);

    } catch (error) {
        /**
         * Etape 3 : Gestion des erreurs
         * Si probleme (connexion BDD, etc.), on log l'erreur et on repond avec un code 500
         */
        console.error("Erreur lors de la recuperation des livres de l'utilisateur:", error.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

//#endregion








export default router;

