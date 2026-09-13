import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ReportDisaster from './pages/ReportDisaster';
import DisasterMap from './pages/DisasterMap';
import Resources from './pages/Resources';
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
          <Route path="resources" element={<Resources />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="safety" element={<SafetyInfo />} />
          <Route path="sos" element={<EmergencySOS />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <div style={{ fontSize: '3rem' }} aria-hidden="true">🧭</div>
      <h1 className="h3 fw-bold mt-3">Page not found</h1>
      <p className="text-muted">This demo has no page at that address.</p>
      <Link className="btn btn-primary" to="/">Back to Dashboard</Link>
    </div>
  );
}

export default App;