// --------------- Configuration ----------------------------------------------

// This is the application ID from your Alexa skil.
var APP_ID = '';

// Set your AutoRemote Key here.
var KEY = '';

// --------------- /Configuration ---------------------------------------------

var https = require('https')

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log('event.session.application.applicationId='
                    + event.session.application.applicationId);

        if (event.session.application.applicationId !== APP_ID) {
             context.fail('Invalid Application ID');
         }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId},
                             event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes,
                                                      speechletResponse));
                     });
        }  else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes,
                                                       speechletResponse));
                     });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail('Exception: ' + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log('onSessionStarted requestId=' + sessionStartedRequest.requestId
                + ', sessionId=' + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log('onLaunch requestId=' + launchRequest.requestId
                + ', sessionId=' + session.sessionId);

    launchSiriusXM(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log('onIntent requestId=' + intentRequest.requestId
                + ', sessionId=' + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    switch (intentName) {
        case 'SiriusXMChannelNameIntent':
            launchSiriusXMWithChannelName(intent, session, callback)
            break;
        case 'SiriusXMStopIntent':
            stopSiriusXM(callback)
            break;
        default:
            throw 'Invalid intent';
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log('onSessionEnded requestId=' + sessionEndedRequest.requestId
                + ', sessionId=' + session.sessionId);
}

// --------------- Functions that control the skill's behavior ----------------

function stopSiriusXM(callback) {
    var sessionAttributes = {};
    var cardTitle = 'Stop SiriusXM';
    var speechOutput = '';
    var repromptText = null;
    var shouldEndSession = true;

    var request = https.request({
        host: 'autoremotejoaomgcd.appspot.com',
        port: 443,
        accept: '*/*',
        method: 'GET',
        path: '/sendmessage?key=' + KEY + '&message=siriusxm'
              + encodeURIComponent(' stop=:=')
    }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function () {});
        res.on('end', function () {
            callback(sessionAttributes,
                     buildSpeechletResponse(cardTitle, speechOutput,
                                            repromptText, shouldEndSession));
        });
    });
    request.on('error', function (e) {
        console.log(e);
        callback(sessionAttributes,
                 buildSpeechletResponse(cardTitle, speechOutput, repromptText,
                                        shouldEndSession));
    });
    request.end();
}

function launchSiriusXM(callback) {
    var sessionAttributes = {};
    var cardTitle = 'Launch SiriusXM';
    var speechOutput = 'Starting SiriusXM.';
    var repromptText = null;
    var shouldEndSession = true;

    var request = https.request({
        host: 'autoremotejoaomgcd.appspot.com',
        port: 443,
        accept: '*/*',
        method: 'GET',
        path: '/sendmessage?key=' + KEY + '&message=siriusxm'
              + encodeURIComponent(' play=:=')
    }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function () {});
        res.on('end', function () {
            callback(sessionAttributes,
                     buildSpeechletResponse(cardTitle, speechOutput,
                                            repromptText, shouldEndSession));
        });
    });
    request.on('error', function (e) {
        console.log(e);
        callback(sessionAttributes,
                 buildSpeechletResponse(cardTitle, speechOutput, repromptText,
                                        shouldEndSession));
    });
    request.end();
}

function launchSiriusXMWithChannelName(intent, session, callback) {
    var sessionAttributes = {};
    var cardTitle = 'Launch SiriusXM by Channel Name';
    var speechOutput = '';
    var repromptText = null;
    var shouldEndSession = true;

    if (intent.slots.channel) {
        var channel = intent.slots.channel.value;

        var request = https.request({
            host: 'autoremotejoaomgcd.appspot.com',
            port: 443,
            accept: '*/*',
            method: 'GET',
            path: '/sendmessage?key=' + KEY + '&message=siriusxm'
                  + encodeURIComponent(' play=:=' + channel)
        }, function (res) {
            res.setEncoding('utf8');
            res.on('data', function () {});
            res.on('end', function () {
                speechOutput = 'Playing ' + channel + ' on SiriusXM.';
                callback(sessionAttributes,
                         buildSpeechletResponse(cardTitle, speechOutput,
                                                repromptText,
                                                shouldEndSession));
            });
        });
        request.on('error', function (e) {
            console.log(e);
            callback(sessionAttributes,
                     buildSpeechletResponse(cardTitle, speechOutput,
                                            repromptText, shouldEndSession));
        });
        request.end();
    } else {
        speechOutput = 'Sorry.';
        callback(sessionAttributes,
                 buildSpeechletResponse(cardTitle, speechOutput, repromptText,
                                        shouldEndSession));
    }
}

// --------------- Helpers that build all of the responses --------------------

function buildSpeechletResponse(title, output, repromptText, endSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output
        },
        card: {
            type: 'Simple',
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText
            }
        },
        shouldEndSession: endSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}
