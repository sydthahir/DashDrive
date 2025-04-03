const passport = require("passport")
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/userSchema")
const jwt = require("jsonwebtoken");
const env = require("dotenv").config()

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
}

passport.use(
    new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            // Use userId instead of id to be consistent
            const user = await User.findById(jwt_payload.userId)
            if (user) {
                if (user.isBlocked) {
                    return done(null, false, { message: "User is blocked" });
                }
                return done(null, user);
            }
            return done(null, false, { message: "User not found" });
        } catch (err) {
            return done(err, false);
        }
    })
)

//Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
                // Check if user is blocked
                if (user.isBlocked) {
                    return done(null, false, { message: "User is blocked" });
                }
                return done(null, user);
            } else {
                // Create new user
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    isVerified: true, // Google users are pre-verified
                    isAdmin: 0
                });
                await user.save();
                return done(null, user);
            }
        } catch (error) {
            console.error("Google auth error:", error);
            return done(error, null);
        }
    }
))

module.exports = passport
