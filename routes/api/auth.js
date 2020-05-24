const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')

const User = require('../../models/User')

// @route   GET api/auth
// @desc    Test route
// @access  Public

// Second params is the AUTH middleware to help protect the route
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password') // 'req.user' came from token, '-password' is to excludes password
    res.json(user)
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required.').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body

    try {
      // See if user exists
      let user = await User.findOne({ email })

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credential' }] })
      }

      // using Bcrypt to compare the plain text password against the encrypted one to see if it is a match
      const isMatch = await bcrypt.compare(password, user.password)

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credential' }] })
      }

      // Return josnwebtoken

      const payload = {
        user: {
          id: user.id
        }
      }

      // JsonWebToken sign
      // Payload === user.id
      // config.get === secret token in config file
      // expires in === duration that the token is valid
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err
          res.json({ token })
        }
      )
    } catch (err) {
      console.error(err.message)
      res.status(500).send('Server error')
    }
  }
)

module.exports = router
