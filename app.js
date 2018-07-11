/*
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Remix this as the starting point for following the Messenger Platform
 * quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
let timeout = undefined;
var facts = [];
populateFacts(facts);

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      // Get the sender PSID
    let sender_psid = webhook_event.sender.id;
    console.log('Sender PSID: ' + sender_psid);
      
      // Check if the event is a message or postback and
  // pass the event to the appropriate handler function
  if (webhook_event.message.text) {
    cancelTimer();
    handleMessage(sender_psid, webhook_event.message);        
  } else{
    handleOthers(sender_psid);
  }      
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "omcbot";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {

  let response;

  // Check if the message contains text  
  if (received_message.text.toLowerCase() === 'fun facts') {  
    var fact = fetchRandomFacts(facts);
    response = {
    "text": fact
    }
      callSendAPI(sender_psid, response, false);
  } else if (received_message.text.toLowerCase() === 'campus video') {      
      response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Please follow the link",
        "buttons":[
          {
            "type":"web_url",
            "url":"https://www.youtube.com/watch?v=hHCGy3TFGCE",
            "title":"Campus Tour Video",
            "webview_height_ratio": "full"
          }
        ]
      }
    }
  }
      callSendAPI(sender_psid, response, false);
  } else if (received_message.text.toLowerCase() === 'request info') {      
    response = {
      text : "Please choose an option",
      "quick_replies":[
    {
        "content_type":"text",
        "title":"Undergraduate",
        "payload":"UG"
    },
    {
        "content_type":"text",
        "title":"Graduate",
        "payload":"PG"
    }
    ]
    }
      callSendAPI(sender_psid, response, false);
  } else if (received_message.text === 'Undergraduate') {      
      response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Please follow the link",
        "buttons":[
          {
            "type":"web_url",
            "url":"https://apply.usfca.edu/register/undergraduate-request-info",
            "title":"Request Info Link",
            "webview_height_ratio": "full"
          }
        ]
      }
    }
  }
      callSendAPI(sender_psid, response, false);
  } else if (received_message.text === 'Graduate') {      
      response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Please follow the link",
        "buttons":[
          {
            "type":"web_url",
            "url":"https://gradapply.usfca.edu/register/?id=b712af89-d5d3-42d0-a6b1-990f9e3d0b06",
            "title":"Request Info Link",
            "webview_height_ratio": "full"
          }
        ]
      }
    }
  }
      callSendAPI(sender_psid, response, false);
  } else if (received_message.text.toLowerCase() === 'real person') {      
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Need further assistance? Talk to a representative now. Tap to call.",
        "buttons":[
          {
            "type":"phone_number",
            "title":"Undergraduate",
            "payload":"1(415) 422-6563"
          },
          {
            "type":"phone_number",
            "title":"Graduate",
            "payload":"1(415) 422-2090"
          }
        ]
      }
    }
  }
      callSendAPI(sender_psid, response, false);
  } else if (received_message.text === 'Can you help me with my homework?') {
    //easter egg response
    response = {
    "text": "I'm sorry Dave, I'm afraid I can't do that."
    }
      callSendAPI(sender_psid, response, false);
  } else   if (received_message.text) {      
    response = {
    "text": "Hi, I'm a USF chat bot. At anytime you can reply \"request info\", \"campus video\", \"fun facts\" or \"real person\"."
    }
      callSendAPI(sender_psid, response, false);
  }
}

//Right now only text messeges are supported. For any other response like "smiley" or "like" or "gif" etc we send an exit messege
function handleOthers(sender_psid) {
let response;
  response = {
      "text": `Thank you. At anytime you can reply "request info", "campus video", "fun facts" or "real person".`
    }
    callSendAPI(sender_psid, response, true);
}

function cancelTimer() {
  clearTimeout(timeout);
}

//timer object is restarted every time after getting response from user 
function restartTimer(sender_psid) {
  timeout = setTimeout(myTimer, 60000, sender_psid);
}

//Timer sends a exit response if user don't reply in some specific time
function myTimer(sender_psid) {
  let response;
  response = {
      "text": `At anytime you can reply "request info", "campus video", "fun facts" or "real person".`
    }
    callSendAPI(sender_psid, response, true);
}

//populate the facts in the array
function populateFacts(facts_array) {
  facts_array.push('USF was founded by the Jesuits in 1855 as St. Ignatius Academy.');
  facts_array.push('\"Change the World From Here\" is our motto.');
  facts_array.push('Paul J. Fitzgerald, S.J. is the current USF President.');
  facts_array.push('Our nickname is the USF \"Dons\".');
  facts_array.push('Father Maraschi was the first USF President.');
  facts_array.push('USF became coed in 1964.');
  facts_array.push('USF has hosted Army Reserve Officers Training Corps programs since 1936.');
  facts_array.push('We launched our first student newspaper in the year 1926.');
  facts_array.push('Our newspaper was originally called the \"Ignatian\".');
  facts_array.push('The size of our main campus is 55 acres.');
  facts_array.push('Student Faculty ratio: 14:1');
}

//each time fetch the facts in random order
function fetchRandomFacts(facts_random)
{
   return facts_random[Math.floor(Math.random()*facts_random.length)];
}

function callSendAPI(sender_psid, response, isTimeoutResponse) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
  if(!isTimeoutResponse) {
       restartTimer(sender_psid);

     }
}


