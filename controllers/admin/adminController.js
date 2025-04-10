const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const Vendor = require("../../models/vendorSchema");

//Page error
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
    res.render("admin-login", { message: error, error: error, csrfToken: req.csrfToken ? req.csrfToken() : '' });

}
//Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).render("admin-login", {
                message: "Email and password are required",
                error: "Email and password are required"
            });
        }



        const admin = await User.findOne({ email, isAdmin: true });
        if (!admin || !admin.isAdmin) {
            return res.status(401).render("admin-login", {
                message: "Admin account not found",
                error: "Admin account not found"
            });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.status(401).render("admin-login", {
                message: "Incorrect email or password",
                error: "Incorrect email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                isAdmin: true,
                email: admin.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 3600000, // 1 hour in milliseconds
            path: '/'
        });



        return res.redirect("/admin/");

    } catch (error) {
        console.error("Login error:", error);
        return res.redirect("/page-error");
    }
};


//loading of Dashboard
const loadDashboard = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId)

        if (!admin || !admin.isAdmin) {
            return res.redirect("/admin/login?error=Unauthorized access");
        }

        res.render('dashboard');
    } catch (error) {
        console.error('Dashboard error:', error);
        return res.redirect("/page-error");
    }
};


//Loading of users list
const loadUsers = async (req, res) => {
    try {
        const adminId = req.user.id;

        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 3; // Number of users per page
        const skip = (page - 1) * limit;

        const [totalUsers, activeUsers, newUsers, users, admin, totalCount] = await Promise.all([
            User.countDocuments({ isAdmin: false }),
            User.countDocuments({ isActive: true, isAdmin: false }),
            User.countDocuments({
                createdAt: { $gte: new Date(new Date().setDate(1)).setHours(0, 0, 0, 0) },
                isAdmin: false
            }),
            User.find(
                { isAdmin: false },
                '_id name email createdAt isBlocked'
            )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.findById(adminId),
            User.countDocuments({ isAdmin: false }) // Total count for pagination
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        if (!admin || !admin.isAdmin) {
            return res.redirect("/admin/login?error=Unauthorized access");
        }

        res.render("users", {
            admin,
            users,
            totalUsers,
            activeUsers,
            newUsers,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });

    } catch (error) {
        console.error("Error loading users:", error);
        return res.redirect("/page-error");
    }
};


//Customer Block
const customerBlocked = async (req, res) => {
    try {
        const { id } = req.body;
        console.log("Blocking user with ID:", id);

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const user = await User.findById(id);
        if (!user || user.isAdmin) {
            return res.status(404).json({ success: false, message: "User not found or is an admin" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: { isBlocked: true } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(500).json({ success: false, message: "Failed to block user" });
        }

        return res.status(200).json({
            success: true,
            message: "User blocked successfully",
            user: {
                id: updatedUser._id,
                isBlocked: updatedUser.isBlocked
            }
        });
    } catch (error) {
        console.error("Error blocking user:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}



//Customer Unblock
const customerUnblocked = async (req, res) => {
    try {
        const { id } = req.body;
        console.log("Unblocking user with ID:", id);
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const user = await User.findById(id);
        if (!user || user.isAdmin) {
            return res.status(404).json({ success: false, message: "User not found or is an admin" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: { isBlocked: false } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(500).json({ success: false, message: "Failed to unblock user" });
        }

        return res.status(200).json({
            success: true,
            message: "User unblocked successfully",
            user: {
                id: updatedUser._id,
                isBlocked: updatedUser.isBlocked
            }
        });
    } catch (error) {
        console.error("Error unblocking user:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};



//Loading of Bookings
const loadBookings = async (req, res) => {
    try {

        const adminId = req.user.id;
        const admin = await User.findById(adminId);


        if (!admin || !admin.isAdmin) {
            return res.redirect("/admin/login");
        }

        res.render('bookings');

    } catch (error) {
        console.error('Bookings page error:', error);
        return res.redirect("/page-error");
    }
}



//Load Vendors
const loadVendors = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || !admin.isAdmin) {
            return res.redirect("/admin/login");
        }

        const vendors = await Vendor.find({
            status: 'approved'
        })
            .select('fullName email phone isApproved createdAt')
            .sort({ createdAt: -1 });



        res.render('vendors', {
            admin,
            vendors,
            currentPage: 'vendors'
        });

    } catch (error) {
        console.error('Vendor page error:', error);
        return res.redirect("/page-error");
    }
}


//Pending Vendors
const getPendingVendors = async (req, res) => {
    try {


        const pendingVendors = await Vendor.find({
            status: 'pending'
        })
            .select('fullName email phone createdAt')
            .sort({ createdAt: -1 });


        res.render('pendingVendors', {
            pendingVendors,
            currentPage: 'pendingVendors'
        })

    } catch (error) {
        console.error('Error fetching pending vendors:', error);
        return res.redirect("/page-error");
    }
}

//Approve vendor
const approveVendor = async (req, res) => {
    try {
        const vendorId = req.params.id;

        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendorId,
            {
                status: 'approved',
                isApproved: true
            },
            { new: true }
        )

        if (!updatedVendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Vendor approved successfully'
        })
    } catch (error) {

        console.error('Error approving vendor:', error);
        return res.status(500).json({
            success: false,
            message: 'Error approving vendor'
        });
    }
}


//Reject vendor
const rejectVendor = async (req, res) => {
    try {
        const vendorId = req.params.id;

        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendorId,
            {
                status: 'rejected',
                isApproved: false,
                isBlocked: true
            },
            { new: true }
        );

        if (!updatedVendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Vendor rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting vendor:', error);
        return res.status(500).json({
            success: false,
            message: 'Error rejecting vendor'
        });
    }
}


//Logout
const logout = async (req, res) => {
    try {
        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        return res.redirect("/admin/login");
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).send("Server error");
    }
};



module.exports = {
    loadLogin,
    pageError,
    login,
    loadDashboard,
    logout,
    loadUsers,
    loadBookings,
    loadVendors,
    getPendingVendors,
    approveVendor,
    rejectVendor,
    customerBlocked,
    customerUnblocked
};