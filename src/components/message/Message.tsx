import React from "react";
import './Message.scss';


interface props {
    content: React.ReactNode,
    username: string,
    date: string,
    userColor: number,
    align: align,
    arrow: arrow,
    mode: mode,
    highlightPositions?: Array<number>,
    highlightLength?: number,
    id?: number,
    onClick?: () => void,
    type: string
}

interface state {
    highlightPositions: Array<number>,
    highlightLength: number
}

enum mode {
    chat,
    search
}

enum align {
    Left,
    Right
}

enum arrow {
    None,
    Left,
    Right
}


export default class Message extends React.Component<props, state> {

    constructor(p: props) {
        super(p);

        this.state = {highlightLength: p.highlightLength, highlightPositions: p.highlightPositions ?? []}
    }

    static getDerivedStateFromProps(nextProps: props) {
        return {...nextProps, highlightPosition: nextProps.highlightPositions ?? []};
    }


    render() {
        var containerClass = this.props.arrow == 0 ? '' : this.props.arrow == 1 ? 'arrowLeft ' : 'arrowRight ';
        containerClass += this.props.align == 0 ? 'left ' : 'right ';
        containerClass += this.props.mode == 0 ? 'chat' : 'search';
        const color = '#' + this.props.userColor.toString(16).padStart(6, "0");

        return (
            <div className={'messageContainer ' + containerClass + ' ' + this.props.type} id={'message_' + this.props.id} onClick={this.props.onClick ?? (() => {})}>
                {this.props.username.length > 0 && <label className='user' style={{color}}>{this.props.username}</label>}
                {
                    this.props.type == 'text' ? 
                        <label className='message'>{this.props.content}</label> :
                        <img src={String(this.props.content)} alt={'No access to the image or image deleted.'}/>
                    }
                <label className='hour'>{this.props.date}</label>
            </div>
        )
    }
}
