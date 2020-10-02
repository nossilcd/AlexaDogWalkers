const AWS = require('aws-sdk');
const Alexa = require('ask-sdk-core');
const sendgrid = require('@sendgrid/mail');

/**
 * Helper method to find if a request is for a certain apiName. 
 */
module.exports.isApiRequest = (handlerInput, apiName) => {
    try {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked'
            && handlerInput.requestEnvelope.request.apiRequest.name === apiName;
    } catch (e) {
        console.log('Error occurred: ', e);
        return false;
    }
}

/**
 * Helper method to get API request entity from the request envelope.
 */
module.exports.getApiArguments = (handlerInput) => {
    try {
        return handlerInput.requestEnvelope.request.apiRequest.arguments;
    } catch (e) {
        console.log('Error occurred: ', e);
        return false;
    }
}

/**
 * Helper method to get API resolved entity from the request envelope.
 */
module.exports.getApiSlots = (handlerInput) => {
    try {
        return handlerInput.requestEnvelope.request.apiRequest.slots;
    } catch (e) {
        console.log('Error occurred: ', e);
        return false;
    }
}

const s3SigV4Client = new AWS.S3({
    signatureVersion: 'v4'
});

module.exports.getS3PreSignedUrl = function getS3PreSignedUrl(s3ObjectKey) {

    const bucketName = process.env.S3_PERSISTENCE_BUCKET;
    const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: s3ObjectKey,
        Expires: 60*1 // the Expires is capped for 1 minute
    });
    console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
    return s3PreSignedUrl;

}