import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ReportDisaster from './pages/ReportDisaster';
import DisasterMap from './pages/DisasterMap';
import Alerts from './pages/Alerts';
import SafetyInfo from './pages/SafetyInfo';
import EmergencySOS from './pages/EmergencySOS';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="report" element={<ReportDisaster />} />
          <Route path="map" element={<DisasterMap />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="safety" element={<SafetyInfo />} />
          <Route path="sos" element={<EmergencySOS />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;