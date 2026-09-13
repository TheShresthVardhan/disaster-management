import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="container-fluid px-3 px-md-4">
        <div className="row g-3">
          <div className="col-md-6">
            <p className="footer-copyright mb-0">
              &copy; {currentYear} Disastell. All rights reserved.
            </p>
          </div>
          <div className="col-md-6">
            <div className="footer-links d-flex flex-wrap justify-content-md-end gap-3">
              <Link to="/safety" className="footer-link">Safety Guidelines</Link>
              <Link to="/alerts" className="footer-link">Alert System</Link>
            </div>
          </div>
        </div>
        <div className="footer-tagline">
          AI-Powered Disaster Intelligence & Response
        </div>
      </div>
    </footer>
  );
}

export default Footer;