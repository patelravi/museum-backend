
var aws = require('aws-sdk');

//Save User In Db
exports.saveUserInDb = async function (emailId) {

    let dynamoDb = new aws.DynamoDB.DocumentClient({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
        convertEmptyValues: true
    });
    console.log('==> db query config', {
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
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

exports.sendImageProcessedEmail = async function (emailId, imageIdList) {

    var ses = new aws.SES({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
        apiVersion: "2010-12-01"
    });

    let emailMessage = '<html><body>Hi,' +
        '<p>We have processed images from the email that you sent. Link for each is given below.</p>' +
        '<br />';
    console.log('fisrt meail message =>', emailMessage);

    //Build image url list
    let baseUrl = global.deployConfig.baseUrl + '/art/';
    for (var i = 0; i < imageIdList.length; i++) {
        let imgUrl = baseUrl + imageIdList[i];
        let link = '<a href="' + imgUrl + '">' + imgUrl + '</a>';
        emailMessage = emailMessage.toString() + '<br />' + link.toString();
    }

    //End message html tags
    emailMessage += '</body></html>';
    console.log('email message is ', emailMessage)
    const params = {
        Source: "connect@morganstreetpartners.com",
        Destination: {
            ToAddresses: [emailId]
        },
        Message: {
            Body: {
                Html: {
                    // HTML Format of the email
                    Charset: "UTF-8",
                    Data: emailMessage
                },
                // Text: {
                //     Charset: "UTF-8",
                //     Data: "Hello Charith Sample description time 1517831318946"
                // }
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Museum - Images Uploaded Successfully"
            }
        }
    };

    let response = await ses.sendEmail(params).promise();
    console.log('Email Sent. Result =>', response);
}
