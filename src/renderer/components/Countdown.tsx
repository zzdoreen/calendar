/* eslint-disable @typescript-eslint/no-shadow */
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Card } from 'antd'
import { IListDataEntity } from "./Calendar"

export default function Countdown() {
    const listData: IListDataEntity[] = JSON.parse(localStorage.getItem('calendar-data') || '[]')

    const { pastDays, countdownDays } = useMemo(() => {
        const countdownDays: IListDataEntity[] = [];
        const pastDays: IListDataEntity[] = []

        listData?.filter(({ improtant }) => improtant)
            ?.sort((n, m) => dayjs(n.raw).unix() - dayjs(m.raw).unix())
            ?.forEach(({ raw, ...res }) => {
                if (dayjs().unix() - dayjs(raw).unix() < 0) countdownDays.push({ raw, ...res })
                else pastDays.push({ raw, ...res })
            })
        return { countdownDays, pastDays }
    }, [listData])

    return <div className="countdown-container">
        <Card>
            {
                countdownDays.map(({ content, raw, type }) => <div key={dayjs(raw).unix()} className={`countdown-box ${type}`}>
                    <p className="name">{content}</p>
                    <p className="date">{dayjs(raw)?.format('YYYY年MM月DD日')}</p>
                    <p className="countdown"><strong>{Math.abs(dayjs().diff(dayjs(raw), 'day'))}</strong>天后</p>
                </div>)
            }
        </Card>
        <Card>
            {
                pastDays.map(({ content, raw, type }) => <div key={dayjs(raw).unix()} className={`countdown-box ${type}`}>
                    <p className="name">{content}</p>
                    <p className="date">{dayjs(raw)?.format('YYYY年MM月DD日')}</p>
                    <p className="countdown">已经<strong>{Math.abs(dayjs().diff(dayjs(raw), 'day'))}</strong>天</p>
                </div>)
            }
        </Card>

    </div>
}