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

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

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

    // Check if the user is asking to create a task
    if (text.includes('create task')) {
      const task = text.replace('create task', '').trim();
      tasks.push(task);
      sendTextMessage(senderId, `Task "${task}" created.`);
    }

    // Check if the user is asking to list all tasks
    if (text.includes('list tasks')) {
      const taskList = tasks.length > 0 ? tasks.join(', ') : 'No tasks yet';
      sendTextMessage(senderId, `Tasks: ${taskList}`);
    }

    // Check if the user is asking to complete a task
    if (text.includes('complete task')) {
      const task = text.replace('complete task', '').trim();
      const index = tasks.indexOf(task);
      if (index > -1) {
        tasks.splice(index, 1);
        sendTextMessage(senderId, `Task "${task}" completed.`);
      } else {
        sendTextMessage(senderId, `Task "${task}" not found.`);
      }
    }

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
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

