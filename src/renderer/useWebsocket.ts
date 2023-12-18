/* eslint-disable promise/catch-or-return */
/* eslint-disable no-return-assign */
import { useEffect, useState } from "react";
import { WebSocketManager } from "./services/websocket";

export default function useWebsocket() {
  const [pageState, setPageState] = useState<number>()

  const pageChange = () => {
    const randomInt = getRandomIntInclusive(1, 3); // 生成1到6之间的随机整数

    console.log('pageChange', randomInt)
    setPageState(randomInt)
  }
  const processQuake = (a: any) => {
    console.log('processQuake', a)
  }
  const updateOne = (a: any) => {
    console.log('updateOne', a)
  }
  const updateRain = (a: any) => {
    console.log('updateRain', a)
  }
  const refresh = () => {
    console.log('refresh')
  }
  const syncData = () => {
    console.log('syncData')
  }


  useEffect(() => {
    let cleaner: () => void
    WebSocketManager({
      pageChange,
      processQuake,
      updateOne,
      updateRain,
      refresh,
      syncData
    }).then(cl => cleaner = cl)
    return () => cleaner?.()
  }, []);

  return { pageState }
}


// 生成[min, max]区间内的随机整数
function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
