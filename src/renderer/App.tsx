import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { ConfigProvider } from 'antd';
import zhCN from "antd/locale/zh_CN";
import Home from './components/HomePageHoc';

export default function App() {

  return <ConfigProvider locale={zhCN}>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  </ConfigProvider>
}
