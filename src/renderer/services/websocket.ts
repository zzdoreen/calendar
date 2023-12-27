/* eslint-disable no-bitwise */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
/* eslint-disable eqeqeq */
/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
// @ts-ignore
import { message } from 'antd';
import { getProto } from '.';
import { PageType } from '../useWebsocket';

export enum Disaster { // 灾害类型
    FIRE = 1,
    LANDSLIDE,
    MUDSLIDE,
    SUBSIDENCE,
    INTENSITY,
    FLASHFLOOD,
    WATERACCUM
}

const { setTimeout, setInterval, clearInterval, clearTimeout } = window;
const InitialConnectState = {
    timer: undefined as any as number, // 重连定时器
    count: 0, // 重连次数
    state: 0, // 断连类型，0正常，1重连中，2网络断开
};
const WS_URL = 'ws://127.0.0.1:8086/masterpiece';
interface Actions {
    pageChange: (name?: PageType) => void;
    syncData: () => void;
    refresh: () => void;
    pageSettingChange: (type: string, value: string) => void
}

enum FunType {
    HEARTBEAT = 1,
    ORDER = 2,
    ORDERRESP = 3
}

export enum InstructType {
    RESET = 'reset',
    SETSCREEN = 'setScreen',
    SETTEXT = 'setText',
    SETICON = 'setIcon',
    SETCOLOR = 'setColor'
}

/**
 * @param account 当前账户密码
 * @param actions 更新model数据的函数
 */
export async function WebSocketManager(actions: Actions) {
    const {
        Order,
        OrderResp,
        Heartbeat,
    } = await getProto();
    let connectState = InitialConnectState;
    let NO_RECONNECT = false;
    let timer: number;
    let ws: WebSocket;
    function startWS() {
        ws = new WebSocket(
            WS_URL,
            // 'private'
        );
        ws.binaryType = 'arraybuffer';

        ws.onopen = (e) => {
            console.log(`websocket连接启动${WS_URL}`, e);
            // cmd: wmic csproduct get uuid
            // linux: sudo blkid
            const account = {
                uuid: 'BD31E74A-8DD3-11EA-BCDA-1889A8506500',
                service: 'mpdeamon',
                data: JSON.stringify({
                    method: "authorized",
                    id: "104567",
                    params: ["1", "1.0.0", "UI", 0],
                    jsonrpc: "2.0",
                })
            }
            const data = Order.encode(Order.create({ ...account })).finish();
            ws.send(getFormattedBinaryFromBuffer(FunType.ORDER, data))
            console.log('%c order send', 'color:green', data,)

            setTimeout(() => {
                ws.send(getFormattedBinaryFromBuffer(FunType.HEARTBEAT, Heartbeat.encode(Heartbeat.create({})).finish()))
                console.log('%c heartbeat send', 'color:red')
            }, 5000);
        };
        ws.onmessage = ({ data }) => {
            const { fnCode, payload } = getBufferFromFormattedBinary(data);

            console.log('onmessage',
                fnCode,
                payload,
                OrderResp.toObject(OrderResp.decode(new Uint8Array(payload))),
                Order.toObject(Order.decode(new Uint8Array(payload))),
                Heartbeat.toObject(Heartbeat.decode(new Uint8Array(payload))),
            )

            if (payload === undefined) return;
            switch (fnCode) {
                case FunType.ORDER:
                    const { data } = Order.toObject(Order.decode(new Uint8Array(payload)))
                    console.log('order', data);
                    break;
                case FunType.ORDERRESP:
                    const { uuid, data: { method, params = [] } } = OrderResp.toObject(OrderResp.decode(new Uint8Array(payload)))

                    console.log('orderResp', data, method, params, uuid)

                    switch (method) {
                        case InstructType.RESET: actions.refresh(); break
                        case InstructType.SETSCREEN:
                            params[0] && actions.pageChange(params[0]); break;
                        case InstructType.SETTEXT:
                        case InstructType.SETICON:
                        case InstructType.SETCOLOR:
                            params[1] && actions.pageSettingChange(method, params[1]); break;
                        default: console.log('.................');
                    }
                    break;
                case FunType.HEARTBEAT:
                    actions.pageChange()
                    timer = setInterval(() => {
                        ws.send(getFormattedBinaryFromBuffer(FunType.HEARTBEAT, Heartbeat.encode(Heartbeat.create({})).finish()))
                    }, 60000)
                    // connectState.state !== 0 && message.destroy()
                    // connectState = InitialConnectState
                    console.log('Heartbeat')
                    break;
                default:
                    console.log('websocket收到未知类型消息');
                    break;
            }
        };
        ws.onclose = () => {
            clearInterval(timer);
            console.log('websocket连接已关闭');
            // startWS()
            // reconnect();
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
     * 重连机制：间隔2^n秒重连,最大60秒;根据网络状态区分显示提示
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
            Math.min(60, 2 ** count++) * 1000,
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
 * @param key 字段名, 如 Heartbeat
 * @param data 原始二进制数据
 * @returns 格式化校验的Buffer
 */
/* function getFormattedBinaryFromBuffer(key: string, data: Uint8Array) {
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
} */
/**
 *
 * @param data 服务器返回的、格式化校验的二进制数据
 */
/* function getBufferFromFormattedBinary(data: ArrayBuffer) {
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
 */


/**
 *
 * @param key 字段名, 如 Heartbeat
 * @param data 原始二进制数据
 * @returns 格式化校验的Buffer
 */
function getFormattedBinaryFromBuffer(code: FunType, data: Uint8Array) {
    const dataLen = data.length;
    const fontArea = new ArrayBuffer(6);
    const fontAreaDataView = new DataView(fontArea);
    fontAreaDataView.setUint16(0, 0x6d37);
    fontAreaDataView.setUint8(2, 0x00);
    fontAreaDataView.setUint8(3, code);
    fontAreaDataView.setUint16(4, dataLen);
    const verifyFields = concatArrayBuffer(
        new Uint8Array(fontArea),
        data,
    );
    const hexString = Array.from(verifyFields).map(b => b.toString(16).padStart(2, '0')).join('');
    const crc = calculateCRC16Modbus(hexString)
    const arr = [`0x${crc.slice(0, 2)}`, `0x${crc.slice(2, 4)}`].map(a => Number(a))
    const buffers = concatArrayBuffer(verifyFields, new Uint8Array(arr));

    return buffers.buffer;
}

/**
 *
 * @param data 服务器返回的、格式化校验的二进制数据
 */
function getBufferFromFormattedBinary(data: ArrayBuffer) {
    const len = data.byteLength;
    // const dataview = new DataView(data);
    // const alder32Code = dataview.getUint32(len - 1);
    const keyArr = data.slice(3, 4);
    const payload = data.slice(6, len - 2);
    const fnCode = buffer2string(keyArr)?.charCodeAt(0);
    // @ts-ignore

    return {
        fnCode,
        payload,
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

function calculateCRC16Modbus(dataHexString: string) {
    const dataBytes = [];
    for (let i = 0; i < dataHexString.length; i += 2) {
        dataBytes.push(parseInt(dataHexString.substr(i, 2), 16));
    }

    let crc = 0xFFFF;
    const polynomial = 0xA001;  // This is the polynomial x^16 + x^15 + x^2 + 1

    for (const byte of dataBytes) {
        // eslint-disable-next-line no-bitwise
        crc ^= byte;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x0001)
                crc = ((crc >> 1) ^ polynomial) & 0xFFFF;
            else
                crc >>= 1;
        }
    }
    return crc.toString(16)
}