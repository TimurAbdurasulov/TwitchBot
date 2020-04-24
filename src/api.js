const express = require('express')
const serverless = require('serverless-http')
const app = express()
const router = express.Router();
const tmi = require('tmi.js');

const client = new tmi.client({
    identity: {
      username: 'ue_ban',
      password: 'oauth:wd3tjzf2w0mb9ei2dvwla6wz8fsr42'
    },
    channels: [
      'idiotexception'
    ]
});

client.on('message', onMessageHandler);

client.connect();

function onMessageHandler (target, context, msg, self) {
    if (self) { return; } // Ignore messages from the bot
    client.say(target, `You rolled a ${num}`);
    client.say('idiotexception', 'test test');
}

router.get('/', (req,res)=>{
    res.json({
        'hello': 'hi!'
    })
})


app.use('/.netlify/functions/api', router)

module.exports.handler = serverless(app)