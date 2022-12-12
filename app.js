/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `yarn install`
 * 3. Add your VERIFY_TOKEN and PAGE_ACCESS_TOKEN to your environment vars
 */


'use strict';

// Use dotenv to read .env vars into Node
require('dotenv').config();

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  { urlencoded, json } = require('body-parser'),
  app = express();

// Parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: true }));

// Parse application/json
app.use(json());

// Respond with 'Hello World' when a GET request is made to the homepage
app.get('/', function (_req, res) {
  res.send('Hello World');
});


function sendVLESignin(targetPSID) {

  let urlBtnBody = {
    "recipient": {
      "id": `${targetPSID}`
    },
    "message": {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "button",
          "text": "Sign in to VLE Platform",
          "buttons": [
            {
              "type": "web_url",
              "url": "https://accounts.google.com/o/oauth2/auth?client_id=717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com&scope=profile+email&redirect_uri=https%3a%2f%2fstackauth.com%2fauth%2foauth2%2fgoogle&state=%7b%22sid%22%3a1%2c%22st%22%3a%2259%3a3%3abbc%2c16%3a97bb9ef87eea3861%2c10%3a1667198002%2c16%3ac4a3de8e3dbfc0fd%2c09db9454c52adde730b6c724934b0091cb3201b3d6355cd0aa308e30005734b3%22%2c%22cid%22%3a%22717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com%22%2c%22k%22%3a%22Google%22%2c%22ses%22%3a%226e60de4450e547118c5b9c158c002e21%22%7d&response_type=code",
              "title": "Sign in to Google Classroom",
              "webview_height_ratio": "full"
            },
            {
              "type": "web_url",
              "url": "https://accounts.google.com/o/oauth2/auth?client_id=717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com&scope=profile+email&redirect_uri=https%3a%2f%2fstackauth.com%2fauth%2foauth2%2fgoogle&state=%7b%22sid%22%3a1%2c%22st%22%3a%2259%3a3%3abbc%2c16%3a97bb9ef87eea3861%2c10%3a1667198002%2c16%3ac4a3de8e3dbfc0fd%2c09db9454c52adde730b6c724934b0091cb3201b3d6355cd0aa308e30005734b3%22%2c%22cid%22%3a%22717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com%22%2c%22k%22%3a%22Google%22%2c%22ses%22%3a%226e60de4450e547118c5b9c158c002e21%22%7d&response_type=code",
              "title": "Sign in to Moodle",
              "webview_height_ratio": "full"
            }
          ]
        }
      }
    }
  }

  request({
    uri: `https://graph.facebook.com/v2.6/me/messages?&tag=CONFIRMED_EVENT_UPDATE&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
    method: 'POST',
    json: true,
    body: urlBtnBody
  }, (err, res, body) => {
    if (err) throw err;
    console.log(body);
  })
}
request(
  {
      url: `https://graph.facebook.com/v15.0/105752072252865/conversations?fields=participants&access_token=EAAGBPznQdsoBADvs8TL7TBZCPZASbSC0TmtFzRud6ezusW0Ia3VkSupA4SVuaB507FOySsGnuvjG3ZBS8CeEZAeghRldThY1oWHmszFrYxAbFqxSV4shwX3cWu5WJUHnSf1x1epJ3X7TL1fZCLF69X8heFSvPlQ8tWvvRnI7kUPdFZAHEkgceueFrIuZBWKHfZCtnHJeJUOJYwZDZD&`,
      method: 'POST',
      json: true
  }, (err, res, body) => {
      if (err) throw err;
      console.log(body);
  }
)
// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Creates the endpoint for your webhook
app.post('/webhook', (req, res) => {
  let body = req.body;

  // Checks if this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {

      // Gets the body of the webhook event
      let webhookEvent = entry.messaging[0];
      console.log(webhookEvent);

      // Get the sender PSID
      let senderPsid = webhookEvent.sender.id;
      console.log('Sender PSID: ' + senderPsid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {

    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Handles messages events
function handleMessage(senderPsid, receivedMessage) {
  let response;

  // Checks if the message contains text
  if (receivedMessage.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of your request to the Send API
    response = {
      'text': `You sent the message: '${receivedMessage.text}'. Now send me an attachment!`
    };
    console.log('THE: ' + response['text'])
  } else if (receivedMessage.attachments) {

    // Get the URL of the message attachment
    let attachmentUrl = receivedMessage.attachments[0].payload.url;
    response = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': 'Is this the right picture?',
            'subtitle': 'Tap a button to answer.',
            'image_url': attachmentUrl,
            'buttons': [
              {
                'type': 'postback',
                'title': 'Yes!',
                'payload': 'yes',
              },
              {
                'type': 'postback',
                'title': 'No!',
                'payload': 'no',
              }
            ],
          }]
        }
      }
    };
  }

  // Send the response message
  callSendAPI(senderPsid, response);
}
// Handles messaging_postbacks events
function handlePostback(senderPsid, receivedPostback) {
  let response;

  // Get the payload for the postback
  let payload = receivedPostback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { 'text': 'Thanks!' };
  } else if (payload === 'no') {
    response = { 'text': 'Oops, try sending another image.' };
  }
  // Send the message to acknowledge the postback
  callSendAPI(senderPsid, response);
}
// Sends response messages via the Send API-
function callSendAPI(senderPsid, response) {

  // The page access token we have generated in your app settings
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // Construct the message body
  let requestBody = {
    'recipient': {
      'id': senderPsid
    },
    'message': response
  };

  // Send the HTTP request to the Messenger Platform
  request({
    'uri': 'https://graph.facebook.com/v15.0/105752072252865/messages',
    'qs': { 'access_token': PAGE_ACCESS_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, _res, _body) => {
    if (!err) {
      console.log('Message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
}

// listen for requests :)
var listener = app.listen(/**process.env.PORT */8080, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});