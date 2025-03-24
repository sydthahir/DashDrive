const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    try {

        const token = req.cookies.token;

        if (!token) {
            return res.redirect("/admin/login");
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.id;

        next();
    } catch (error) {
        return res.redirect('/admin/login');
    }
};

module.exports = adminAuth