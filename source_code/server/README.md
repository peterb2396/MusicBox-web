# Server
Runs a server for a game between a web browser player and a unity player.
It is a node server which has a WebSocketServer within, which allows communication between Node, React, and Unity.

React and Unity clients send a message to the socket which exists on the node server. The message is then processed
by the node server.

Node server allows many javascript packages. 
The benefit of a WebSocket is it allows two way communication, where the Node JS only responds to client requests.
Future work may consider only using a single WebSocket server