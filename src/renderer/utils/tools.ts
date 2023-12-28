/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
/* eslint-disable global-require */
/**
 * 本地存储读取并反JSON序列化
 * @param key 键名
 * @param defaultValue 默认值，当反JSON序列化出错时返回该值
 */
// eslint-disable-next-line import/prefer-default-export
export function getLocalStorage<T extends any>(
  key: string,
  defaultValue = null as T,
) {
  let result: T;
  try {
    result = JSON.parse(window.localStorage.getItem(key) as string);
    // eslint-disable-next-line no-throw-literal
    if (result === null) throw '值为null，将返回默认值'; // 不存在时，返回默认值
  } catch {
    // 避免缓存的原因，造成解析失败
    getLocalStorage(key, defaultValue);
    result = defaultValue;
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return result!;
  }
}

// 语音播报相关接口

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

export const playVoice = (url: string) => {
  // 播放音频先取消TTS语音播放
  speechSynthesis.cancel()
  const audio = new Audio(url)
  audio.play()
}

export const playVoiceTasks = (countdown: number, intensity: number) => {
  const wuwuUrl = require(`../../../assets/audio/notifys/wu.mp3`)
  if (countdown === 0) {
    let count = 10;
    let timer: string | number | NodeJS.Timeout | null | undefined = null
    timer = setInterval(() => {
      if (--count >= 0) playVoice(wuwuUrl)
      else {
        let txt_speech = new SpeechSynthesisUtterance()
        txt_speech = playTTS('啊啊啊啊啊啊啊啊.....')
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

export function hexToRgb(hex: string) {
  // 移除#号  
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  // eslint-disable-next-line no-param-reassign
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `rgb(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)})` : null;
}