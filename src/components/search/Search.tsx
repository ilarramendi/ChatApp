import React from "react";
import {formatAMPM, getDateString, highlightString} from '../../common'

import Message from '../message/Message'

import './Search.scss';


import SearchIcon from '../../../assets/search.svg';
import Exit from '../../../assets/exit.svg';
import Back from '../../../assets/back.svg';



interface props{
    messages: Array<any>,
    username: string,
    onClose: () => void
}

interface state{
    messages: Array<any>, 
    focus: boolean,
    value: string
}

export default class Search extends React.Component<props, state> {
    constructor(p: props){
        super(p);

        this.state = {messages: p.messages, focus: false, value: ''}

        this.filter = this.filter.bind(this)
    }

    filter (messages: Array<any>, search: string) {
        const filtered: Array<any> = []
        if (search.length > 0) {
            for (const message of messages) { 
            const userIndex = message['username'].indexOf(search)
            const contentIndex = message['content'].indexOf(search)
            message['usernameHighlighted'] = userIndex > -1 ? highlightString(message['username'], userIndex, search.length) : message['username']
            message['contentHighlighted'] = !message['image'] ? contentIndex > -1 ? highlightString(message['content'], contentIndex, search.length) : message['content'] : '📸 Image'
            if (userIndex + contentIndex  > -2) filtered.push(message)
            }
        }
        
        return filtered
    }

    static getDerivedStateFromProps(nextProps: props) {
        return nextProps;
    }

    render() {
        return (
            <div className={'searchContainer'}>
                <div className={'header'}>
                    <button onClick={this.props.onClose} className={'exit'}>
                        <Exit />
                    </button>
                    <h2>Search Messages</h2>

                </div>
                <div className='inputWrapper'>
                    <div className='inputContainer'>
                        {this.state.focus || this.state.value.length > 0 ? <Back onClick={() => this.setState({value: ''})} className='back'/> : <SearchIcon/>}
                        <input
                            autoFocus={true}
                            placeholder={this.state.focus ? '' : 'Search...'}
                            onFocus={() => {this.setState({focus: true})}}
                            onBlur={() => {this.setState({focus: false})}}
                            onChange={e => this.setState({value: e.target.value})}
                            value={this.state.value}/>
                    </div>
                </div>
                <div className={'messagesContainer'}>
                    {this.filter(this.state.messages, this.state.value).reverse().map((msg, i) => {

                        return (
                            <Message 
                                key={i}
                                content={msg['contentHighlighted']}
                                username={msg['usernameHighlighted']}
                                date={getDateString(msg['date']) + ' ' + formatAMPM(msg['date'])}
                                userColor={0}
                                align={0}
                                arrow={0}
                                mode={1}
                                highlightPositions={[0]}
                                highlightLength={5}
                                type='text'
                                onClick={() => {window.location.href = window.location.href.split('#')[0] + '#message_' + msg['messageID']}}
                            />
                        )   
                    })}
                    <label className={'emptyLabel'}>Search for something first</label>
                </div>
            </div>
        )
    }
}