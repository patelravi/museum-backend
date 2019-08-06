
var aws = require('aws-sdk');
const imageModule = require("./image");

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

// Get user details for profile
exports.getUserDetails = async function (userEmail) {

    // Read image object from dynamo
    let dynamoDb = new aws.DynamoDB({
        accessKeyId: deployConfig.awsAccessKeyId,
        secretAccessKey: deployConfig.awsAccessKeySecret,
        region: deployConfig.awsRegion,
        convertEmptyValues: true
    });

    let query = {
        TableName: "users",
        ProjectionExpression: "email, fullName, userName, userLocation",
        Key: {
            "email": { "S": userEmail }
        },
    }

    let result = await dynamoDb.getItem(query).promise();
    if (!result.Item) {
        return null;
    }

    result = result.Item;
    result.email = result.email.S;
    result.fullName = result.fullName ? result.fullName.S : null;
    result.userName = result.userName ? result.userName.S : null;
    result.userLocation = result.userLocation ? result.userLocation.S : null;
    // response.
    return result;
}

// Update user details for profile
exports.updateUserDetails = async function (email, userName, name, location) {

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
            "email": email,
            'userName': userName,
            'fullName': name,
            'userLocation': location
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

    let emailMessage = "<html><body>Hi! Just wanted to let you know we received the following pictures you sent!<p>";

    //Build image url list
    let baseUrl = global.deployConfig.baseUrl + '/art/';
    for (var i = 0; i < imageIdList.length; i++) {
        // let imgUrl = baseUrl + imageIdList[i];
        let imgUrl = await imageModule.getImageById(imageIdList[i]);
        let imagePageUrl = baseUrl + imageIdList[i];
        let link = `<a href="${imagePageUrl}"><img style="height: 200px; width: auto;" src="${imgUrl}"></a>`;
        emailMessage = emailMessage.toString() + '<br />' + link.toString();
    }
    let profileLink = 'http://eden.gallery/user?email=' + emailId;
    emailMessage += `</p><p>Click on any of the images above to see it in your browser. <a href="${profileLink}">Click here</a> to view a gallery of all your images.</p>`;

    //End message html tags
    emailMessage += '</body></html>';
    console.log('email message is ', emailMessage);

    //Build email header text
    let pictureText = imageIdList.length > 1 ? 'pictures' : 'picture';
    let headerText = `Hooray, we got your ${pictureText}`;

    const params = {
        Source: "Eden <new@eden.gallery>",
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
                Data: headerText
            }
        }
    };

    let response = await ses.sendEmail(params).promise();
    console.log('Email Sent. Result =>', response);
}
