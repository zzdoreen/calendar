/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable no-return-assign */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-use-before-define */
import { CheckOutlined, CloseOutlined, HeartFilled,  } from "@ant-design/icons";
import { Badge, BadgeProps, Button, Calendar, CalendarProps, Col, Input, Modal, Popover, Row, Select, message } from "antd"
import dayjs, { Dayjs } from "dayjs";
import zhCN from 'dayjs/locale/zh-cn'
import { useState, useCallback, SetStateAction, useEffect } from "react";
import { useLocalStorageState, useReactive } from 'ahooks'
import { Lunar, HolidayUtil } from 'lunar-typescript';

export interface IListDataEntity {
    id: number
    raw: Dayjs
    type: BadgeProps['status']
    content?: string
    improtant?: boolean
}

type IStatusEntity = {
    // @ts-ignore
    [x in BadgeProps['status']]: string;
};
const StatusColorMap: IStatusEntity = {
    'error': 'rgba(255,77,79,.2)',
    'warning': 'rgba(250,173,20,.2)',
    'success': 'rgba(82,196,20,.2)',
    'default': 'rgba(191,191,191,.2)',
    'processing': 'rgba(22,119,255,.2)',
}
export default function CalendarComponent() {
    const [visible, setVisible] = useState<boolean>(false)
    const [currentDate, setCurrentDate] = useState<Dayjs>()
    const [detailData, setDetailData] = useState<IListDataEntity[]>([])
    const [listData, setListData] = useLocalStorageState<IListDataEntity[]>('calendar-data', {
        defaultValue: [
            // {
            //     id: dayjs().unix(),
            //     raw: dayjs('2024-01-16'),
            //     type: 'warning',
            //     content: 'This is warning event.'
            // },
        ]
    })

    const getListData = useCallback((value: Dayjs) => (listData || []).filter(({ raw }) => value?.isSame(raw, 'D')), [listData])

    const dateCellRender = (value: Dayjs, lunar: string, isWork: boolean | undefined) => {
        const data = getListData(value);
        const content = (dateContent: boolean) => <div
            onDoubleClick={() => {
                setDetailData(data || [])
                setVisible(true)
                setCurrentDate(value)
            }}
            style={dateContent ? {
                position: 'absolute',
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
                left: 0,
                top: 0,
                cursor: 'pointer'
            } : {
                cursor: 'pointer'
            }}
        >

            <ul className="events"
                style={dateContent ? {
                    overflowY: 'auto',
                    marginTop: '25px',
                    maxHeight: 'calc(100% - 20px)',
                    paddingLeft: 0
                } : {
                    paddingLeft: 0,
                }}
            >
                {data.map((item) => (
                    <li key={item.id} style={{ backgroundColor: StatusColorMap[item.type!] }}>
                        <Badge status={item.type as BadgeProps['status']} text={item.content} />
                    </li>
                ))}
            </ul>
        </div>
        return <>
            <p style={{ position: 'absolute', margin: 0, left: 0, top: 0, padding: 4, color: '#969696' }}>
                {lunar}
                {
                    isWork !== undefined && <span style={{ color: isWork ? 'red' : 'green', marginLeft: 5, border: '1px solid', borderRadius: '50%', padding: '1px 3px' }}>{isWork ? '班' : '休'}</span>
                }
            </p>
            <Popover content={data?.length ? content(false) : null} >{content(true)}</Popover>
        </>
    };

    const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
        const d = Lunar.fromDate(current.toDate());
        const lunar = d.getDayInChinese();
        const solarTerm = d.getJieQi();
        const h = HolidayUtil.getHoliday(current.get('year'), current.get('month') + 1, current.get('date'));
        const displayHoliday = h?.getTarget() === h?.getDay() ? h?.getName() : undefined;
        const isWork = h?.isWork()

        switch (info.type) {
            case 'date': return dateCellRender(current, displayHoliday || solarTerm || lunar, isWork);
            default: return info.originNode
        }
    };

    const handleDel = useCallback((delId: number) => {
        const data = listData?.filter(({ id }) => id !== delId)
        const dData = detailData?.filter(({ id }) => id !== delId)
        setListData(data ?? [])
        setDetailData(dData ?? [])
    }, [listData, detailData])

    const handleUpdate = useCallback((updateId: number) => {
        const data = listData?.map(({ id, ...res }) => {
            if (id === updateId) return {
                id, ...res, improtant: !res.improtant
            }
            return { id, ...res }
        })
        const dData = detailData?.map(({ id, ...res }) => {
            if (id === updateId) return { id, ...res, improtant: !res.improtant }
            return { id, ...res }
        })
        setListData(data ?? [])
        setDetailData(dData ?? [])
    }, [listData, detailData])

    const handleAdd = useCallback(({ type, content, raw }: { raw: Dayjs, type: BadgeProps['status'], content: string }) => {
        const newData = [{
            id: dayjs().unix(),
            raw,
            type,
            content,
            important: false
        }]
        const data = listData?.concat(newData)
        setListData(data)
        setDetailData(detailData.concat(newData))
    }, [listData, detailData])

    const getYearLabel = (year: number) => {
        const d = Lunar.fromDate(new Date(year + 1, 0));
        return `${d.getYear()} (${d.getYearInGanZhi()}${d.getYearShengXiao()}年)`;
    };

    const getMonthLabel = (month: number, value: Dayjs) => {
        const d = Lunar.fromDate(new Date(value.year(), month));
        const lunar = d.getMonthInChinese();
        return `${month + 1}月 (${lunar}月)`;
    };

    const headerContent = (value: dayjs.Dayjs, onChange: { (date: dayjs.Dayjs): void; (arg0: any): void; }) => {
        const start = 0;
        const end = 12;
        const monthOptions = [];
        let current = value.clone();
        // @ts-ignore
        const localeData = value?.localeData();
        const months = [];
        for (let i = 0; i < 12; i++) {
            current = current.month(i);
            months.push(localeData.monthsShort(current));
        }

        for (let i = start; i < end; i++) {
            monthOptions.push({ label: getMonthLabel(i, value), value: i });
        }

        const year = value.year();
        const month = value.month();
        const options = [];

        for (let i = year - 10; i < year + 10; i += 1) {
            options.push({ label: getYearLabel(i), value: i });
        }

        return <Row justify="center" gutter={10} style={{ padding: 10, textAlign: 'center' }}>
            <Col>
                <Select size="large" value={year} options={options}
                    onChange={(newYear) => {
                        const now = value.clone().year(newYear);
                        onChange(now);
                    }}
                />
            </Col>
            <Col>
                <Select size="large" value={month} options={monthOptions}
                    onChange={(newMonth) => {
                        const now = value.clone().month(newMonth);
                        onChange(now);
                    }}
                />
            </Col>
        </Row>
    }
    return <div className="calendar-container">
        {/*  @ts-ignore */}
        <Calendar cellRender={cellRender} locale={{ lang: zhCN }} headerRender={({ value, onChange }) => headerContent(value, onChange)} />
        {DateCellModal(visible, currentDate!, setVisible, detailData, handleDel, handleUpdate, handleAdd)}
    </div>
}

function DateCellModal(
    visible: boolean,
    currentDate: Dayjs,
    setVisible: {
        (value: SetStateAction<boolean>): void;
        (arg0: boolean): void;
    },
    _list: IListDataEntity[],
    handleDel: (id: number) => void,
    handleUpdate: (id: number) => void,
    handleAdd: (v: { raw: Dayjs, type: BadgeProps['status'], content: string }) => void) {

    const value = useReactive<{ type: BadgeProps['status'] | undefined, content: string | undefined }>({
        content: undefined,
        type: undefined
    })

    useEffect(() => {
        if (!visible) {
            value.content = undefined
            value.type = undefined
        }
    }, [visible])

    return <Modal title={currentDate?.format('YYYY-MM-DD')} open={visible} onOk={() => setVisible(true)}
        onCancel={() => setVisible(false)} footer={null}>
        <div>
            {
                _list.map(item => <li key={item.id} style={{
                    display: 'flex', alignItems: 'center',
                    backgroundColor: StatusColorMap[item.type!],
                    justifyContent: 'space-between', height: '50px'
                }}>
                    <Badge status={item.type as BadgeProps['status']} text={item.content} />
                    <div>
                        <Button type="text" style={{ color: item?.improtant ? 'red' : 'gray' }} icon={<HeartFilled />}
                            onClick={() => Modal.confirm({
                                title: '提示',
                                content: `确定要${item?.improtant ? '取消' : ''}设置为重要事项？`,
                                onOk: () => handleUpdate(item.id)
                            })}
                        />
                        <Button type="text" danger onClick={() => Modal.confirm({
                            title: '提示',
                            content: '确定要删除此数据？',
                            onOk: () => handleDel(item.id),
                        })} >删除</Button>
                    </div>
                </li>)
            }
            <br />
            <li style={{ display: 'flex' }}>
                <Select value={value?.type}
                    options={["success", "processing", "error", "default", "warning"].map(status => ({
                        value: status,
                        label: <Badge status={status as BadgeProps['status']} />
                    }))}
                    optionRender={(({ value }) => <Badge key={value} status={value as BadgeProps['status']} />)}
                    onChange={v => value.type = v} />
                <Input value={value?.content} allowClear maxLength={28}
                    onChange={v => value.content = v.target.value}
                />
                <Button type="dashed" icon={<CheckOutlined style={{ color: '#52C41A' }} />} shape="circle"
                    onClick={() => {
                        if (value?.content && value?.type) {
                            // @ts-ignore
                            handleAdd({ ...value, raw: currentDate });
                            value.content = undefined
                            value.type = undefined

                        } else return message.warning('请输入内容')
                    }} />
                <Button type="dashed" onClick={() => {
                    value.content = undefined
                    value.type = undefined
                }} icon={<CloseOutlined style={{ color: '#FF4D4F' }} />} shape="circle" />
            </li>
        </div>
    </Modal>
}