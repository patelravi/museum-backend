var express = require('express');
var router = express.Router();

const imageModule = require('./../modules/image');

// Mentor list
router.get('/images', async function (req, res) {

    
    let emailId = req.query.email;
    console.log(' requrest arrived...', emailId);

    //Read image list
    let result = await imageModule.getImagesOfUser(emailId);

    res.json({
        success: true,
        images: result
    });

})

// Mentor list
router.get('/image', async function (req, res) {

    
    let imageId = req.query.id;
    console.log(' requrest arrived...', imageId);

    //Read image list
    let result = await imageModule.getImagesOfUser(imageId);

    res.json({
        success: true,
        images: result
    });

})


module.exports = router;
