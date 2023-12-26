import { useMemo } from "react"
import { Card } from "antd"
import useWebsocket from "../useWebsocket"
import WarningPage from "./Warning"
import HistoryListPage from "./HistoryList"
import DetailPage from "./Detail"

export default function HomeContent() {
    const { pageState, pageSetting } = useWebsocket()

    const content = useMemo(() => {
        switch (pageState) {
            case 'warning': return <WarningPage setting={pageSetting} />;
            case 'history': return <HistoryListPage setting={pageSetting} />;
            case 'alert': return <DetailPage setting={pageSetting} />;
            default: return <HistoryListPage setting={pageSetting} />
        }
    }, [pageState, pageSetting])

    return <Card className="content-container">{content}</Card>
}