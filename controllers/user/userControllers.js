const User = require("../../models/userSchema")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const env = require("dotenv").config()
const nodemailer = require("nodemailer")
const { use } = require("../../app")





const loadHomepage = async (req, res) => {
    try {
        return res.render("home")
        console.log("home page loaded")

    } catch (error) {

        console.log("Home page not found");
        res.status(500).send("Server error")

    }
}

const loadSignup = async (req, res) => {
    try {
        return res.render("signup")
    } catch (error) {
        console.log("signup page is not found")
        res.status(500).send("Server Error")
    }
}


function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString()
}


async function sendverifyEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Email Verification for Your Account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP : ${otp}</b>`
        })

        return info.accepted.length > 0

    } catch (error) {
        console.error("Error while sending email", error)
        return false
    }

}


//User registration

const signup = async (req, res) => {


    try {

        const { name, email, password, confirm_password } = req.body

        if (password !== confirm_password) {
            return res.rener("signup", { message: "Password does not match" })
        }

        const findUser = await User.findOne({ email })
        if (findUser) {
            return res.render("signup", { message: "User already exists" })
        }

        const otp = generateOTP()

        const emailSend = await sendverifyEmail(email, otp)

        if (!emailSend) {
            return res.json("Error while sending email")
        }



        res.render("verify-otp")
        console.log("OTP sent successfully", otp);





        // return res.redirect("/login")
        // console.log("User created successfully")



    } catch (error) {
        console.error("Error while creating user", error)
        res.redirect("/pageNotFound")
    }
}


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {

    }
}


const verifyOTP = async (req, res) => {
    try {

        const { otp } = req.body
        console.log(otp);

        if (otp === req.session.userOtp) {
            const user = req.session.userData
            const passwordHash = await securePassword(user.password)

            const newUser = new User({
                name: user.name,
                email: user.email,
                password: passwordHash
            })
            console.log(newUser);


            await newUser.save()


            const token = jwt.sign(
                { userId: newUser._id, email: newUser.email },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            )

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            req.session.destroy();

            return res.json({ success: true, message: "OTP verified successfully", token });

        } else {
            return res.status(400).json({ success: false, message: "Invalid OTP,Try again" });
        }

    } catch (error) {

        console.error("Error verifying OTP:", error)
        res.status(500).json({ success: false, message: "Server error" })

    }
}

const loadLogin = async (req, res) => {
    try {
        return res.render("login")
    } catch (error) {
        console.log("login page is not found")
        res.status(500).send("Server Error")
    }
}

module.exports = {
    loadHomepage,
    loadSignup,
    signup,
    loadLogin,
    verifyOTP
}