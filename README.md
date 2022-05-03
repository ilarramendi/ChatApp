# ChatApp

Chatting concept aplication made just for refreshing old concepts, the frontend is made to look like WhatsApp Web using React and Typescript and the backend with Node.js and JavaScript.  
Example running on: [chat.ilarramendi.com](https://chat.ilarramendi.com)  
An important focus point (like most of my projects) is to use the least ammount of libraries possible, the frontend uses only React and WebSockets and the backend uses: WebSockets, JWT, dotenv, bcrypt, mysql2 and express.    

The main features are:
* Secure authentication using using JWT
* Passwords are stored encripted using Salt and Pepper
* Instant messaging with WebSockets
* Guest login (can be disabled in .env file)
* Sending images (images are sent as base64 via WS and then become accesible as a file in a secure url, only accesible if the message was sent to you)
* Secure transport using HTTPS and WSS (This is done in NGINX, the node app serves HTTP and WS)
* Group chats
* Mass messaging (Only available to admin)
* Searching inside messages and contacts
* Emoji keyboard

Planned Features:
* User images
* Respond to messages
* Send images with caption
* Add/remove people from a group chat after it was created
* Contact/Group information tab
* Message read and recived status
