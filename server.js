require('dotenv').config()
const express = require('express')
const layouts = require('express-ejs-layouts')
const session = require('express-session')
const passport = require('./config/ppConfig')
const isLoggedIn = require('./middleware/isLoggedIn')
const app = express()
const flash = require('connect-flash')
const axios = require('axios')
const db = require('./models')

app.set('view engine', 'ejs')

app.use(require('morgan')('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'))
app.use(layouts)

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
)
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
    // before every route, attach the flash messages and current user to res.locals
    // res.locals.alerts = req.flash()
    res.locals.currentUser = req.user
    next()
})

// app.get('/', (req, res) => {
//   {
//     res.render('./auth/login')
//   }
// })

app.get('/', isLoggedIn, (req, res) => {
    {
        res.render('index')
    }
})

app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile')
})

app.get('/results', (req, res) => {
    const queryString = {
        params: {
            q: req.query.track,
        },
    }
    axios
        .get(
            `https://api.spotify.com/v1/search?q=${queryString.params.q}&type=track&limit=5`, {
                headers: {
                    Authorization: `Bearer ${req.user.access}`,
                },
            }
        )
        .then(function(response) {
            // console.log(response.data.tracks.items[0])
            res.render('results', {
                tracks: response.data.tracks.items,
            })
        })
        .catch((error) => {
            console.log(error)
        })
})

app.get('/tracks/:id', function(req, res) {
    const queryString = {
        params: {
            id: req.params.id,
        },
    }

    axios
        .get(`https://api.spotify.com/v1/tracks/${queryString.params.id}`, {
            headers: {
                Authorization: `Bearer ${req.user.access}`,
            },
        })
        .then(function(spotifyResponse) {
            db.comment
                .findAll({ where: { trackId: spotifyResponse.data.id } })
                .then((allComments) => {
                    // console.log(allComments)
                    res.render('track', {
                        comments: allComments,
                        track: spotifyResponse.data,
                        userId: req.user.id,
                    })
                })
        })
})

app.post('/track', (req, res) => {
    db.user
        .findOne({ where: { spotifyId: req.user.spotifyId } })
        .then(function(user) {
            user
                .createComment({
                    text: req.body.text,
                    userId: req.body.userId,
                    trackId: req.body.spotifyId,
                })
                .then(function(comment) {
                    // console.log(comment.text)
                    res.redirect('back')
                })
        })
})

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});


app.use('/auth', require('./routes/auth'))

var server = app.listen(process.env.PORT || 3000, () =>
    console.log(
        `🎧You're listening to the smooth sounds of port ${
      process.env.PORT || 3000
    }🎧`
    )
)

module.exports = server

// This is a comment for a test, and this right here is the second commment to test if the process works