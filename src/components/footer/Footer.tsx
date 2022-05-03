import React from "react";
import EmojiPicker from '../emojiPicker/EmojiPicker';

import './Footer.scss';

import Send from '../../../assets/send.svg';
import Attach from '../../../assets/attach.svg';
import Emoji from '../../../assets/emoji.svg';

interface props{
    onSend: (content: string, type: string) => void,
    canSendMessages: boolean
}
interface state {
    value: string,
    openEmojiPicker: boolean
}

export default class Message extends React.Component<props, state> {

    constructor(p: props){
        super(p);
        this.sendMessage = this.sendMessage.bind(this)
        this.sendImage = this.sendImage.bind(this)

        this.state = {value: "", openEmojiPicker: false}
    }

    sendMessage() {
        if (this.state.value.trim().length > 0) {
            this.props.onSend(this.state.value.trim(), 'text')
            this.setState({value: "", openEmojiPicker: false}, () => document.getElementById('footer_input').style.height = '28px')
        }
    }

    sendImage(file: any) {
        let reader = new FileReader();
        reader.onloadend = e => {
            if(String(e.target.result).length > 4 * 1024 * 1024 * 1.3) alert('Image is too large, max size is 4MB') // 30% size difference when encoding to base64
            else this.props.onSend(String(e.target.result), 'image')
        }
        reader.readAsDataURL(file)
    }

    render() {
        return (
            <div className={'footerWrapper'}>
                 <div className={'footerContainer'  + (this.props.canSendMessages ? '' : ' disabled')}>
                    <div className={"button"}>
                        <input type="file" accept="image/png, image/jpeg" onChange={e => this.sendImage(e.target.files[0])} disabled={!this.props.canSendMessages} onClick={() => this.setState({openEmojiPicker: false})}/>
                        <Attach/>
                    </div>
                    <button className="button" onClick={() => this.setState({openEmojiPicker: !this.state.openEmojiPicker})}><Emoji/></button>
                    
                    <textarea 
                        autoFocus={true}
                        onChange={e => this.setState({value: e.target.value}, () => document.getElementById('footer_input').style.height  = document.getElementById('footer_input').scrollHeight.toString() + 'px')}
                        value={this.state.value}
                        id="footer_input"
                        maxLength={1000} 
                        onKeyDown={e => {if (e.key == 'Enter') {this.sendMessage(); e.preventDefault()}}}/>
                    <button className="button sendButton" onClick={this.sendMessage} disabled={!this.props.canSendMessages} ><Send/></button>
                </div>
                {this.state.openEmojiPicker && <EmojiPicker onClick={e => {this.setState({value: this.state.value + e}) }} />}
            </div>
           
        )
    }
}