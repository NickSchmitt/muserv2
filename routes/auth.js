const express = require('express')
const passport = require('../config/ppConfig')
const db = require('../models')
const router = express.Router()

router.get('/auth/spotify', passport.authenticate('spotify'))

router.get(
  '/auth/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    db.user
      .findOrCreate({
        where: {
          firstName: 'Brian',
          lastName: 'Smith',
        },
        defaults: { age: 88 },
      })
      .then(function ([user, created]) {
        console.log(user) // returns info about the user
      })
    res.redirect('/')
  }
)

// router.get('/signup', (req, res) => {
//   res.render('auth/signup');
// });

// router.post('/signup', (req, res) => {
//   // find or create a user, providing the name and password as default values
//   db.user.findOrCreate({
//     where: {
//       email: req.body.email
//     }, defaults: {
//       name: req.body.name,
//       password: req.body.password
//     }
//   }).then(([user, created]) => {
//     if (created) {
//       // if created, success and login
//       console.log('user created');
//       passport.authenticate('local', {
//         successRedirect: '/',
//         successFlash: 'Account created and logged in'
//       })(req, res);
//     } else {
//       // if not created, the email already exists
//       req.flash('error', 'Email already exists');
//       res.redirect('/auth/signup');
//     }
//   }).catch(error => {
//     // if an error occurs, let's see what the error is
//     req.flash('error', error.message);
//     res.redirect('/auth/signup');
//   });
// })

// router.get('/login', (req, res) => {
//   res.render('auth/login');
// });

// router.post('/login', passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/auth/login',
//   failureFlash: 'Invalid username and/or password',
//   successFlash: 'You have logged in'
// }));

// router.get('/logout', (req, res) => {
//   req.logout();
//   req.flash('success', 'You have logged out');
//   res.redirect('/');
// });

module.exports = router
