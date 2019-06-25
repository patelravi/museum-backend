
const uuidv4 = require('uuid/v4');
const path = require('path');
var aws = require('aws-sdk');

require('./../config.js');
let userModule = require('./../modules/user');
let imageModule = require('./../modules/image');

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
        userModule.saveUserInDb(senderEmail);

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
            let writeResult = await imageModule.saveImageToS3(s3Bucket, senderEmail, s3FileName, content);
            console.log('Attachment #' + (i + 1) + ' Saved.');

            // Save image in db against user
            imageModule.saveImageInDb(senderEmail, s3FileName, s3Bucket);

        }

        const response = {
            statusCode: 200
        };

        return response;
    } catch (err) {
        console.error('Error Occured: ', err)
    }
};

// Read email with attachments from s3
let getEmailContentFromS3 = async function (bucketName, objectKey) {

    var s3 = new aws.S3({ accessKeyId: deployConfig.s3.awsAccessKeyId, secretAccessKey: deployConfig.s3.awsAccessKeySecret });

    var getParams = {
        Bucket: bucketName, //replace example bucket with your s3 bucket name
        Key: objectKey // replace file location with your s3 file location
    }

    let result = await s3.getObject(getParams).promise();
    return result.Body.toString();

}
