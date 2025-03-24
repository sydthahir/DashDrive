const passport = require("passport")
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/userSchema")
const env = require("dotenv").config()


const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
}



passport.use(
    new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            const user = await User.findById(jwt_payload.id)
            if (user) return done(null, user)
            return done(null, false);
        } catch (err) {
            return done(err, false)
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

            let user = await User.findOne({ googleId: profile.id })
            if (user) {
                return done(null, user)
            } else {
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id
                })
                await user.save()
                return done(null, user)
              
            }

        } catch (error) {
            return done(error, null)


        }
    }

))





module.exports = passport
