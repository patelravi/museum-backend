var express = require('express')
var router = express.Router()

// GetMentors, GetMentorProfile, GetCuratedLists APIs
router.use('/public/', require('./../controllers/publicApi.controller'));

module.exports = router;