const passport = require('passport')
const SpotifyStrategy = require('passport-spotify').Strategy
const db = require('../models')

/*
 * Passport "serializes" objects to make them easy to store, converting the
 * user to an identifier (id)
 */
passport.serializeUser((user, cb) => {
    cb(null, user.id)
})

/*
 * Passport "deserializes" objects by taking the user's serialization (id)
 * and looking it up in the database
 */
passport.deserializeUser((id, cb) => {
    db.user
        .findByPk(id)
        .then((user) => {
            cb(null, user)
        })
        .catch(cb)
})

/*
 * This is Passport's strategy to provide local authentication. We provide the
 * following information to the LocalStrategy:
 *
 * Configuration: An object of data to identify our authentication fields, the
 * username and password
 *
 * Callback function: A function that's called to log the user in. We can pass
 * the email and password to a database query, and return the appropriate
 * information in the callback. Think of "cb" as a function that'll later look
 * like this:
 *
 * login(error, user) {
 *   // do stuff
 * }
 *
 * We need to provide the error as the first argument, and the user as the
 * second argument. We can provide "null" if there's no error, or "false" if
 * there's no user.
 */
passport.use(
    new SpotifyStrategy({
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/auth/spotify/callback',
        },
        function(accessToken, refreshToken, expires_in, profile, done) {
            db.user
                .findOrCreate({
                    where: {
                        spotifyId: profile.id,
                    },
                })
                .then(function([user, created]) {
                    user.name = profile.displayName
                    if (profile.photos.length > 0) {
                        user.profilePic = profile.photos[0]
                    } else {
                        // TODO: ADD URL TO MUSER DEFAULT ICON IN THE STRING BELOW
                        user.profilePic = ''
                    }
                    user.access = accessToken
                    user.refresh = refreshToken
                    user.save().then(function() {
                            return done(null, user)
                        })
                        // returns info about the user
                })
        }
    )
)

// export the Passport configuration from this module
module.exports = passport