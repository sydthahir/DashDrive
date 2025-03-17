const express = require('express');
const app = express();
const path = require("path")
const env = require("dotenv").config()
const cookieParser = require("cookie-parser")
const session = require("express-session")
const passport = require("./config/passport")
const db = require("./config/db")
const userRouter = require("./routes/userRouter")

db()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000

    }
}))

app.use(cookieParser())

app.use(passport.initialize())
app.use(passport.session())


app.use("/", require("./routes/userRouter"))


app.use((req, res, next) => {
    res.set("cache-control", "no-store")
    next()
})

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views/user"), path.join(__dirname, "views/Admin"), path.join(__dirname, "views/Vendor"))
app.use(express.static("public"))

app.use("/", userRouter)

app.listen(process.env.PORT || 3000, () => {
    console.log("Server Running on Port 3001")
})

module.exports = app;




