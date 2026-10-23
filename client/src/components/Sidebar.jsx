import { useApp } from '../context/AppContext';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Thermometer, Stethoscope,
  LogOut, BedDouble, BarChart2, Activity
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',     path: '/',            icon: LayoutDashboard },
  { label: 'Patients',      path: '/patients',    icon: Users },
  { label: 'Temperature',   path: '/temperature', icon: Thermometer },
  { label: 'Doctor Rounds', path: '/rounds',      icon: Stethoscope },
  { label: 'Discharge',     path: '/discharge',   icon: LogOut },
  { label: 'Room Map',      path: '/rooms',       icon: BedDouble },
  { label: 'Analytics',     path: '/analytics',   icon: BarChart2 },
];

export default function Sidebar() {
  const { currentRole, setCurrentRole, currentUser, stats } = useApp();

  const roleLabel = { nurse: 'Nurse Priya', doctor: 'Dr. Mehta', admin: 'Admin Suresh' }[currentRole];
  const roleInitial = roleLabel[0];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h1>
          <Activity size={18} style={{ color: 'var(--blue)' }} />
          QuarantineOS
        </h1>
        <p>Facility Management</p>
      </div>

      {/* Role Switcher */}
      <div className="role-switcher">
        {['nurse', 'doctor', 'admin'].map(r => (
          <button
            key={r}
            className={`role-btn ${currentRole === r ? 'active' : ''}`}
            onClick={() => setCurrentRole(r)}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} />
            <span style={{ flex: 1 }}>{label}</span>
            {label === 'Discharge'   && stats.readyForDischarge > 0 && (
              <span className="notif-count">{stats.readyForDischarge}</span>
            )}
            {label === 'Temperature' && stats.pendingTemp > 0 && (
              <span className="notif-count">{stats.pendingTemp}</span>
            )}
            {label === 'Doctor Rounds' && stats.pendingVisit > 0 && (
              <span className="notif-count">{stats.pendingVisit}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="role-badge">
          <div className="role-avatar">{roleInitial}</div>
          <div className="role-info">
            <p>{roleLabel}</p>
            <span>{currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}</span>
          </div>
          <span className="live-dot" style={{ marginLeft: 'auto' }} title="Online" />
        </div>
      </div>
    </aside>
  );
}
