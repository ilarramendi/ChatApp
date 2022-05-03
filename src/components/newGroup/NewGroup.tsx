import React from "react";
import {highlightString, getDateString, formatAMPM} from '../../common'

import './NewGroup.scss';

import Back from '../../../assets/back.svg';
import Exit from '../../../assets/exit.svg';
import Arrow from '../../../assets/back.svg';
import Emoji from '../../../assets/emoji.svg';
import Camera from '../../../assets/camera.svg';
import Check from '../../../assets/check.svg';
import MissingImage from '../../../assets/missingImage.svg';


interface props {
    users: Array<any>,
    onClose: () => void,
    onDone: (name: string, users: Array<any>, image?: string) => void
}

interface state {
    selectedContacts: Array<any>,
    step: number,
    nameInput: string,
    image?: string
}

export default class NewGroup extends React.Component<props, state> {
    constructor (p: props) {
        super(p);
        this.state = {
            selectedContacts: [],
            step: 0,
            nameInput: ''
        }
    }
    

    static getDerivedStateFromProps(nextProps: props) {
        return nextProps
    }

    onSelectImage(image: File) {
        let reader = new FileReader();
        reader.onloadend = e => {
            if(String(e.target.result).length > 4 * 1024 * 1024 * 1.3) alert('Image is too large, max size is 4MB') // 30% size difference when encoding to base64
            else this.setState({image: String(e.target.result)})
        }
        reader.readAsDataURL(image)
    }

    render() {
        return (
            <div className={'NewGroupContainer'}>
                <div className={'header'}>
                    <button onClick={() => this.state.step > 0 ? this.setState({step: this.state.step - 1}) : this.props.onClose()}>
                        <Back />
                    </button>
                    <label>{this.state.step == 0 ? 'Add participants' : 'New group'}</label>
                </div>
                {this.state.step == 0 && [
                    <div className={'selectedContacts'} key={0}>
                        {
                            this.state.selectedContacts.sort((a, b) => a.username > b.username ? 1 : -1).map((u, i) => (
                                <div className={'userContainer'} key={i}>
                                    <div>
                                        <img src={u['image'] ?? '/assets/messi.jpg'}/>
                                    </div>
                                    <label>{u['username']}</label>
                                    <button onClick={() => this.setState({selectedContacts: this.state.selectedContacts.filter(c => c != u)})}>
                                        <Exit />
                                    </button>
                                </div>
                            ))
                        }
                        <input placeholder={'Enter contact name here.'} autoFocus={true}/>
                    </div>,
                    <div className={'contactsContainer'} key={1}>
                        {
                            this.props.users.filter(e => this.state.selectedContacts.indexOf(e) == -1).sort((a, b) => a.username > b.username ? 1 : -1).map((u, i) => (
                                <div key={i} className={'userContainer'} onClick={() => this.setState({selectedContacts: [...this.state.selectedContacts, u]})}>
                                    <div>
                                    <img src={u['image'] ?? '/assets/messi.jpg'}/>
                                    </div>
                                    <label>{u['username']}</label>
                                </div>
                            ))
                        }
                    </div>,
                    this.state.selectedContacts.length > 0 && <button key={2} onClick={() => this.setState({step: 1})}><Arrow /></button>
                ]}
                {this.state.step == 1 && <div className={'infoContainer'}>
                        <div className={'imageContainer' + (this.state.image ? ' selected' : '')}>
                            {this.state.image ? <img src={this.state.image}/> : <MissingImage />}
                            <Camera />
                            <label>{this.state.image ? 'Click to change image' : 'Add an image to the group'}</label>
                            <input type="file" accept="image/png, image/jpeg" onChange={e => this.onSelectImage(e.target.files[0])} />
                        </div>

                        <div className={'inputContainer'}>
                            <input placeholder={'Group name'} value={this.state.nameInput} onChange={e => this.setState({nameInput: e.target.value})}/>
                            <Emoji onClick={() => alert('alta paja')}/>
                        </div>
                        
                        {this.state.nameInput.length > 0 && <button onClick={() => this.props.onDone(this.state.nameInput, this.state.selectedContacts, this.state.image)}><Check/></button>}
                    </div>
                }
            </div>
        );
    }
}
