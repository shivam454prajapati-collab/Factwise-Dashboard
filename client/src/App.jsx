import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard    from './pages/Dashboard';
import Patients     from './pages/Patients';
import Temperature  from './pages/Temperature';
import DoctorRounds from './pages/DoctorRounds';
import Discharge    from './pages/Discharge';
import RoomMap      from './pages/RoomMap';
import Analytics    from './pages/Analytics';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/patients"  element={<Patients />} />
              <Route path="/temperature" element={<Temperature />} />
              <Route path="/rounds"    element={<DoctorRounds />} />
              <Route path="/discharge" element={<Discharge />} />
              <Route path="/rooms"     element={<RoomMap />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-active)',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
}
