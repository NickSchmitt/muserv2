require('dotenv').config()
const express = require('express')
const layouts = require('express-ejs-layouts')
const session = require('express-session')
const passport = require('./config/ppConfig')
const isLoggedIn = require('./middleware/isLoggedIn')
const app = express()
const flash = require('connect-flash')
const axios = require('axios')

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
  console.log(res.locals.currentUser)
  const queryString = {
    params: {
      q: req.query.track,
    },
  }
  axios
    .get(
      `https://api.spotify.com/v1/search?q=${queryString.params.q}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${req.user.access}`,
        },
      }
    )
    .then(function (response) {
      // console.log(response.data.tracks.items[0])
      res.render('results', {
        tracks: response.data.tracks.items,
      })
    })
    .catch((error) => {
      console.log(error)
    })
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

// This is a comment for a test, and this right here is the second commment to test if the process works
