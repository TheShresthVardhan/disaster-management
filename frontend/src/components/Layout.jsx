import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { IncidentProvider } from '../context/IncidentContext';
import { ThemeProvider } from '../context/ThemeContext';
import './Layout.css';

function Layout() {
  return (
    <ThemeProvider>
      <IncidentProvider>
        <div className="app-layout">
          <Header />
          <main className="main-content" role="main">
            <div className="container-fluid px-3 px-md-4 py-4">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </IncidentProvider>
    </ThemeProvider>
  );
}

export default Layout;