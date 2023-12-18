import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect } from 'react';
import HomeContent from './components/HomePageHoc';
import { commonRequest } from './services';

export default function App() {
  useEffect(() => {
    commonRequest('/v1/disasters/realtime', { hours: 0 })
      .then(res => console.log(res))
      .catch(e => { console.log('cath', e) })

  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeContent />} />
      </Routes>
    </Router>
  );
}
