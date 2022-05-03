import React from 'react'

export function asyncHTTPRequest(url: string, cb: (status: Number, body: string) => void, type = "get", body?: string) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = () => { 
        if (xmlHttp.readyState == 4) cb(xmlHttp.status, xmlHttp.responseText);
    }
    xmlHttp.open(type, url, true);

    xmlHttp.setRequestHeader("Content-type", "application/json"); 

    xmlHttp.send(body);
}

export function getCredentials() {
    const cookies = document.cookie.split(';')
    const result = {'token': '', 'username': ''}
    for (const cookie of cookies) {
        const [name, value] = cookie.split('=')
        if (name.trim() == 'token') result['token'] = value
        if (name.trim() == 'username') result['username'] = value
    }

    return result['token'] != '' ? result : undefined
}

export function getDateString(date: Date) {
    const today = new Date()
    today.setMinutes(0)
    today.setHours(0)
    today.setSeconds(0)
    const dateDiff = today.getTime() - date.getTime()
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    //today
    if (date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear()) return 'today'
    //this week
    if (dateDiff < 24 * 60 * 60 * 1000) return weekDays[date.getDay()]
    //any other day
    return date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear()
}

export function formatAMPM(date: Date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    var strTime = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + ampm;
    return strTime;
}

export function highlightString(str: string, highlightPosition: number, highlightLength: number) {
    const ret: Array<React.ReactNode> = []
    ret.push(<label key={1}>{str.substring(0, highlightPosition)}</label>)
    ret.push(<span key={2}>{str.substring(highlightPosition, highlightPosition + highlightLength)}</span>)
    if (highlightPosition + highlightLength < str.length) ret.push(<label key={3}>{str.substring(highlightPosition + highlightLength, str.length)}</label>)
    return ret
}