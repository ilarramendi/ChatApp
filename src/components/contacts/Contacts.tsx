import React from "react";
import {highlightString, getDateString, formatAMPM} from '../../common'

import './Contacts.scss';

import Stories from '../../../assets/stories.svg';
import NewChat from '../../../assets/newChat.svg';
import Menu from '../../../assets/menu.svg';
import Search from '../../../assets/search.svg';
import Back from '../../../assets/back.svg';


interface props {
    username: string,
    contacts: Array<any>,
    onClick: (user: any) => void,
    onCreateGroup: () => void,
    selectedContact?: any,
}

interface state {
    showContextMenu: boolean,
    input: string,
    focus: boolean
}

export default class Contacts extends React.Component<props, state> {
    constructor (p: props) {
        super(p);
        this.state = {showContextMenu: false, input: '', focus: false}
    }
    

    static getDerivedStateFromProps(nextProps: props) {
        return nextProps
    }

    render() {
        console.log(this.props.contacts)
        return (
            <div className={'contactsContainer'}>
                <div className='header'>
                    <div className={'contactImage'}>
                        <img src="/assets/messi.jpg" />
                    </div>
                    <h1>
                        {this.props.username != '' ? this.props.username : ''}
                    </h1>
                    <button onClick={() => alert('All contacts are avalilable by default, maby a feature for the future.')}>
                        <NewChat className={'newChatIcon'}/>
                    </button>
                    <button onClick={() => this.setState({showContextMenu: !this.state.showContextMenu})} onBlur={() => setTimeout(() => this.setState({showContextMenu: false}), 500)}>
                        <Menu className={'menuIcon'}/>
                    </button>
                    
                    {this.state.showContextMenu && <div className={'contextMenu'}>
                        <button onClick={this.props.onCreateGroup}>Create a Group</button>
                        <button onClick={() => {
                                    localStorage.clear()
                                    document.cookie = name + "token=a;expires=Thu, 01 Jan 1970 00:00:00 GMT"
                                    location.reload()
                            }}>
                                Logout
                        </button>
                        <a href="https://ilarramendi.com">Developer information</a>
                    </div>}
                </div>
                
                <div className='inputWrapper'>
                    <div className='inputContainer'>
                        {this.state.focus || this.state.input.length > 0 ? <Back onClick={() => this.setState({input: ''})} className='back'/> : <Search/>}
                        <input
                            placeholder={this.state.focus ? '' : 'Search for a contact.'}
                            onFocus={() => {this.setState({focus: true})}}
                            onBlur={() => {this.setState({focus: false})}}
                            onChange={e => this.setState({input: e.target.value})}
                            value={this.state.input} />
                    </div>
                </div>

                <div className={'scrollableContainer'}>
                    {
                        this.props.contacts.filter(u => u['username'] != this.props.username && (this.state.input.length == 0 || (u['username'] ?? u['name']).indexOf(this.state.input) > -1)).map((u, i) => {
                            const highlight = (u['username'] ?? u['name']).indexOf(this.state.input)
                            const lastMessageString = u['lastMessage'] ? (u['lastMessage']['username'] ?? u['lastMessage']['name']) + ': ' + (u['lastMessage']['image'] ? '📸 Image' : u['lastMessage']['content']) : 'No messsages with this contact.'
                            var lastMessageDateString =  u['lastMessage'] ? getDateString(u['lastMessage']['date']) : ''
                            
                            if (lastMessageDateString == 'today') lastMessageDateString = formatAMPM(u['lastMessage']['date'])
                           
                            return (
                                <div className={'contactContainer' + (this.props.selectedContact && (this.props.selectedContact['username'] ?? this.props.selectedContact['groupID']) == (u['username'] ?? u['groupID']) ? ' selected' : '')} key={i} onClick={() => this.props.onClick(u)}>
                                    <div className={'contactImage'} /*style={{backgroundColor: '#' + u['color'].toString('16').padStart(6, "0")}}*/>
                                        {<img src={u['image'] ?? (u['hasImage'] ? '/images/groups/' + u['groupID'] + '.jpg' : "/assets/messi.jpg")} />}
                                    </div>
                                    <div className={'contentContainer'}>
                                        <div className={'verticalContainer'}>
                                            <label className='contactName'>{highlight > -1 ? highlightString((u['username'] ?? u['name']), highlight, this.state.input.length) : (u['username'] ?? u['name'])}</label>
                                            <label className='lastMessage'>{lastMessageString}</label>
                                        </div>
                                        <label className={'date'}>{lastMessageDateString}</label>
                                    </div>
                                </div>)
                        })
                    }
                    <label>No contacts found.</label>
                </div>

                
               
            </div>
        )
    }
}
