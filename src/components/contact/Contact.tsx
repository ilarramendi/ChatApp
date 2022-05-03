import React from "react";
import './Contact.scss';

import Exit from '../../../assets/exit.svg'
import Chevron from '../../../assets/chevronSmall.svg'
import Star from '../../../assets/star.svg'
import Bell from '../../../assets/bell.svg'
import Lock from '../../../assets/lock.svg'

interface props {
    user: any,
    images: Array<any>
}


interface state {}

export default class Images extends React.Component<props, state> {
    constructor (p: props) {
        super(p);
    }

    render() {

        return (
            <div className={'ContactContainer'}>
                <div className={'header'}>
                    <Exit />
                    <label>Group info</label>
                </div>
                <div className='imageWrapper'>
                    <div className={'imageContainer'}>
                        
                    </div>
                    <h1>Nombre grupo</h1>
                    <h2>Grupo * 14 miembors</h2>
                </div>

                <div className={'descriptionWrapper'}>
                    <label>Add a description to the group</label>
                    <label>Group created by ilarramendi</label>
                </div>

                <div className={'filesWrapper'}>
                    <div>
                        <label>Files, Links and Documents</label>
                        <label>51</label>
                        <Chevron />
                    </div>
                    <div className='imagesContainer'>
                        
                    </div>
                </div>
                <div className={'favoritesWrapper'}>
                    <Star />
                    <label>Stared messages.</label>
                    <Chevron />
                </div>
                <div className={'silenceWrapper'}>
                    <div>
                        <Bell />
                        <label>Silence Notifications</label>

                    </div>

                    <div>
                        <Lock />
                        <label>Cifrado</label>
                        
                    </div>
                    <label>Messages are not stored encrypted but they are transfeared via web socket secure (WSS)</label>
                </div>
                
            </div>
        )
    }
}
