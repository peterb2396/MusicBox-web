var express = require('express');
var router = express.Router();
const multer = require("multer");
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();
const axios = require('axios')
const WebSocket = require('ws');
const WS_PORT = 2173 // Unity/React -- Node
const RULES_PATH = "rules.txt"

const wss = new WebSocket.Server({ port: WS_PORT });
var browserUser, unityUser;

wss.on('connection', function connection(ws) {
  if (ws._socket.remoteAddress.indexOf("127.0.0.1") > -1)
  {
    browserUser = ws
    console.log("Browser connected")
    browserUser.on('message', function incoming(message) {

      // Forward message from browser to unity

      //console.log("Browser sent: "+message)
      if (unityUser)
        unityUser.send(String(message));
      // Echo back to client
      
    });
  }
  else
  {
    unityUser = ws
    console.log("Unity connected")
    unityUser.on('message', function incoming(message) {
      
      // Forward message from unity to browser

      //console.log("Unity Sent: "+ message)
      if (browserUser)
        browserUser.send(String(message));
      // Echo back to client
      
    });

  }


  // Send a message to client when needed
  
});

wss.on('listening',()=>{   console.log(`listening for players on ${WS_PORT}`)})



//Backend routes (endpoints)
router.use(express.static(path.join(__dirname, '../public')));

// Unity side has yes/no button
// Browser side has text box 
// Browser

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Door Game Backend' });
});



// Message (Yes / No) recieved from Unity
// Need to forward to client
router.get('/getRules', function(req,res)  {
  
  // Read file
    try {
      const fileContent = fs.readFileSync(RULES_PATH, 'utf8');
      const linesArray = fileContent.split(/\r?\n/); // Split by line breaks
      
      res.send(linesArray)
    } catch (error) {
      console.error('Error reading file:', error);
      return [];
    }
  
  
})



module.exports = router;
