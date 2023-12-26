/* eslint-disable promise/catch-or-return */
/* eslint-disable no-return-assign */
import { useEffect, useState } from "react";
import { WebSocketManager } from "./services/websocket";

export type PageType = 'warning' | 'history' | 'alert'

export default function useWebsocket() {
  const [pageState, setPageState] = useState<PageType>()
  const [pageSetting, setPageSetting] = useState({})

  const pageChange = (name: PageType = 'history') => setPageState(name)

  const refresh = () => {
    setPageState('history');
    setPageSetting({})
  }

  const syncData = () => console.log('syncData')

  const pageSettingChange = (type: string, value: string) => setPageSetting(v => ({ ...v, [type]: value }))


  useEffect(() => {
    let cleaner: () => void
    WebSocketManager({
      pageChange,
      refresh,
      syncData,
      pageSettingChange
    }).then(cl => cleaner = cl)
    return () => cleaner?.()
  }, []);

  return { pageState, pageSetting }
}
