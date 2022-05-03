import React from "react";
import {getDateString, formatAMPM} from '../../common'

import './Messages.scss';

import Message from '../message/Message'


interface props{
    messages: Array<any>,
    username: string,
    onImageClick: (id: number) => void,
    showUsernames: boolean
}

interface state{
    messages: Array<any>,
    username: string
}

export default class Messages extends React.Component<props, state> {
    constructor(p: props){
        super(p);
        this.state = {
            messages: p.messages,
            username: ''
        }
    }

    static getDerivedStateFromProps = (nextProps: props) => nextProps

    onScroll(e: any) {
        var firstVisibleElement: any
        var i = 0
        
        for (const el of Array.from(document.querySelectorAll('.date_dummy'))) {
            if (el.getBoundingClientRect().top > 110) {
                firstVisibleElement = document.getElementById('date_' + el.id.split('_')[1])
                break
            }
            i += 1
        }

        document.querySelectorAll('.date').forEach(e => e.className = 'date')
        if (i > 0) document.querySelectorAll('.date')[i - 1].classList.add('sticky')
    }

    sameDay = (date1: Date, date2: Date) => date1.getDay() == date2.getDay() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear()

    render() {
        var prevDate = new Date()
        var dateKey = this.state.messages.length

        prevDate.setFullYear(1999)

        return (
            <div className="messagesWrapper">
                    <img className="background" />
                    <div id={"messagesContainer"} onScroll={this.onScroll}>
                        {this.state.messages.map((msg, i) => {
                            const addDateHeader = !this.sameDay(prevDate, msg['date'])
                            const username = (this.props.showUsernames && msg['username'] != this.state.username && (i == 0 || msg['username'] != this.state.messages[i - 1]['username'] || addDateHeader)) ? msg['username'] : ""
                            const arrow = (i > 0 && msg['username'] == this.state.messages[i - 1]['username'] && !addDateHeader) ? 0 : (Number(msg['username'] == this.state.username) + 1)
                            
                            if (addDateHeader) {
                                prevDate = msg['date']
                                dateKey += 2
                            }
                            
                            return ([
                                addDateHeader && [
                                    <a href={'/#dummy_' + String(dateKey)} key={dateKey} className={'date'} id={'date_' + String(dateKey)}>{getDateString(prevDate)}</a>,
                                    <div key={dateKey + 1} className='date_dummy' id={'dummy_' + String(dateKey)}/>
                                ],
                                <Message 
                                    key={i}
                                    id={msg['messageID']}
                                    content={msg['content']}
                                    username={username}
                                    date={formatAMPM(msg['date'])}
                                    userColor={msg['color']}
                                    align={Number(msg['username'] == this.state.username)}
                                    arrow={arrow}
                                    mode={0}
                                    type={msg['image'] ? 'image' : 'text'}
                                    onClick={() => msg['image'] && this.props.onImageClick(msg)}
                                />]
                            )
                        })}
                        <label>No messsages with this contact.</label>
                    </div>
                </div>
        )
    }
}