import React from "react";
import {w3cwebsocket as W3CWebSocket, IMessageEvent} from 'websocket'

import Searchicon from '../../../assets/search.svg';
import Menu from '../../../assets/menu.svg';

import Messages from '../../components/messages/Messages'
import Footer from '../../components/footer/Footer'
import Login from '../../components/login/Login'
import Contacts from '../../components/contacts/Contacts'
import Contact from '../../components/contact/Contact'
import Search  from '../../components/search/Search'
import Images  from '../../components/images/Images'
import NewGroup  from '../../components/newGroup/NewGroup'

import './App.scss';

// TODO add scroll to top button
// TODO bug messages some times duplicate because from parameter in 'messages' endpoint

interface state {
    messages: Array<any>,
    openLogin: boolean,
    username: string,
    openSearch: boolean,
    canSendMessages: boolean,
    connected: Array<string>,
    openImages: React.ReactNode,
    users: Array<any>,
    selectedContact?: any,
    openNewGroup: boolean,
    groups: Array<any>,
    loadingLogin: boolean
}

export default class App extends React.Component<{}, state> {
    ws = new W3CWebSocket('wss://chat.ilarramendi.com:443/ws');
    interval: any
    playSound = false

    constructor(p: any) {
        super(p);

        this.state = {
            messages: [], 
            openLogin: localStorage.getItem('username') == undefined, 
            username: localStorage.getItem('username') ?? '',
            openSearch: false,
            canSendMessages: false,
            connected: [],
            openImages: false,
            users: [],
            openNewGroup: false,
            groups: [],
            loadingLogin: true
        }

        this.ws.onmessage = e => this.onWSMessage(e)
        this.ws.onclose = () => this.onClose()
        this.ws.onopen = () => this.onOpen()
    
        this.sendMessage = this.sendMessage.bind(this)
        this.onClose = this.onClose.bind(this)
        this.newGroup = this.newGroup.bind(this)

        window.history.pushState('', "WhatSappn't", '/');

        document.getElementById('root').addEventListener("contextmenu", e => e.preventDefault());

    }

    onOpen() {
        console.log('WebSockets Connected');
        if (new Date(Date.parse(localStorage.getItem('validUntil'))) > new Date()) this.ws.send(JSON.stringify({'type': 'reconnect', 'token': localStorage.getItem('token')}))
        clearInterval(this.interval)
        this.setState({loadingLogin: false})
        setInterval(() => this.playSound = true, 1500)
    }

    onWSMessage(msg: IMessageEvent) {
        const data = JSON.parse(msg.data.toString())
        //console.log(data)

        switch (data['type']) {
            case 'message':
                this.setState({messages: [...this.state.messages, {...data, date: new Date(Date.parse(data['date']))}]}) // Transformed to local TZ
                if (this.state.selectedContact && ((this.state.selectedContact['username'] && (this.state.selectedContact['username'] == data['toUser'] || this.state.selectedContact['username'] == data['username'])) || (this.state.selectedContact['groupID'] == data['toGroup']))) document.getElementById('messagesContainer').scrollTo(0, 99999999)
                if (this.playSound && data['username'] != this.state.username) new Audio('/assets/play.wav').play();
            break;

            case 'error':
                alert(data['message'])
                if (data['action'] == 0) {
                    localStorage.clear()
                    location.reload()
                }
            break;

            case 'login':
                localStorage.setItem('username', data['username']);
                localStorage.setItem('token', data['token'])
                localStorage.setItem('validUntil', new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toString())
                
                document.cookie = "token=" + data['token'] + ';expires=' + new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toString();
                
                this.setState({openLogin: false, username: data['username'], canSendMessages: true, loadingLogin: false})
                this.ws.send(JSON.stringify({'type': 'messages', 'token': data['token'], 'from': this.state.messages.length > 0 ? this.state.messages[this.state.messages.length - 1]['messageID'] : 0}))
                this.ws.send(JSON.stringify({'type': 'users', 'token': data['token']}))
                this.ws.send(JSON.stringify({'type': 'groups', 'token': data['token']}))
            break;

            case 'connected':
                this.setState({connected: data['connected']})
            break;

            case 'users':
                this.setState({users: data['users']})
            break;

            case 'group':
                if (this.state.groups.findIndex(g => g['groupID'] == data['groupID']) == -1) this.setState({groups: [...this.state.groups, data]}) 
            break;
        }

    }

    onClose() {
        this.setState({canSendMessages: false, loadingLogin: true})
        clearInterval(this.interval)
        this.interval = setInterval(() => {
            console.error('WebSocket connection disconnected, atemping reconnect.')
            this.ws = new W3CWebSocket('wss://chat.ilarramendi.com:443/ws')
            this.ws.onmessage = e => this.onWSMessage(e)
            this.ws.onclose = () => this.onClose()
            this.ws.onopen = () => this.onOpen()
        }, 2000)
    }

    sendMessage(content: string, type: string) {
        // Check if token is valid here
        if (this.state.canSendMessages) {
            this.ws.send(
                JSON.stringify({
                    "type": type,
                    "content": content,
                    "token": localStorage.getItem('token'),
                    "toUser": this.state.selectedContact['username'],
                    "toGroup": this.state.selectedContact['groupID']
                })
            )
        } else alert('Cant send messages right now.')
        
    }

    newGroup(name: string, participants: Array<any>, image?: string) {
        if (this.state.canSendMessages) {
            this.ws.send(
                JSON.stringify({
                    "type": 'newGroup',
                    "name": name,
                    "image": image,
                    "token": localStorage.getItem('token'),
                    "participants": participants.map(p => p['username'])
                })
            )
            this.setState({openNewGroup: false})
        } else alert('Cant create a group right now.') // TODO add users to group
    }

    render() {
        const filteredMessages = this.state.selectedContact ? this.state.messages.filter(m => m['toUser'] == this.state.selectedContact['username'] || m['username'] == this.state.selectedContact['username'] || (m['toGroup'] && m['toGroup'] == this.state.selectedContact['groupID'])) : []
        const imagedMessages = filteredMessages.filter(m => m['image'])
        const contactsWithMessages = [] // TODO do this to onWSMessage

        for (const user of this.state.users) {
            var added = false
            for (var i = this.state.messages.length - 1; i > -1; i -= 1) {
                const {username, toUser} = this.state.messages[i]
                if (user['username'] == toUser || user['username'] == username) {
                    contactsWithMessages.push({...user, lastMessage: this.state.messages[i]})
                    added = true
                    break
                }
            }
            if (!added) contactsWithMessages.push(user)
        }

        for (const group of this.state.groups) {
            var added = false
            for (var i = this.state.messages.length - 1; i > -1; i -= 1) {
                if (this.state.messages[i]['toGroup'] == group['groupID']) {
                    contactsWithMessages.push({...group, lastMessage: this.state.messages[i]})
                    added = true
                    break
                }
            }
            if (!added) contactsWithMessages.push(group)
        }

        contactsWithMessages.sort((a, b) => (b['lastMessage'] ? b['lastMessage']['date'].getTime() : 0) - (a['lastMessage'] ? a['lastMessage']['date'].getTime() : 0))
        
        return [
            !this.state.openNewGroup && <Contacts onCreateGroup={() => this.setState({openNewGroup: true})} selectedContact={this.state.selectedContact} key={1} onClick={u => this.setState({selectedContact: u})} contacts={contactsWithMessages} username={this.state.username} />,
            this.state.openNewGroup && <NewGroup onDone={this.newGroup} onClose={() => this.setState({openNewGroup: false})} users={this.state.users.filter(u => u['username'] != this.state.username)}/>,
            
            
            this.state.selectedContact && (
                <div className="chatContainer" key={2}>
                    <div className="header">
                        <div className="contactImage" /*style={{backgroundColor: '#' + this.state.selectedContact['color'].toString('16').padStart(6, "0")}}*/>
                            <img src={this.state.selectedContact['image'] ?? (this.state.selectedContact['hasImage'] ? '/images/groups/' + this.state.selectedContact['groupID'] + '.jpg' : "/assets/messi.jpg")} />
                        </div>
                        <div className="verticalContainer">
                            <h1 className="title">
                                {this.state.selectedContact['username'] ?? this.state.selectedContact['name']}
                            </h1>
                            <h2 className="participants">
                                {this.state.selectedContact['participants'] ? this.state.selectedContact['participants'].map((p: any, i: number) => <label key={i}>{p + (i < this.state.selectedContact['participants'].length - 1 ? ', ' : '')}</label>) : 'Click to see contact information'}
                            </h2>
                        </div>

                        <button className="headerIcon search" onClick={() => this.setState({openSearch: true})}><Searchicon/></button>
                        <button className="headerIcon search"><Menu/></button>
                    </div>
                    
                    <Messages showUsernames={Boolean(this.state.selectedContact['name'])} messages={filteredMessages} username={this.state.username} onImageClick={id => {this.setState({openImages: id})}}/>
                    <Footer onSend={this.sendMessage} canSendMessages={this.state.canSendMessages}/>
                </div>
            ),
            !this.state.selectedContact && (
                <div className={'emptyContainer'} key={3}>
                    <label>WhatsAppn't Web</label>
                </div>
            ),
            this.state.openLogin && (
                <Login 
                    loading={this.state.loadingLogin}
                    key={4}
                    tryCredentials={(user, passwd, reg) => {this.ws.send(JSON.stringify({'type': reg ? 'register' : 'login', user, passwd})); this.setState({loadingLogin: true})}}
                    guestLogin={() => {this.ws.send(JSON.stringify({'type': 'guestLogin'})); this.setState({loadingLogin: true})}} />
            ),
            this.state.openSearch && (
                <Search 
                    key={5}
                    messages={filteredMessages} 
                    username={this.state.username} 
                    onClose={() => this.setState({openSearch: false})} />
            ),
            this.state.openImages && (
                <Images 
                    key={6}
                    onClose={() => this.setState({openImages: false})}
                    index={imagedMessages.indexOf(this.state.openImages)}
                    messages={imagedMessages} />
            ),
            this.state.openImages && <Contact key={7} user={false} images={imagedMessages} />
        ]
        
    }
}
