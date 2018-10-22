const express = require('express');
const ws = require('./ws');
const auth = require('basic-auth');
const users = require('./storage/users');
require('dotenv').config();
const app = express();

app.get('/', function (req, res) {
    let credentials = auth(req);
    if (!credentials || !users[credentials.name] === credentials.password) {
      res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
      // If the user cancels the dialog, or enters the password wrong too many times,
      // show the Access Restricted error message.
      return res.status(401).send("Authorization Required");
    } else {
      res.set('user', JSON.stringify(credentials));
      res.sendFile(__dirname + '/ws.html');
    }
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port 3000!')
})