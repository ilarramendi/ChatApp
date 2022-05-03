var mysql = require('mysql2');
var ws = require('ws');
const fs = require('fs')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const express = require('express');

dotenv.config();

//#region MYSQL
const connection = mysql.createConnection({
    host     : 'localhost',
    port     : '30306',
    user     : 'root',
    password : process.env.DB_PASSWORD,
    database : 'Chat',
    timezone: 'UTC',
    multipleStatements: true
});
connection.connect();
//#endregion

// #region FUNCTIONS
//Insert new message in database and send it to all relevant contacts via WS
function newMessage(content, username, type, toUser, toGroup) {
    // Check if toUser exists, toGroup exists and user belongs to toGroup
    const query ='INSERT INTO Messages VALUES(DEFAULT, "' + encodeURIComponent(content) + '", ' + String(type == 'image') + ', NOW(), "' + encodeURIComponent(username) + '", "' + (encodeURIComponent(toUser) ?? 'Null') + '", ' + (toGroup ?? 'Null') + '); SELECT * FROM Messages WHERE messageID=(SELECT LAST_INSERT_ID()); SELECT color FROM Users WHERE username="' + encodeURIComponent(username) + '";'
    connection.query(query, (error, results) => {
        if (error) throw error
        
        const message = {...results[1][0], 'color': results[2][0]['color'], 'content': content}
        if (toGroup) {
            const query = 'SELECT * FROM belongsToGroup WHERE groupID=' + toGroup.toString()
            connection.query(query, (error, results) => {
                if (error) throw error
                const group = results.map(b => b['username'])
                clients.forEach(cl => {if (group.indexOf(cl.username) > -1) wsSendGeneric(cl.ws, 'message', message)})
            })
        } else clients.forEach(cl => {if (cl['username'] == toUser || cl['username'] == username) wsSendGeneric(cl.ws, 'message', message)})
        
    });
}

function checkJWT(token) {
	try {
		jwt.verify(token, process.env.TOKEN_KEY);
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('ascii'));
	} catch {
		return false
	}
}

function createGuest(cb) {
    const username = 'guest_' + Math.floor(Math.random() * 99999)
    connection.query('Select username from Users where username="' + username + '";', (error, results) => {
        if (error) throw error
        if (results.length > 0) return createGuest(cb)
        connection.query('INSERT INTO Users VALUES("' + username + '", ' + Math.trunc(Math.random() * Math.pow(2, 24)).toString() + ', 0, "");')
        cb(username)
    });
}

function wsSendGeneric(ws, type, message) {
    const content = typeof message == 'string' ? {'message': message} : message
    //console.log('===>', {...content, type})
    ws.send(JSON.stringify({...content, type}))
}
//#endregion


// #region EXPRESS
var app = express()

app.use(function(req, res, next) {
    var sendError = true;

    if (req.headers.hasOwnProperty('cookie')) {
        for (const cookie of req.headers.cookie.split(';')) {
            if (cookie.trim().indexOf('token') == 0) {
                const split  = cookie.split('=')
                if (split.length == 2) {
                    const _jwt = checkJWT(split[1])

                    if (_jwt) {
                        var query = ''
                        if (req.originalUrl.indexOf('/images/groups') == -1) query = 'SELECT messageID FROM Messages WHERE content="' + encodeURIComponent(req.originalUrl) + '" AND (toUser="' + encodeURIComponent(_jwt['username']) + '" OR toUser="*" OR username="' + encodeURIComponent(_jwt['username']) + '");'
                        else query = 'SELECT id FROM belongsToGroup WHERE groupID=' + encodeURIComponent(req.originalUrl.split('/')[3].split('.')[0]) + ' AND username="' + encodeURIComponent(_jwt['username']) + '";'
                        sendError = false;
                        connection.query(query , (error, results) => {
                            if (error) console.log(query, error);
                            else {
                                if (results.length == 1) next(); // User is authorized to view the requested image
                                else res.status(401).send('What are trying to do?')
                            }
                        })
                    }
                }
                break;
            }
        } 
    }

    if (sendError) res.status(401).send('What are trying to do?')
});

app.use('/images', express.static("/home/ilarramendi/development/chat-app/images"));
app.listen(7008)
// #endregion

// #region WEB SOCKET
const wss = new ws.WebSocketServer({port: 7007});
var clients = [];

wss.on("connection", ws => {
    var clientsIndex = false
    
    wsSend = (type, message) => wsSendGeneric(ws, type, message)

    ws.on("message", content => {
        try {jsn = JSON.parse(content.toString())} 
        catch {
            return wsSend('error', 'WTF BRO?')
        }

        const _jwt = checkJWT(jsn['token'])

        console.log('<===', jsn)
        
        if (!jsn.hasOwnProperty('type') || typeof jsn['type'] != 'string') return wsSend('error', 'Type missing')

        switch (jsn['type']) {
            case 'text':
            case 'image':
                if (!jsn.hasOwnProperty('content') || typeof jsn['content'] != 'string') return wsSend('error', 'Content missing')
                if (jsn.hasOwnProperty('toUser') && typeof jsn['toUser'] != 'string') return wsSend('error', 'toUser should be a valid username')
                if (jsn.hasOwnProperty('toGroup') && typeof jsn['toGroup'] != 'number') return wsSend('error', 'toGroup should be a valid userID')
                if (jsn.hasOwnProperty('toUser') && jsn.hasOwnProperty('toGroup')) return wsSend('error', 'Only one TO property is accepted')
                if (!jsn.hasOwnProperty('toUser') && !jsn.hasOwnProperty('toGroup')) return wsSend('error', 'toGroup or toUser missing.')
                if (jsn.hasOwnProperty('toUser') && jsn['toUser'] == _jwt['username']) return wsSend('error', 'Cant send messages to yourself.')
                
                // TODO check if user exists
                
                if (_jwt) {
                    var query = 'SELECT username from Users WHERE username="' + encodeURIComponent(_jwt['username']) + '";'
                    connection.query(query , (error, results) => {
                        if (error) throw error
                        if (results.length == 0) wsSend('error', {'message': 'User Deleted', 'action': 0})
                        if (results.length > 0) {
                            if (jsn['type'] == 'text') {
                                jsn['content'] = jsn['content'].trim()
                                if (jsn['content'].length <= 1000 && jsn['content'].length > 0) newMessage(jsn['content'], _jwt['username'], 'text', jsn['toUser'], jsn['toGroup'])
                                else wsSend('error', 'Message length should be between 1 and 1000')
                            }
                            else if (jsn['type'] == 'image') {
                                if (jsn['content'].length <= 4 * 1024 * 1024 * 1.3) { // 30% size difference when encoding to base64
                                    const basePath = '/home/ilarramendi/development/chat-app'
                                    const publicPath = '/images/'
                                    const extension = jsn['content'].indexOf('data:image/jpeg') == 0 ? '.jpg' : '.png'
                                    
                                    var fileName = publicPath + Math.trunc(Math.random() * 9999999999).toString().padStart('0', 10) + extension
                                    while (fs.existsSync(basePath + fileName)) fileName = publicPath + Math.trunc(Math.random() * 9999999999).padStart('0', 10) + extension
                                    
                                    fs.writeFile(basePath + fileName, jsn['content'].replace(/^data:image\/(jpeg|png);base64,/, ""), 'base64', () => newMessage(fileName, _jwt['username'], 'image', jsn['toUser'], jsn['toGroup']))
                                } else wsSend('error', 'Image is too large, max size as base64 is: ' + (4 * 1024 * 1024 * 1.3).toString())
                            }
                        } else wsSend('error', 'User dosnt exist.')
                    })
                } else wsSend('error', 'Token is wrong or expired.')
            break;

            // check parameters 
            case 'login':
            case 'singin':
                if (!jsn.hasOwnProperty('user')) {
                    return wsSend('error', 'Missing username')
                }
                if (!jsn.hasOwnProperty('passwd')) {
                    return wsSend('error', 'Missing password')
                }             
                if (typeof jsn['passwd'] != 'string' || jsn['passwd'].length > 100 || jsn['passwd'].length < 10) { 
                    return wsSend('error', 'Password length should be between 100 and 10')
                }
                if (typeof jsn['user'] != 'string' || jsn['user'].length > 30 || jsn['passwd'].length < 2) {
                    return wsSend('error', 'Username length should be between 30 and 2')
                }

            case 'login':
                connection.query('SELECT passwd, username from Users WHERE username="' + encodeURIComponent(jsn['user']) + '";' , (error, results) => {
                    if (error) throw error
                    if (results.length == 1 ) {
                        if (bcrypt.compareSync(process.env.DB_PEPPER + jsn['passwd'], results[0]['passwd'], Number.parseInt(process.env.SALT_ROUNDS))) { // Password correct
                            const token = jwt.sign({'username': jsn['user']}, process.env.TOKEN_KEY, {'expiresIn': process.env.JWT_EXPIRE_HOURS * 60 * 60});

                            clients = clients.filter(c => c.username != jsn['user'])
                            clients.push({'username': jsn['user'], 'ws': ws})
                            clients.forEach(c => wsSendGeneric(c.ws, 'connected', {'connected': clients.map(c => c.username)}))
                            clientsIndex = clients.length - 1

                            wsSend('login', {'token': token, 'username': jsn['user'], 'expires': Math.floor(new Date(new Date().getTime() + process.env.JWT_EXPIRE_HOURS * 60 * 60 * 1000).getTime() / 1000)})
                        } else wsSend('error', 'Wrong password, that is user juan5315 password.')
                    } else wsSend('error', "User dosn't exist")
                });
            break;

            case 'register':
                var userExists = false
                var query = 'SELECT username from Users WHERE username="' + encodeURIComponent(jsn['user']) + '";'
                
                connection.query(query , async (error, results) => {
                    if (error) throw error
                    userExists = results.length > 0
                    if (userExists) wsSend('error', 'User Exists')
                })

                if (!userExists) {
                    if (!jsn.hasOwnProperty('color') || jsn['color'] < 0 || jsn['color'] > Math.pow(2, 24)) jsn['color'] = Math.trunc(Math.random() * Math.pow(2, 24)).toString()
                    const password = bcrypt.hashSync(process.env.DB_PEPPER + jsn['passwd'], Number.parseInt(process.env.SALT_ROUNDS))
                    
                    query = 'INSERT INTO Users VALUES("' + encodeURIComponent(jsn['user']) + '", ' + jsn['color'].toString() + ', ' + (jsn['passwd'].length > 0).toString() + ', "' + password + '");'
                    
                    connection.query(query , error => {
                        if (error) throw error
                        const token = jwt.sign({'username': jsn['user'], 'What are you looking for': '?'}, process.env.TOKEN_KEY, {'expiresIn': process.env.JWT_EXPIRE_HOURS * 60 * 60});

                        clients = clients.filter(c => c.username != jsn['user'])
                        clients.push({'username': jsn['user'], 'ws': ws})
                        clients.forEach(c => wsSendGeneric(c.ws, 'connected', {'connected': clients.length > 0 ? clients.map(cl => cl['username']) : []}))
                        clientsIndex = clients.length - 1
                        
                        wsSend('login', {'token': token, 'username': jsn['user'], 'expires': Math.floor(new Date(new Date().getTime() + process.env.JWT_EXPIRE_HOURS * 60 * 60 * 1000).getTime() / 1000)})
                        
                        query = 'SELECT username, color FROM Users;'
                        connection.query(query, (err, res) => {
                            if (err) throw err
                            clients.forEach(c => wsSendGeneric(c.ws, 'users', {'users': res}))
                        })
                    })
                }
            break
            
            case 'messages':
                if (_jwt) {
                    if (!jsn.hasOwnProperty('from') || typeof jsn['from'] != 'number') return wsSend('error', 'Missing or invalid "from"')

                    var query = 'SELECT Messages.content, Messages.username, Users.color, Messages.date, Messages.messageID, Messages.image, Messages.toUser, Messages.toGroup FROM Messages INNER JOIN Users ON Messages.username=Users.username WHERE Messages.messageID > ' + jsn['from'].toString() + ' AND (Messages.toUser="' + encodeURIComponent(_jwt['username']) + '" OR (Messages.username="' + encodeURIComponent(_jwt['username']) + '" AND Messages.toGroup is NULL) OR Messages.toUser="*"); '
                    query += 'SELECT Messages.content, Messages.username, belongsToGroup.color, Messages.date, Messages.messageID, Messages.image, Messages.toUser, Messages.toGroup FROM Messages INNER JOIN belongsToGroup ON Messages.toGroup=belongsToGroup.groupID WHERE Messages.messageID > ' + jsn['from'].toString() + ' AND belongsToGroup.username="'  + encodeURIComponent(_jwt['username']) + '";'

                    connection.query(query , (error, results) => {
                        if (error) throw error
                        else {
                            console.log(results)
                            results[0].concat(results[1]).forEach(msg => wsSend('message', {
                                ...msg, 
                                username: decodeURIComponent(msg['username']), 
                                content: decodeURIComponent(msg['content'])
                            }))
                        }
                    });
                } else wsSend('error', 'Incorrect / Expired token')
            break;
            
            case 'guestLogin':
                if (process.env.GUEST_ENABLED != 'true') {
                    return wsSend('error', 'Guest login is not enabled at the moment, please create an account')
                } else {
                    createGuest(guestUser => {
                        const token = jwt.sign({'username': guestUser}, process.env.TOKEN_KEY, {'expiresIn': process.env.JWT_EXPIRE_HOURS * 60 * 60});
        
                        clients.push({'username': guestUser, 'ws': ws})
                        clientsIndex = clients.length - 1
                        wsSend('login', {'token': token, 'username': guestUser, 'expires': Math.floor(new Date(new Date().getTime() + process.env.JWT_EXPIRE_HOURS * 60 * 60 * 1000).getTime() / 1000)})
                        
                        const query = 'SELECT username, color FROM Users;'
                        connection.query(query, (err, res) => {
                            if (err) throw err
                            clients.forEach(c =>wsSendGeneric(c.ws, 'users', {'users': res}))
                        })
                    })
                }
            break; 
        
            case 'reconnect':
                if (_jwt) {
                    clients = clients.filter(c => c.username != _jwt['username'])
                    clients.push({'username': _jwt['username'], 'ws': ws})
                    clients.forEach(c => wsSendGeneric(c.ws, 'connected', {'connected': clients.map(cl => cl['username'])}))
                    clientsIndex = clients.length - 1
    
                    wsSend('login', {'username': _jwt['username'], 'token': jsn['token'], 'expires': _jwt['exp']})
                } else wsSend('error', 'Token missing or expired.')                                                 
            break;

            case 'newGroup':
                if (_jwt) {
                    if (!jsn.hasOwnProperty('name') || typeof jsn['name'] != 'string' || jsn['name'].length > 50 || jsn['name'].length == 0) return wsSend('error', 'Name missing')
                    const description = jsn.hasOwnProperty('description') && typeof jsn['description'] == 'string' && jsn['description'].length <= 500 ? encodeURIComponent(jsn['description']) : ''
                    const hasImage = jsn.hasOwnProperty('image') && typeof jsn['image'] == 'string' && jsn['image'].length <= 4 * 1024 * 1024 * 1.3


                    query = 'INSERT INTO `Group` VALUES(DEFAULT, ' + hasImage + ', "' + encodeURIComponent(jsn['name']) + '", "' + description + '"); SELECT * FROM `Group` WHERE groupID=(SELECT LAST_INSERT_ID());' 
                    connection.query(query, (err, res) => {
                        if (err) throw err

                        if (hasImage) { // 30% size difference when encoding to base64
                            const path = '/home/ilarramendi/development/chat-app/images/groups/' + res[1][0]['groupID'].toString() + '.jpg'
                            fs.writeFileSync(path, jsn['image'].replace(/^data:image\/(jpeg|png);base64,/, ""), 'base64')
                        }
                        
                        query = 'INSERT INTO belongsToGroup VALUES(DEFAULT, ' + res[1][0]['groupID'] + ', "' + encodeURIComponent(_jwt['username']) + '", 1, ' + Math.trunc(Math.random() * Math.pow(2, 24)).toString() + ');' 
                        jsn['participants'].forEach(p => query += 'INSERT INTO belongsToGroup VALUES(DEFAULT, ' + res[1][0]['groupID'] + ', "' + encodeURIComponent(p) + '", 0, ' + Math.trunc(Math.random() * Math.pow(2, 24)).toString() + ');')
                        
                        connection.query(query, err => {
                            if (err) throw err
                            clients.forEach(c => {console.log(c.username, jsn['participants'].indexOf(c.username)); if (jsn['participants'].indexOf(c.username) > -1) wsSendGeneric(c.ws, 'group', {...res[1][0], 'participants': jsn['participants'] + _jwt['username']})})
                        })
                    })
                } else wsSend('error', 'Token missing')
            break

            case 'addToGroup':
                if (_jwt) {
                    query = 'SELECT id FROM belongsToGroup WHERE username="' + encodeURIComponent(_jwt['username']) +'" AND groupID=' + jsn['groupID'].toString() + ' AND admin=1; SELECT id FROM belongsToGroup WHERE username="' + encodeURIComponent(jsn['username']) +'" AND groupID=' + jsn['groupID'].toString()
                    connection.query(query, (err, res) => {
                        if (err) throw err
                        if (res[0].length == 0) return wsSend('error', 'You have no access to add people from this group, only god can do this.')
                        if (res[1].length > 0) return wsSend('error', 'User already belongs to group.')

                        const color = Math.trunc(Math.random() * Math.pow(2, 24)).toString()
                        query = 'INSERT INTO belongsToGroup VALUES(DEFAULT, ' + jsn['groupID'].toString() + ', "' + encodeURIComponent(jsn['username']) + '", 0, ' + color + ');'
                        connection.query(query, () => clients.forEach(c => {if (err) throw err; if (c.username == jsn['username']) wsSendGeneric(c.ws, 'group', {'groupID':jsn['groupID']})}))
                    })
                } else wsSend('error', 'Token missing')

            break;
        
            case 'groups':
                if (_jwt) {
                    query = 'SELECT `Group`.groupID, `Group`.hasImage, `Group`.name, `Group`.description FROM `Group` INNER JOIN belongsToGroup ON `Group`.groupID=belongsToGroup.groupID WHERE belongsToGroup.username="' + encodeURIComponent(_jwt['username']) + '"'
                    connection.query(query, (err, res) => {
                        if (err) throw err

                        for (const group of res) {
                            query = 'SELECT username FROM belongsToGroup WHERE groupID=' + group['groupID'].toString()
                            connection.query(query, (e, r) => {
                                if (e) throw e;
                                wsSend('group', {...group, 'participants': r.map(u => u['username'])})
                            })
                        }

                    })
                } else wsSend('error', 'Token missing')
            break;

            case 'users': // TODO join users and connected in one request
                if (_jwt) {
                    query = 'SELECT username, color FROM Users;'
                        connection.query(query, (err, res) => {
                        if (err) throw err
                        wsSend('users', {'users': res})
                    })
                } else wsSend('error', 'Token missing or expired.')
            break;  
        }
    });

    // remove dissconected clients
    ws.on("close", () => {
        if (clientsIndex) {
            clients.splice(clientsIndex, 1)
            clients.forEach(c => wsSendGeneric(c.ws, 'connected', {'connected': clients.map(cl => cl['username'])}))
        }
    })
    
    ws.onerror = function () {console.log("Some error ocurred with WebSockets")}
});

//#endregion

console.log("The server is running on ports 7007 and 7008");