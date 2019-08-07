var aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');

// Save image to s3
exports.saveImageToS3 = async function (bucketName, userId, fileName, data) {

    var s3 = new aws.S3({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret
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
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
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

    return imageId;

}

// Update image metadata
exports.updateImageMetadata = async function (imageId, title, painting, description) {
    let dynamoDb = new aws.DynamoDB({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
        convertEmptyValues: true
    });

    // Create user with email id
    let query = {
        Key: {
            id: {
                S: imageId
            }
        },
        TableName: "images",
        ExpressionAttributeNames: {
            "#t": "title",
            "#p": "painting",
            "#d": "description"
        },
        ExpressionAttributeValues: {
            ":t": {
                S: title
            },
            ":p": {
                S: painting
            },
            ":d": {
                S: description
            }
        },
        UpdateExpression: "SET #t = :t, #p = :p, #d = :d"
    };

    // Store image link in dynamo db
    await dynamoDb.updateItem(query).promise();
    console.log("Image metadata saved in db.")

    return;
}

// Get image metadata by image id
exports.getImageMetadataById = async function (imageId) {
    let dynamoDb = new aws.DynamoDB({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
        convertEmptyValues: true
    });

    let query = {
        TableName: "images",
        ProjectionExpression: "id, title, painting, description",
        Key: {
            "id": { "S": imageId }
        },
    }
    let result = (await dynamoDb.getItem(query).promise()).Item;
    if (!result) {
        return;
    }

    result = {
        title: result.title.S,
        painting: result.painting.S,
        description: result.description.S
    }
    return result;
}

exports.getImageList = async function (pageOptions, lastEvaluatedKey) {
    let dynamoDb = new aws.DynamoDB({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
        convertEmptyValues: true
    });

    let query = {
        TableName: "images",
        ProjectionExpression: "id, email, s3ObjectID, s3BucketName",
        Limit: pageOptions.limit,
        ScanIndexForward: false
    }

    if (lastEvaluatedKey) {
        query.ExclusiveStartKey = {
            "id": {
                "S": lastEvaluatedKey
            }
        };
    }

    let result = await dynamoDb.scan(query).promise();
    if (!result) {
        return;
    }
    return result;
}

exports.getImagesOfUser = async function (emailId) {

    let dynamoDb = new aws.DynamoDB.DocumentClient({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
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
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
    });
    const urlExpiryTime = 60 * 5;

    for (var i = 0; i < imageList.length; i++) {


        let s3ObjectId = imageList[i].s3ObjectID;
        let bucketName = imageList[i].s3BucketName;

        const params = {
            Bucket: bucketName,
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

    // Read image object from dynamo
    let dynamoDb = new aws.DynamoDB({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
        convertEmptyValues: true
    });
    let query = {
        TableName: "images",
        ProjectionExpression: "id, email, s3ObjectID, s3BucketName",
        Key: {
            "id": { "S": imageId }
        },
    }
    let result = await dynamoDb.getItem(query).promise();
    if (!result) {
        return null;
    }

    // Generate signed url of image
    let s3ObjectId = result.Item.s3ObjectID.S;
    let bucketName = result.Item.s3BucketName.S;
    let email = result.Item.email.S;

    var s3 = new aws.S3({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
    });
    const urlExpiryTime = 60 * 5;

    const params = {
        Bucket: bucketName,
        Key: email + '/' + s3ObjectId,
        Expires: urlExpiryTime
    };
    var signedUrl = s3.getSignedUrl('getObject', params);

    // Return image signed url
    return signedUrl;
}