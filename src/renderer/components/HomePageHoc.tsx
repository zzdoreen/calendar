import { Tabs } from "antd";
import { useState } from "react";
import CalendarComponent from "./Calendar";
import Countdown from "./Countdown";

export default function Home() {
    const [tab, setTab] = useState<'calendar' | 'countdown'>('countdown')
    // @ts-ignore
    return <Tabs type="card" onChange={setTab} defaultValue={tab}
        items={['calendar', 'countdown'].map((_) => {
            const isCalendar = _ === 'calendar'
            return {
                key: _,
                label: isCalendar ? '日历' : '重要日',
                children: isCalendar ? <CalendarComponent /> : <Countdown />
            }
        })}
    />
}