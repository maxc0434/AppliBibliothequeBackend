import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Creation d'un objet Router pour gérer les routes de l'application
const router = express.Router();


const generateToken = (userId) => { 
    return jwt.sign({userId}, // Création du jwt qui va contenir l'id de l'utilisateur,
         process.env.JWT_SECRET, // la clé secrete pour "signer" se trouvera dans le .env dans la constante JWT_SECRET, 
         {expiresIn: "15d"});  // Expiration du token dans 15 jours;

}

router.post("/register", async (req, res) => {
    try{
        //Extraction des données de la requete (email, username, password a partir du corps de la requete (req.body)
        const {email, username, password} = req.body;

        //Vérification si les champs obligatoires (usernam, email, password) sont présents dans la requete
        if(!username || !email || !password) {
            //si un ou plusieurs champs obligatoires sont manquant, renvoie erreur 400 avec msg d'erreur
            return res.status(400).json({ message: "Veuillez fournir tous les champs"});
        }
        if(password.length < 6) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères"});
        }
        if(username.length < 3) {
            return res.status(400).json({ message: "Le nom d'utilisateur doit contenir au moins 3 caractères"});
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Cet email existe déjà"});
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Cet utilisateur existe déjà"});
        }

        //Création avatar aléatoire
        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        //Création nouveau User si tout est ok
        const user = new User({
            email,
            username,
            password,
            profileImage,
        })
        await user.save();

        // Prend l'id unique du user et tu l'utilises pour générer un token et le stocker dans la const token
        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user:{
                id:user._id,
                password: user.password,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            },
        })

    } catch (error) {
        console.log("erreur dans le register", error);
        res.status(500).json({ message: "erreur serveur"});
        
    }
});

router.post("/login", async (req, res) => {
    try{
        const {email, password} = req.body; //Extraction des données de la requete

        if(!email || !password) { // si email et password non renseignés, 
            return res.status(400).json({ message: "Veuillez fournir tous les champs"}); // retourne un status d'erreur. 
        }
        const user = await User.findOne({email}); // cherche UN seul utilisateur dans la base de donnée par son email
        console.log(user);
        if(!user) { // si le user n'existe pas,
            return res.status(400).json({message: "Cet utilisateur est introuvable"}); // retourne une erreur
        }

        const isPasswordCorrect = await user.comparePassword(password); // compare le password renseigné dans l'input avec celui de la bdd  
        if(!isPasswordCorrect) { // si les mots de passe ne correspondent pas,
            return res.status(400).json({message: "Mot de passe invalide"});// envoie un message d'erreur.
        }

        const token = generateToken(user._id); // generation du token au moment de la connexion

        res.status(201).json({ // reponse: token avec tout son contenu
            token,
            user:{
                id:user._id,
                password: user.password,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            },
        })

    } catch (error) { 
        console.log("erreur de connexion", error);
        res.status(500).json({ message: "erreur serveur"});
        
    }
});


export default router;

