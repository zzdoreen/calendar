/* eslint-disable no-undef */
/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-expressions */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { useEffect, useState } from "react";

export default function WarningPage() {
    const [countdown, setCountdown] = useState<number>(10)

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null
        if (countdown === 20) playVoice(require('../../../assets/audio/notifys/dingdong.mp3'))
        if (countdown)
            timer = setInterval(() => {
                const count = countdown - 1
                playVoiceTasks(count, 3)
                setCountdown(count)
            }, 1000)

        return () => {
            timer && clearInterval(timer)
        }
    }, [countdown])

    return <div className="countdown-container">
        <h1>正在预警页面</h1>
        <div className="count">
            {countdown}
        </div>
    </div>
}

const playVoice = (url: string) => {
    // 播放音频先取消TTS语音播放
    speechSynthesis.cancel()
    const audio = new Audio(url)
    audio.play()
}

const playVoiceTasks = (countdown: number, intensity: number) => {
    const wuwuUrl = require('../../../assets/audio/notifys/wu.mp3')
    if (countdown === 0) {
        let count = 10;
        let timer: string | number | NodeJS.Timeout | null | undefined = null
        timer = setInterval(() => {
            if (--count >= 0) playVoice(wuwuUrl)
            else {
                let txt_speech = new SpeechSynthesisUtterance()
                txt_speech = playTTS('地震预警广播终端.....')
                txt_speech.onend = (e) => {
                    console.log('end', e)
                    txt_speech.onend = null
                    timer && clearInterval(timer)
                }
            }
        }, 1000)
    }
    if (countdown > 99 || countdown < 1) return
    const countdownsUrl = require(`../../../assets/audio/countdowns/earthquake_${countdown}.mp3`);
    const didiUrl = require(`../../../assets/audio/notifys/${intensity >= 5 ? 'didi' : 'di'}.mp3`);

    if (countdown > 10) {
        if (countdown % 2 === 0) {

            playVoice(countdownsUrl)
            intensity >= 3 && setTimeout(() => {
                playVoice(didiUrl)
            }, 1000);
        }
    } else if (countdown > 0) {
        playVoice(countdownsUrl)
        intensity >= 3 && setTimeout(() => {
            playVoice(didiUrl)
        }, 500);
    }
}


const playTTS = (() => {
    // 当前播放的文字，避免更新报触发重复播放
    let curentText = ''
    let curentMsg: SpeechSynthesisUtterance
    return (text: string) => {
        if (text === curentText) return curentMsg
        curentText = text
        const msg = new SpeechSynthesisUtterance(text);
        msg.rate = .8
        msg.volume = 1
        msg.pitch = 2
        speechSynthesis.speak(msg);
        msg.addEventListener('end', () => {
            curentText = ''
        })
        curentMsg = msg
        return msg
    }
})()