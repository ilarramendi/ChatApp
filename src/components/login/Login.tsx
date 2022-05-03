import React from "react";

import './Login.scss';

interface props {
    tryCredentials: (username: string, password: string, register: boolean) => void,
    guestLogin: () => void,
    loading: boolean
}

interface state {
    username: string,
    passwd: string,
    errorMessage: string
}


export default class MessageContainer extends React.Component<props, state> {

    constructor(p: props) {
        super(p);

        this.state = {username: '', passwd: '', errorMessage: ''}
        this.getErrorMessage = this.getErrorMessage.bind(this)
        this.auth = this.auth.bind(this)
    }

    getErrorMessage() {
        if (this.state.username.length < 2) return 'Minimum username length is 2.'
        if (this.state.username.length > 30) return 'Maximum username length is 30.'
        if (this.state.passwd.length < 10) return 'Minimum password length is 10.'
        if (this.state.passwd.length > 100) return 'Maximum username length is 100.'
        
        return ''
    }


    auth(register: boolean) {
        const errorMessage = this.getErrorMessage()
        
        this.setState({errorMessage})
        if (errorMessage == '') this.props.tryCredentials(this.state.username, this.state.passwd, register)
    }

    render() {
        return (
            <div className="loginWrapper">
                <div className="loginContainer">
                    <h2 className="title">Login / Register</h2>
                    <div className="dataContainer">
                        <label>Username</label>
                        <input disabled={this.props.loading} onChange={e => this.setState({username: e.target.value})} onKeyDown={e => {if (e.key == 'Enter') () => this.auth(true)}}/>
                        <label>Password</label>
                        <input disabled={this.props.loading} type="password" onChange={e => this.setState({passwd: e.target.value})} onKeyDown={e => {if (e.key == 'Enter') () => this.auth(true)}}/>
                    </div>
                    <div className="buttonsContainer">
                        {/*<button onClick={() => this.props.onClose()}>Skip</button>*/}
                        <button disabled={this.props.loading} onClick={() => this.auth(false)}>Login</button>
                        <button disabled={this.props.loading} onClick={this.props.guestLogin}>Login as Guest</button>
                        <button disabled={this.props.loading} onClick={() => this.auth(true)}>Register</button>
                    </div>
                    <label className='errorMessage'>{this.state.errorMessage}</label>
                </div>
            </div>)
    }
}