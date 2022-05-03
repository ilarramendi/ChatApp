import React from "react";
import './EmojiPicker.scss';

import emojis from './emojis'

import Lock from '../../../assets/lock.svg'

interface props {onClick: (emoji: string) => void}


interface state {}

export default class EmojiPicker extends React.Component<props, state> {
    constructor (p: props) {
        super(p);
    }

    render() {

        return (
            <div className={'EmojisContainer'}>
                {emojis.map((emoji, key) => 
                    <button onClick={() => this.props.onClick(emoji)} key={key}>
                        <label>{emoji}</label>
                    </button>
                )}
            </div>
        )
    }
}
