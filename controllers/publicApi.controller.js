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
router.get('/image/:id', async function (req, res) {


    let imageId = req.params.id;
    console.log(' requrest arrived...', imageId);

    //Read image list
    try {
        let result = await imageModule.getImageById(imageId);

        res.json({
            success: true,
            url: result
        });
    } catch (err) {
        console.error(err);
        res.json({
            success: false,
            data: err
        });
    }

})


module.exports = router;
