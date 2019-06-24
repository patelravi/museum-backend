
const uuidv4 = require('uuid/v4');
const path = require('path');


const awsAccessKeyId = 'AKIA2J7D7VHSSV3LLI44';
const awsAccessKeySecret = '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';
const awsRegion = 'us-west-2';

exports.handler = async (event) => {

    try {
        console.log('Lambda execution started', JSON.stringify(event));

        // Read SNS Message
        let snsMessage = JSON.parse(event.Records[0].Sns.Message);
        console.log('Sns Content =>', snsMessage);

        // Read sender email id
        let senderEmail = snsMessage.mail.source;
        console.log('Sender: ', senderEmail);

        // Create user in dynamo db.
        let userId = saveUserInDb(senderEmail);

        // Read s3 details
        let s3Bucket = snsMessage.receipt.action.bucketName;
        let s3Object = snsMessage.receipt.action.objectKey;

        // Read email content from s3
        let emailContent = await getEmailContentFromS3(s3Bucket, s3Object);
        console.log('Email content fetched successfully.');


        // Parse Email's mime contents
        const mailParser = require('mailparser').simpleParser;
        emailContent = await mailParser(emailContent);
        console.log('Email content parsed successfully.');

        // Read & Save attachments
        for (var i = 0; i < emailContent.attachments.length; i++) {

            let imageObject = emailContent.attachments[i];
            let content = imageObject.content;

            // Read file extension
            let fileExtension = path.extname(imageObject.filename);
            console.log('file extension =>', fileExtension);

            // Generate attachment uniq id
            let s3FileName = uuidv4() + i;
            if (fileExtension) {
                s3FileName = s3FileName + fileExtension;
            }

            // Write image to s3
            let writeResult = await saveAttachmentToS3(s3Bucket, senderEmail, s3FileName, content);
            console.log('Attachment #' + (i + 1) + ' Saved.');

        }

        const response = {
            statusCode: 200
        };

        return response;
    } catch (err) {
        console.error('Error Occured: ', err)
    }
};


//Save User In Db
let saveUserInDb = async function (emailId) {

    let dynamoDb = new aws.DynamoDB.DocumentClient({
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsAccessKeySecret,
        region: awsRegion,
        convertEmptyValues: true
    });

    // Create user with email id
    let params = {
        TableName: 'users',
        Item: {
            "email": emailId
        }
    };
    dynamoDb.put(params, function (error, data) {
        if (error) {
            console.error(error, JSON.stringify(params.Item.info.data));
            return error;
        }
    });

}


// Read email with attachments from s3
var aws = require('aws-sdk');
var s3 = new aws.S3({ accessKeyId: awsAccessKeyId, secretAccessKey: awsAccessKeySecret });
let getEmailContentFromS3 = async function (bucketName, objectKey) {

    var getParams = {
        Bucket: bucketName, //replace example bucket with your s3 bucket name
        Key: objectKey // replace file location with your s3 file location
    }

    let result = await s3.getObject(getParams).promise();
    return result.Body.toString();

}


// Save mail attachment to s3
let saveAttachmentToS3 = async function (bucketName, userId, fileName, data) {

    const params = {
        Bucket: bucketName + '/' + userId,
        Key: fileName,
        Body: data
    };

    await s3.upload(params).promise();

}