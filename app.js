const express = require('express');
const app = express();
const path = require("path")
const env = require("dotenv").config()
const cookieParser = require("cookie-parser")
const passport = require("./config/passport")
const db = require("./config/db")
const userRouter = require("./routes/userRouter")
const adminRouter = require("./routes/adminRouter")
const vendorRouter = require("./routes/vendorRouter")



db()

// Middleware to prevent  caching
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});


// Middleware setup
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Initialize passport without session
app.use(passport.initialize())

// Set views directory
app.set("views", [
    path.join(__dirname, "views/User"),
    path.join(__dirname, "views/Admin"),
    path.join(__dirname, "views/Vendor")
])

app.use(express.static("public"))
app.set("view engine", "ejs")

// Define routes
app.use("/", userRouter)
app.use("/admin", adminRouter)
app.use("/vendor", vendorRouter)

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`)
})

module.exports = app;
