/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const util = require('./util');
const sendgrid = require('@sendgrid/mail');


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome, you can say Hello or Help. Which would you like to try?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';
        
        //sendgrid test
        

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const MakeAppointmentApiHandler = {
    canHandle(handlerInput) {
        return util.isApiRequest(handlerInput, 'MakeAppointment');
    },
    async handle(handlerInput) {
        const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
        let email;
        let response = {
            apiResponse: {
                response_text: null,
                date : null,
                time: null
            }
        };
        
        //get args
        const args = util.getApiArguments(handlerInput);
        console.log(args);
        const date = args.date;
        response.apiResponse.date = date;
        const time = args.time;
        response.apiResponse.time = time;
        
        console.log(`apiAccessToken = ${apiAccessToken}`);
        if (!apiAccessToken){
            response.apiResponse.response_text = 'Please enable Customer Profile in the Alexa app';
            return response;
        }
        
        console.log("Api Request [MakeAppointment]: ", JSON.stringify(handlerInput.requestEnvelope.request, null, 2));
        
        
        // example: Get the customer's dog race if any
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        console.log("Dog Race (if any): ", sessionAttributes.dogRace);
        // example: get some file from my s3
        //const speechUrl = util.getS3PreSignedUrl("Media/GvHL2xVq-em2-2.mp3");
        
        try{
            const upsClient = handlerInput.serviceClientFactory.getUpsServiceClient();
            email = await upsClient.getProfileEmail();
            
        }catch(err){
            console.log(`~~~~ Error handled: ${err.message}`);
            response.apiResponse.response_text = 'Something went wrong with your linked account';
            return response;
        }
        
        if (!email){
            response.apiResponse.response_text = 'Please allow the skill to access your email address to send you the order\'s details.';
            return response;
        }
        
        try {
            sendgrid.setApiKey(''); //fill with sendgrid api key (twilio)
            const msg = {
              to: email,
              from: 'nossilcd@protonmail.com',
              subject: 'Dog Walkers',
              text: `Su paseo ha sido agendado para el día ${date} at ${time}`,
              html: `<strong>Su paseo ha sido agendado para el día ${date} at ${time}</strong>`,
            };
            await sendgrid.send(msg);
            response.apiResponse.response_text = 'Alright. We have sent you an email with the details of the walk. Have a good day.';
            console.log("Api Response [MakeAppointment]: ", JSON.stringify(response, null, 2));
            return response;
            
        } catch (e) {
            console.log('Error occurred: ', e);
            response.apiResponse.response_text = 'There was a problem with your request';
            return response;
        }
    }
}

/**
 * slots:
 *  data - message that will be spoken
 *  consentCard - '0':no; '1':request email permission;
 */
const CustomEndSessionHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CustomEndSession';
    },
    handle(handlerInput) {
        console.log('CUSTOM END SESSION HANDLER', handlerInput.requestEnvelope.request);
        let speakOutput = 'Goodbye!';
        let consentCard = false;
        if (handlerInput.requestEnvelope.request.intent.slots){
            if (handlerInput.requestEnvelope.request.intent.slots.data){
                speakOutput = handlerInput.requestEnvelope.request.intent.slots.data.value;
            }
            if (handlerInput.requestEnvelope.request.intent.slots.consentCard){
                consentCard = handlerInput.requestEnvelope.request.intent.slots.consentCard.value;
            }
        }
        if (consentCard === '1'){ //1|0
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .withAskForPermissionsConsentCard(['alexa::profile:email:read']) //CPA
                //.withLinkAccountCard() //AccLink
                .withShouldEndSession(true)
                .getResponse();
        }else{
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .withShouldEndSession(true)
                .getResponse();
        }
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        MakeAppointmentApiHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CustomEndSessionHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .addErrorHandlers(
        ErrorHandler)
    .lambda();