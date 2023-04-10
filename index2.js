const tasks = [];

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

