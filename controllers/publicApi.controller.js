var express = require('express');
var router = express.Router();

const imageModule = require('./../modules/image');
const userModule = require('./../modules/user');

// Image list
router.get('/images', async function (req, res) {


    let emailId = req.query.email;
    console.log(' requrest arrived...', emailId);

    //Read image list
    let result = await imageModule.getImagesOfUser(emailId);

    res.json({
        success: true,
        images: result
    });

});

// Image Details
router.get('/image/:id', async function (req, res) {


    let imageId = req.params.id;
    console.log(' requrest arrived...', imageId);

    //Read image list
    try {
        let result = await imageModule.getImageById(imageId);

        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error(err);
        res.json({
            success: false,
            data: err
        });
    }

});

// Update image metadata
router.post('/updateImage/:id', async function (req, res) {
    let imageId = req.params.id;
    let title = req.body.title;
    let painting = req.body.painting;
    let description = req.body.description;

    try {
        await imageModule.updateImageMetadata(imageId, title, painting, description);
        res.json({
            success: true
        })
    } catch (err) {
        console.error(err);
        res.json({
            success: false,
            data: err
        });
    }
})

// Get image metadata by id
router.get('/image/metadata/:id', async function (req, res) {
    let imageId = req.params.id;

    try {
        let result = await imageModule.getImageMetadataById(imageId);
        res.json({
            success: true,
            data: result
        })
    } catch (err) {
        console.error(err);
        res.json({
            success: false,
            data: err
        });
    }
})

// Get Details
router.get('/user/:email', async function (req, res) {


    let email = req.params.email;
    console.log('get user details requrest arrived...', email);

    //Read image list
    try {
        let result = await userModule.getUserDetails(email);

        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error(err);
        res.json({
            success: false,
            data: err
        });
    }

});

// Update User Details
router.put('/user', async function (req, res) {


    let email = req.body.email;
    let userName = req.body.userName;
    let name = req.body.name;
    let location = req.body.location;

    console.log('update user details requrest arrived...', req.body);

    //Read image list
    try {

        let result = await userModule.updateUserDetails(email, userName, name, location);

        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error(err);
        res.json({
            success: false,
            data: err
        });
    }

});

module.exports = router;
