/* eslint-disable no-console */
/* eslint-disable eqeqeq */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
// @ts-ignore
import alder32 from 'adler-32';
import { message, notification } from 'antd';
import { getProto } from '.';

export enum Disaster { // 灾害类型
    FIRE = 1,
    LANDSLIDE,
    MUDSLIDE,
    SUBSIDENCE,
    INTENSITY,
    FLASHFLOOD,
    WATERACCUM
}
type DisasterEntity = any;
type Quake = any;

const { setTimeout, setInterval, clearInterval, clearTimeout } = window;
const InitialConnectState = {
    timer: undefined as any as number, // 重连定时器
    count: 0, // 重连次数
    state: 0, // 断连类型，0正常，1重连中，2网络断开
};
const WS_URL = 'ws://8.140.175.191:5016/v1/ws';
interface Actions {
    pageChange: () => void;
    updateOne: (disaster: DisasterEntity) => void;
    processQuake: (quake: Quake) => void;
    updateRain: (type: 1 | 2) => void;
    syncData: () => void;
    refresh: () => void;
}

/**
 * @param account 当前账户密码
 * @param actions 更新model数据的函数
 */
export async function WebSocketManager(actions: Actions) {
    const {
        Authentication,
        Consequence,
        Heartbeat,
        Warning,
        Rain,
        Control,
        QuakeWarning,
    } = await getProto();
    let connectState = InitialConnectState;
    let NO_RECONNECT = false;
    let timer: number;
    let ws: WebSocket;
    function startWS() {
        ws = new WebSocket(WS_URL);
        ws.binaryType = 'arraybuffer';
        ws.onopen = () => {
            console.log(`websocket连接启动${WS_URL}`);
            const account = { account: 'admin', password: '123456aA' }
            // getLocalStorage('account') as Record<
            //     'account' | 'password',
            //     string
            // >;
            const data = Authentication.encode(
                Authentication.create({
                    account: account.account,
                    password: account.password,
                }),
            ).finish();
            ws.send(getFormattedBinaryFromBuffer('deliver.Authentication', data));
        };
        ws.onmessage = ({ data }) => {
            const { key, content } = getBufferFromFormattedBinary(data);
            if (content === undefined) return;
            switch (key) {
                case 'deliver.Consequence':
                    const { verdict, message: msg } = Consequence.toObject(
                        Consequence.decode(new Uint8Array(content)),
                    );
                    if (verdict) {
                        timer = setInterval(() => {
                            ws.send(
                                getFormattedBinaryFromBuffer(
                                    'deliver.Heartbeat',
                                    Heartbeat.encode(Heartbeat.create({})).finish(),
                                ),
                            );
                        }, 30000);
                        connectState.state !== 0 && message.destroy();
                        connectState = InitialConnectState;
                    } else {
                        notification.error({
                            duration: null,
                            message: '连接失败',
                            description: msg || 'websocket验证失败，请重新登录！',
                        });
                        // actions.logout();
                    }
                    break;
                case 'deliver.Warning':
                    const d = Warning.toObject(
                        Warning.decode(new Uint8Array(content)),
                    ) as DisasterEntity &
                        DisasterEntity['intensity'] &
                        DisasterEntity['waterAccum'];
                    console.log('Warning', d);
                    const {
                        eventType,
                        waterState = 0,
                        depth = 0,
                        startAt,
                        magnitude,
                        ...rest
                    } = d;
                    let disaster: DisasterEntity;
                    if (eventType === Disaster.INTENSITY) {
                        disaster = {
                            ...rest,
                            eventType,
                            intensity: { startAt, magnitude },
                        };
                    } else if (eventType === Disaster.WATERACCUM) {
                        disaster = {
                            ...rest,
                            eventType,
                            waterAccum: { waterState, depth },
                        };
                    } else disaster = { ...rest, eventType };
                    actions.updateOne(disaster);
                    break;
                case 'deliver.QuakeWarning':
                    // eslint-disable-next-line eqeqeq
                    if (window.location.pathname == '/login') {
                        return;
                    }
                    const quake = QuakeWarning.toObject(
                        QuakeWarning.decode(new Uint8Array(content)),
                        { defaults: true },
                    ) as Quake;
                    console.log('quake', quake);
                    quake.intensity = Number(quake.intensity.toFixed(1));
                    actions.processQuake(quake);
                    break;
                case 'deliver.Rain':
                    const rain = Rain.toObject(Rain.decode(new Uint8Array(content))) as {
                        type: 1 | 2;
                    };
                    actions.updateRain(rain.type);
                    break;
                case 'deliver.Control':
                    // 操作类型 1:下线 2:重新登录 3:刷新首页 4:项目配置更新
                    const { type, operation } = Control.toObject(
                        Control.decode(new Uint8Array(content)),
                    );
                    console.log(type, operation);
                    if (type === 1) {
                        switch (operation) {
                            case 1:
                                NO_RECONNECT = true;
                                ws.close();
                                break;
                            // case 2:
                            //     actions.logout();
                            //     break;
                            case 3:
                                actions.syncData();
                                break;
                            case 4:
                                actions.refresh();
                                break;
                            default:
                                break;
                        }
                    }
                    break;
                case 'deliver.Heartbeat':
                    actions.pageChange()
                    // console.log('deliver.Heartbeat')
                    break;
                default:
                    console.log('websocket收到未知类型消息');
                    break;
            }
        };
        ws.onclose = () => {
            clearInterval(timer);
            console.log('websocket连接已关闭');
            reconnect();
        };
        ws.onerror = () => {
            console.log('websocket连接发生错误');
        };
        // if (Notification.permission !== "granted") {
        //     Notification.requestPermission().then(permission => {
        //         permission === 'denied' && message.error('拒绝通知后不能及时推送系统通知，若有需求，请在浏览器设置中重新授权并刷新！')
        //     })
        // }
    }

    /**
     * 重连机制：间隔2^n秒重连,最大30秒;根据网络状态区分显示提示
     */
    function reconnect() {
        if (NO_RECONNECT) return;
        let { timer, count, state } = connectState;
        clearTimeout(timer);
        if (count > 4) {
            if (!navigator.onLine && state !== 2) {
                state === 1 && message.destroy();
                message.error('连接已断开，请检查网络连接！', 0);
                state = 2;
            } else if (state !== 1) {
                state === 2 && message.destroy();
                // @ts-ignore
                message.error('连接已断开，正在尝试重连...', 0);
                state = 1;
            }
        }
        timer = setTimeout(
            () => {
                console.log(`正在尝试第${connectState.count}次重连...`);
                startWS();
            },
            Math.min(30, 2 ** count++) * 1000,
        );
        connectState = { timer, count, state };
    }
    startWS();
    return () => {
        clearInterval(timer);
        clearTimeout(connectState.timer);
        connectState.state !== 0 && message.destroy();
        NO_RECONNECT = true;
        ws.close();
    };
}

/**
 *
 * @param key 字段名, 如 deliver.Heartbeat
 * @param data 原始二进制数据
 * @returns 格式化校验的Buffer
 */
function getFormattedBinaryFromBuffer(key: string, data: Uint8Array) {
    const nameLen = key.length;
    const dataLen = data.length;
    const fontArea = new ArrayBuffer(5);
    const fontAreaDataView = new DataView(fontArea);
    fontAreaDataView.setUint32(0, dataLen + nameLen + 5);
    fontAreaDataView.setUint8(4, nameLen);
    const verifyFields = concatArrayBuffer(
        new Uint8Array(fontArea),
        string2buffer(key),
        data,
    );
    const verifyArea = new ArrayBuffer(4);
    const verifyAreaDataView = new DataView(verifyArea);
    verifyAreaDataView.setUint32(0, alder32.buf(verifyFields));
    const buffers = concatArrayBuffer(verifyFields, new Uint8Array(verifyArea));
    return buffers.buffer;
}
/**
 *
 * @param data 服务器返回的、格式化校验的二进制数据
 */
function getBufferFromFormattedBinary(data: ArrayBuffer) {
    const len = data.byteLength;
    const dataview = new DataView(data);
    // const totalLen = dataview.getUint16(0)
    const nameLen = dataview.getUint8(4);
    const alder32Code = dataview.getUint32(len - 4);
    const keyArr = data.slice(5, 5 + nameLen);
    const content = data.slice(5 + nameLen, -4);
    const key = buffer2string(keyArr);
    // @ts-ignore
    if (alder32.buf(new Uint8Array(data.slice(0, -4)))[0] !== alder32Code[0]) {
        console.log('websocket收到验证失败的消息');
        return {};
    }
    return {
        key,
        content,
    };
}

export function string2buffer(str: string) {
    const val = Array.from(str).map((e) => e.charCodeAt(0));
    return new Uint8Array(val);
}

function buffer2string(ArrayBuffer: ArrayBuffer) {
    return String.fromCharCode.apply(
        null,
        new Uint8Array(ArrayBuffer) as unknown as Array<number>,
    );
}

function concatArrayBuffer(...typedArrays: Uint8Array[]) {
    const len = typedArrays.reduce((pre, cur) => pre + cur.length, 0);
    const result = new Uint8Array(len);
    for (let i = 0, offset = 0; i < typedArrays.length; i++) {
        const typedArray = typedArrays[i];
        result.set(typedArray, offset);
        offset += typedArray.length;
    }
    return result;
}
