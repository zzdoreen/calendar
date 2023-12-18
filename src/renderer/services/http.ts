import { message } from "antd";
import axios from "axios";

const instance = axios.create({
    timeout: 600000,
    headers: { 'Content-Type': 'application/json' },
    baseURL: '/'
})

instance.interceptors.request.use(config => {
    const { params = {} } = config
    config.params = { ...params, time: new Date().getTime() }

    // @ts-ignore
    config.headers = {
        ...(config.headers || {}),
        // 'X-Auth-Token': CookieStorage.token,
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50IjoiYWRtaW4iLCJleHAiOjE3MDI2NDc5NzksImlhdCI6MTcwMjYxOTE3OSwibmJmIjoxNzAyNjE5MTc5LCJwcm9qZWN0TnVtYmVyIjoibmVpamlhbmciLCJyb2xlSWQiOjF9.guOyZ2V_oCHAw8RkyRLKmDjgOCpFN35QjVUdHYNdywA',
        'X-Stargate-AppId': 25,
    }
    return config
}, err => { console.log('--', err) })

// 响应拦截器
instance.interceptors.response.use(response => {
    return Promise.resolve(response);
}, error => {
    // show error_msg and reject
    console.log('响应失败信息', error.response);

    if (error && error.response && error.response.status) {
        let errCode = 0;
        let errMsg = '';
        if (error.response.data) {
            const { status, errorMsg } = error.response.data;
            errCode = status;
            errMsg = errorMsg;
        }
        switch (error.response.status) {
            case 400:
                message.error(errMsg);
                break;
            case 401:
                // to login or authorize
                message.error(errMsg);
                // CookieStorage.clear();
                // window.location.href = '';
                break;
            case 403:
                // to login or authorize
                message.error(errMsg);
                // CookieStorage.clear();
                // window.location.href = '/';
                break;
            case 404:
                // request failed, no res on server
                message.error('系统错误，请稍候再试');
                break;
            case 500:
                // server error
                message.error(errMsg);
                break;
            default: console.log('not error', errCode);
        }
    }
    return Promise.reject(error);
}
);

export default instance;