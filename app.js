const express = require('express');
const app = express();
const env = require("dotenv").config()
const db = require("./config/db")
db()

app.listen(process.env.PORT || 3001,()=>{
    console.log("Server Running on Port 3000")       
})

module.exports = app;      




