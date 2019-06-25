
var aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');

// Save image to s3
exports.saveImageToS3 = async function (bucketName, userId, fileName, data) {

    var s3 = new aws.S3({
        accessKeyId: deployConfig.s3.awsAccessKeyId,
        secretAccessKey: deployConfig.s3.awsAccessKeySecret
    });

    const params = {
        Bucket: bucketName + '/' + userId,
        Key: fileName,
        Body: data
    };

    await s3.upload(params).promise();

}

// Save Attachment Against User In Db
exports.saveImageInDb = async function (emailId, s3ObjectId, bucketName) {

    let dynamoDb = new aws.DynamoDB.DocumentClient({
        accessKeyId: deployConfig.ddb.awsAccessKeyId,
        secretAccessKey: deployConfig.ddb.awsAccessKeySecret,
        region: deployConfig.ddb.awsRegion,
        convertEmptyValues: true
    });

    // Generate Unique attachment id
    let imageId = uuidv4();

    // Create user with email id
    let params = {
        TableName: 'images',
        Item: {
            "id": imageId,
            "email": emailId,
            "s3ObjectID": s3ObjectId,
            "s3BucketName": bucketName
        }
    };

    // Store image link in dynamo db
    await dynamoDb.put(params).promise();
    console.log("Image for given user saved in db.")

}


exports.getImagesOfUser = async function (emailId) {

    let dynamoDb = new aws.DynamoDB.DocumentClient({
        accessKeyId: deployConfig.ddb.awsAccessKeyId,
        secretAccessKey: deployConfig.ddb.awsAccessKeySecret,
        region: deployConfig.ddb.awsRegion,
        convertEmptyValues: true
    });

    let query = {
        TableName: "images",
        ProjectionExpression: "id, #em, s3ObjectID, s3BucketName",
        FilterExpression: "#em = :email",
        ExpressionAttributeNames: {
            "#em": "email",
        },
        ExpressionAttributeValues: {
            ":email": emailId
        }
    }

    let result = await dynamoDb.scan(query).promise();
    let imageList = result.Items;
    console.log('Image lsit is =>', imageList);
    // Itereate and generate temporary url for each iamges

    var s3 = new aws.S3({
        accessKeyId: deployConfig.s3.awsAccessKeyId,
        secretAccessKey: deployConfig.s3.awsAccessKeySecret,
        region: deployConfig.s3.awsRegion,
    });
    const urlExpiryTime = 60 * 5;

    for (var i = 0; i < imageList.length; i++) {


        let s3ObjectId = imageList[i].s3ObjectID;
        let bucketName = imageList[i].s3BucketName;
        
        const params = {
            Bucket: bucketName ,
            Key: emailId + '/' + s3ObjectId,
            Expires: urlExpiryTime
        };

        var signedUrl = s3.getSignedUrl('getObject', params);

        imageList[i] = {
            id: imageList[i].id,
            url: signedUrl
        };
    }

    return imageList;
}

exports.getImageById = async function (imageId) {

    let dynamoDb = new aws.DynamoDB.DocumentClient({
        accessKeyId: deployConfig.ddb.awsAccessKeyId,
        secretAccessKey: deployConfig.ddb.awsAccessKeySecret,
        region: deployConfig.ddb.awsRegion,
        convertEmptyValues: true
    });

    let query = {
        TableName: "images",
        ProjectionExpression: "#d, s3ObjectID, s3BucketName",
        FilterExpression: "#d = :id",
        ExpressionAttributeNames: {
            "#d": "id",
        },
        ExpressionAttributeValues: {
            ":id": imageId
        }
    }

    let result = await dynamoDb.scan(query).promise();
    // let image = result;
    console.log('Image  is =>', result);
    return null;
    // Itereate and generate temporary url for each iamges

    var s3 = new aws.S3({
        accessKeyId: deployConfig.s3.awsAccessKeyId,
        secretAccessKey: deployConfig.s3.awsAccessKeySecret,
        region: deployConfig.s3.awsRegion,
    });
    const urlExpiryTime = 60 * 5;

    for (var i = 0; i < imageList.length; i++) {


        let s3ObjectId = imageList[i].s3ObjectID;
        let bucketName = imageList[i].s3BucketName;
        
        const params = {
            Bucket: bucketName ,
            Key: emailId + '/' + s3ObjectId,
            Expires: urlExpiryTime
        };

        var signedUrl = s3.getSignedUrl('getObject', params);

        imageList[i] = {
            id: imageList[i].id,
            url: signedUrl
        };
    }

    return imageList;
}