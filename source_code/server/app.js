var express = require('express');
var cors = require('cors');
var express = require('express');
const os = require('os');
const fs = require('fs');
const WebSocket = require('ws');

const WS_PORT = 2174 // Unity/React -- Node
const NODE_PORT = 2175
const RULES_PATH = "rules.txt"

// Rule checking
const check = require('./rules');


var app = express();
app.use(cors());

app.listen(NODE_PORT, () => {
  const networkInterfaces = os.networkInterfaces();
  const publicIPv4Addresses = [];

  Object.values(networkInterfaces).forEach(interfaces => {
    interfaces.forEach(interface => {
      if (!interface.internal && interface.family === 'IPv4') {
        publicIPv4Addresses.push(interface.address);
      }
    });
  });

  // List server ports
  console.log(`Server running on ports ${WS_PORT}(ws) and ${NODE_PORT}(node) at`);

  // List server address
  publicIPv4Addresses.forEach(address => {
    console.log(address);
  });
  
});


app.use(express.json());

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
      let msg = String(message)
      
      // Forward message from unity to browser

      //console.log("Unity Sent: "+ message)
      if (browserUser)
      {
        // Forward Y/N response to browser
        if (msg === 'Yes' || msg === 'No')
          browserUser.send(msg);

        else // They submitted an answer. Check it.
        {
          let parts = msg.split(',')
          let a = parts[0]
          let q = parts[1]
          let correct = check(q, a) // Check if the submission is correct

          browserUser.send(correct? "true" : "false") // Notify Unity user of success / fail
          unityUser.send(correct? "true" : "false") // Notify browser user of success / fail
        }
        
      }
        
      
    });

  }


  // Send a message to client when needed
  
});

// Ready for connections
wss.on('listening',()=>{})



// Unity side has yes/no button
// Browser side has text box 
// Browser

/* GET home page. */
app.get('/', function(req, res, next) {
  res.render('index', { title: 'Door Game Backend' });
});

// Determine whether the code is correct based on ruleset
app.post('/check', (req, res) => {

  // Send the result of checking the question against the answer
  res.send(check(req.body.q, req.body.a))
})



// Message (Yes / No) recieved from Unity
// Need to forward to client
app.get('/getRules', function(req,res)  {
  
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








module.exports = app;
