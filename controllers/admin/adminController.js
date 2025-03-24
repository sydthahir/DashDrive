const User = require("../../models/userSchema")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');
const env = require("dotenv").config();


const loadLogin = (req, res) => {
    const error = req.query.error || null

    res.render("admin-login", { message: null })

}
const login = async (req, res) => {
    try {

        const { email, password } = req.body

        if (!email || !password) {
            return res.redirect('/admin/login?error=Email and password are required');
        }
        // Find an admin user with the provided email

        const admin = await User.findOne({ email, isAdmin: true })
        if (!admin) {
            return res.redirect('/admin/login?error=Invalid credentials');
        }


        const passwordMatch = await bcrypt.compare(password, admin.password)
        if (!passwordMatch) {
            return res.redirect('/admin/login?error=Invalid credentials');
        }

        // Generate a JWT token

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        })

        res.redirect("/admin/")


    } catch (error) {
        console.log("login error", error);
        return res.redirect("/page-error")


    }

}


const loadDashboard = async (req, res) => {
    try {
        // Get the admin user ID from the request 
        const adminId = req.userId;
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newUsers = await User.countDocuments({ createdAt: { $gte: startOfMonth } });
        const users = await User.find({}, 'id name email joinDate isBlocked');

        // Fetch vendors (if needed)
        const vendors = await User.find({ isVendor: true });
        // Fetch admin details
        const admin = await User.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.render('dashboard', {
            totalUsers,
            activeUsers,
            newUsers,
            users,
            vendors



        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return res.redirect("/page-error")
    }
};


const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
};


module.exports = {
    loadLogin,
    login,
    loadDashboard,
    logout
} 