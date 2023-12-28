/* eslint-disable global-require */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
import { useEffect, useMemo, useState } from "react";
import { playVoice, playVoiceTasks } from "../utils/tools";

export default function WarningPage({ setting }: any) {
    const { setColor = 'rgb(255,117,0)', setText = '四川省成都市高新区' } = setting || {}
    const [countdown, setCountdown] = useState<number>(20)

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null
        if (countdown === 20) playVoice(require(`../../../assets/audio/notifys/dingdong.mp3`))
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

    const isArrived = useMemo(() => countdown === 0, [countdown])

    const { gradientColor, borderColor } = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        let borderColor;
        const regex = /\d+/g
        const res = new Array(4).fill(setColor.match(regex).concat([])).map((value, index) => {
            const v = [...value].map(a => Number(a))
            v[1] += (index + 1) * 10
            v[2] += (index + 1) * 10
            const persent = 100 - (1 + index) * 20
            const str =
                `transparent ${persent - 19}%, transparent ${persent - 10}%,
                rgb(${v.join(',')}) ${persent - 9}%,rgb(${v.join(',')}) ${persent}%`

            if (index === 3) borderColor = `rgb(${v.join(',')})`
            return str
        }).reverse().join(',')

        return {
            borderColor,
            gradientColor: `radial-gradient(circle at center,${res},transparent 81%, transparent 100%)`
        }
    }, [setColor])


    const detailArray = useMemo(() => [
        {
            title: '震中',
            value: '云南腾冲'
        },
        {
            title: '预警震级',
            value: '5.6'
        },
        {
            title: '预估烈度 3.8',
            value: '强烈震感'
        }
    ], [])

    return <div className='detail-container' style={{ backgroundColor: setColor || '' }}>
        <div className='intensity-content'>
            <div className="title">地震横波{isArrived ? '已到达' : '即将到达'}</div>
            <div className="location">{isArrived ? setText : '请注意避险'}</div>
            <div className="distance">震中距你100公里</div>
            {
                !isArrived && <div className="countdown">
                    <div className="count">{countdown}</div>
                    <div className="unit">秒</div>
                </div>
            }
            <div className={`${isArrived ? 'arrived' : ''}`} style={{ background: gradientColor }} />
        </div>
        <div className="intensity-info">
            {
                detailArray.map(({ title, value }) => <div className="item" key={title}
                    style={{ borderLeftColor: borderColor ?? setColor }}>
                    <div className="title">{title}</div>
                    <div className="content">{value}</div>
                </div>)
            }
        </div>
    </div>
}