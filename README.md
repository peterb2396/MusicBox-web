# Coop code game
One user is given a list of clues and must ask yes or no questions to their partner, in order to provide them with the correct instructions on how to decode the password.

## server
The server must be run via npm i, then node app.js
The server spawns a WebSocket which allows 2 way communication between the two players (React & Unity)
The server asks as a middleware to pass along the messages. The Node JS WS listens for 2 connections. 

The benefit of a WebSocket is it allows two way communication, where the Node JS only responds to client requests.

## client
The client can be run with npm i, then npm start
The client is the player who acts as the instruction reader / question asker
Another client (Unity) will be the player who enters the code and responds to questions to get clues