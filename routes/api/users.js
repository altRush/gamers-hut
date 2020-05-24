const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')

const User = require('../../models/User')

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
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

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] })
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200', //size
        r: 'pg', // rating
        d: 'mm' // default image
      })

      // Ready an instance of a User model
      user = new User({
        name,
        email,
        avatar,
        password
      })

      // Encrypt password
      // Generate salt in order to hash
      const salt = await bcrypt.genSalt(10)

      // Hash the password with salt
      user.password = await bcrypt.hash(password, salt)

      await user.save()

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
