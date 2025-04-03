const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
require("dotenv").config();



const pageError = async (req, res) => {
    try {

        res.render("page-error")
    } catch (error) {
        res.redirect("/pageNotFound")

    }

}


//Loading of login page 
const loadLogin = (req, res) => {
    const error = req.query.error || null;
    res.render("vendor-login", { message: error, error: error });
};






module.exports = {
    loadLogin
}