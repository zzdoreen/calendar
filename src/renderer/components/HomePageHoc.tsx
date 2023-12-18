import { useMemo } from "react"
import { Card } from "antd"
import useWebsocket from "../useWebsocket"
import WarningPage from "./Warning"
import HistoryListPage from "./HistoryList"
import DetailPage from "./Detail"

export default function HomeContent() {
    const { pageState } = useWebsocket()

    const content = useMemo(() => {
        switch (pageState) {
            case 1: return <WarningPage />;
            case 2: return <HistoryListPage />;
            case 3: return <DetailPage />;
            default: return <DetailPage />
        }
    }, [pageState])

    // return <Card className="content-container"><WarningPage /></Card>
    return <Card className="content-container">{content}</Card>
}