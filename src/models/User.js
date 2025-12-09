import mongoose  from "mongoose";
import bcrypt from "bcryptjs";

//Définition du schéma de données pour les utilisateurs
const userSchema = new mongoose.Schema({
    // Champ de données et leurs types

    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profileImage: {
        type: String,
        default: ''
    },

}, {timestamps: true});

//Hash du password avant sauvegarde en BDD
userSchema.pre('save', async function() {
    if(!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

// Comparaison du mdp
userSchema.methods.comparePassword = async function(userPassword) {
    // on utilise la méthode bcrypt.compare pour comparer les 2 mots de passe.
    return await bcrypt.compare(userPassword, this.password);
}


// Création du modèle de données "User"
const User = mongoose.model("User", userSchema);

export default User;