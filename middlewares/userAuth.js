const jwt = require("jsonwebtoken")
const env = require("dotenv").config()

module.exports = (req, res, next) => {

    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access Denied" });


    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid Token" });
    }


}