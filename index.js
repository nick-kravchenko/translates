const express = require('express');
const ws = require('./ws');
const auth = require('basic-auth');
const users = require('./storage/users');

const app = express();

app.get('/', function (req, res) {
    let credentials = auth(req);
    if (!credentials || !users[credentials.name] === credentials.password) {
      res.set('WWW-Authenticate', 'Basic realm=example');
      res.status(401).send({
        message: 'Unauthorized'
      });
    }
    res.sendFile(__dirname + '/ws.html');
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})