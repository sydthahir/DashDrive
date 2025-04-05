const bcrypt = require("bcryptjs");




const securePassword = async (password) => {
    try {
        if (!password || typeof password !== 'string') {
            throw new Error("Password must be a non-empty string");
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error("Error hashing password:", error);
        throw error;
    }
};



module.exports = {securePassword}