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
const chalk = require('chalk')
const methodOverride = require('method-override')

app.set('view engine', 'ejs')

// app.use(require('morgan')('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'))
app.use(layouts)
app.use(methodOverride('_method'))

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



//--------checks if user is signed in and grabs all comments from comment database 


app.get('/profile', isLoggedIn, (req, res) => {
    db.comment.findAll().then((allComments) => {
        res.render('profile', {
            comments: allComments,
        })
    })
})



//--------

app.get('/results', (req, res) => {
    const queryString = {
        params: {
            q: req.query.track,
            type: req.query.type,
            limit: req.query.limit,
        },
    }
    axios
        .get(
            `https://api.spotify.com/v1/search?q=${queryString.params.q}&type=${queryString.params.type}&limit=${queryString.params.limit}`, {
                headers: {
                    Authorization: `Bearer ${req.user.access}`,
                },
            }
        )
        .then(function(response) {
            res.render('results', {
                data: response.data,
                params: queryString.params,
            })
        })
        .catch((error) => {
            console.log(error)
        })
})



//--------


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
                .findAll({
                    where: { trackId: spotifyResponse.data.id },
                    include: [db.user],
                })
                .then((allComments) => {
                    // res.send(allComments)
                    res.render('track', {
                        comments: allComments,
                        track: spotifyResponse.data,
                    })
                })
                .catch((error) => {
                    console.log(error)
                })
        })
})



//--------



app.get('/artists/:id', function(req, res) {
    const queryString = {
        params: {
            id: req.params.id,
        },
    }

    axios
        .get(`https://api.spotify.com/v1/artists/${queryString.params.id}`, {
            headers: {
                Authorization: `Bearer ${req.user.access}`,
            },
        })
        .then(function(artistResponse) {
            axios
                .get(
                    `https://api.spotify.com/v1/artists/${queryString.params.id}/top-tracks?country=US`, {
                        headers: {
                            Authorization: `Bearer ${req.user.access}`,
                        },
                    }
                )
                .then(function(topTracksResponse) {
                    res.render('artist', {
                        artist: artistResponse.data,
                        tracks: topTracksResponse.data.tracks,
                    })
                })
                //   TODO: FIND ALL COMMENTS WHERE TRACKID'S SONG MATCHES ARTIST
                // db.comment
                //   .findAll({ where: { trackId: spotifyResponse.data.id } })
                //   .then((allComments) => {
                //     res.render('track', {
                //       comments: allComments,
                //       track: spotifyResponse.data,
                //     })
                //   })
        })
})


//-------- add usnique user to comment

app.post('/track', (req, res) => {
    db.user
        .findOne({ where: { spotifyId: req.user.spotifyId } })
        .then(function(user) {
            user
                .createComment({
                    text: req.body.text,
                    userId: req.user.id,
                    trackId: req.body.spotifyId,
                })
                .then(function(comment) {
                    user.addComment(comment)
                    res.redirect('back')
                })
        })
})



// *** EDIT COMMENT
app.get('/edit/:id', (req, res) => {
    const id = req.params.id
    console.log(chalk.red(id))
    db.comment
        .findOne({
            where: { id: id },
        })
        .then((comment) => {
            res.render('editcomment', {
                comment: comment,
            })
        })
})



app.put('/comments/:id', (req, res) => {
    const id = req.body.commentId

    db.comment
        .update({ text: req.body.text }, {
            where: { id: id },
        })
        .then((comment) => {
            res.redirect('/')
        })
})




// *** DELETE COMMENT
app.delete('/comment/:id', (req, res) => {
    const id = req.params.id
    db.comment
        .destroy({
            where: { id: id },
        })
        .then((deletedComment) => {
            res.redirect('back')
        })
})

//-------- renders about page 

app.get('/about', isLoggedIn, function(req, res) {
    res.render('about')
})


//-------- logs  user out 

app.get('/logout', function(req, res) {
    req.logout()
    res.redirect('/')
})



app.use('/auth', require('./routes/auth'))

var server = app.listen(process.env.PORT || 3000, () =>
    console.log(
        `🎧You're listening to the smooth sounds of port ${
      process.env.PORT || 3000
    }🎧`
    )
)

module.exports = server