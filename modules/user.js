
var aws = require('aws-sdk');

//Save User In Db
exports.saveUserInDb = async function (emailId) {

    let dynamoDb = new aws.DynamoDB.DocumentClient({
        accessKeyId: deployConfig.ddb.awsAccessKeyId,
        secretAccessKey: deployConfig.ddb.awsAccessKeySecret,
        region: deployConfig.ddb.awsRegion,
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
