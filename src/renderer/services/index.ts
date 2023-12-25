import protobuf from 'protobufjs';
// @ts-ignore
import file from '../../../assets/protobuf/proto.proto'
import http from './http';

/**
 * 获取protobuf类型对象
 */
let proto: {
    [key: string]: protobuf.Type
}
// eslint-disable-next-line import/prefer-default-export
export async function getProto() {
    if (proto) return proto

    return protobuf.load(file).then(() => {
        const {

            mqtt: {
                Order,
                OrderResp,
                Heartbeat
            }

        } = file || {}
        // const Authentication = root.lookupType("deliver.Authentication")
        // const Consequence = root.lookupType("deliver.Consequence")
        // const Heartbeat = root.lookupType("deliver.Heartbeat")
        // const Warning = root.lookupType("deliver.Warning")
        // const Rain = root.lookupType("deliver.Rain")
        // const Control = root.lookupType("deliver.Control")
        // const Rainfall = root.lookupType("deliver.Rainfall")
        // const CmdResp = root.lookupType("com.huania.alien.mqtt.CmdResp")

        // eslint-disable-next-line no-return-assign
        return proto = {
            Order,
            OrderResp,
            Heartbeat,
        }
    })
}

export function commonRequest(path: string, params: any = {}, method: string = 'get') {
    if (method === 'post')
        return http.post(path, params).then(res => res?.data)
    return http.get(path, { params }).then(res => res?.data)
}