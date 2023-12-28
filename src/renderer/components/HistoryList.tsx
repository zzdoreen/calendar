import { Table } from "antd";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HistoryListPage({ setting }: any) {
    const columns = [
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '年龄',
            dataIndex: 'age',
            key: 'age',
        },
        {
            title: '住址',
            dataIndex: 'address',
            key: 'address',
        },
    ]

    return <Table dataSource={[]} columns={columns}
        scroll={{ y: 'calc(100vh - 150px)' }}
        pagination={{
            pageSize: 50,
            showSizeChanger: false,
            simple: true,
            total: 150
        }} />
}