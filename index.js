const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const openai = require('openai');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set up OpenAI API credentials
const openaiApiKey = process.env.OPENAI_API_KEY;
openai.apiKey = openaiApiKey;

// Set up webhook endpoint for Facebook Messenger
app.post('/webhook', (req, res) => {
  const messagingEvents = req.body.entry[0].messaging;
  messagingEvents.forEach(event => {
    if (event.message && event.message.text) {
      handleMessage(event.sender.id, event.message.text);
    }
  });
  res.sendStatus(200);
});

// Handle incoming messages from Facebook Messenger
function handleMessage(senderId, message) {
  openai.complete({
    engine: 'davinci',
    prompt: message,
    maxTokens: 150,
    n: 1,
    stop: '\n',
    temperature: 0.7,
  }).then(response => {
    const text = response.data.choices[0].text;
    sendTextMessage(senderId, text);
  }).catch(error => console.error(error));
}

// Send text message back to Facebook Messenger
function sendTextMessage(senderId, text) {
  const messageData = {
    text: text
  };
  request({
    url: 'https://graph.facebook.com/v13.0/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: {
      recipient: { id: senderId },
      message: messageData,
    }
  }, (error, response, body) => {
    if (error) {
      console.error('Error sending message: ', error);
    } else if (response.body.error) {
      console.error('Error: ', response.body.error);
    }
  });
}

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

