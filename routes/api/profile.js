const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')

const { check, validationResult } = require('express-validator')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

// Route:           GET api/profile/me
// Description:     Get current users profile
// Access:          Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar'])
    // populate() is to bring in the the properties from another schema

    // If no profile then exit with 400 error message
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' })
    }

    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

// Route:         POST api/profile
// Description:   Create or update user profile
// Access:        Private

router.post(
  '/',
  [auth, [check('gameGenre', 'Game genre is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      gameGenre,
      favoriteGames,
      website,
      location,
      bio,
      youtube,
      twitter,
      facebook,
      instagram
    } = req.body

    // Build profile object
    const profileFields = {}
    profileFields.user = req.user.id
    if (gameGenre) profileFields.gameGenre = gameGenre
    if (favoriteGames)
      profileFields.favoriteGames = favoriteGames
        .split(',')
        .map(game => game.trim())
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio

    // Build social object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube
    if (twitter) profileFields.social.twitter = twitter
    if (facebook) profileFields.social.facebook = facebook
    if (instagram) profileFields.social.instagram = instagram

    try {
      let profile = await Profile.findOne({ user: req.user.id })
      // ***REMEMBER** Everytime you use a mongoose method we need to apply 'async/await' since mongoose returns promises

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        )

        return res.json(profile)
      }

      // If profile doesn't exist then create new
      profile = new Profile(profileFields)

      await profile.save() // await since we are using mongoose
      res.json(profile)
    } catch (err) {
      console.error(err.message)
      res.status(500).send('Server Error')
    }
  }
)

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar'])
    res.json(profiles)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server Error')
  }
})

module.exports = router
