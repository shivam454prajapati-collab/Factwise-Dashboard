import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { Users, Thermometer, Stethoscope, LogOut, BedDouble, CheckCircle, Activity, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { stats, patients, currentRole, hasTempToday, hasDoctorVisitToday,
          isDischargeReady, getLatestTempForDate, today, FEVER_THRESHOLD } = useApp();

  const active = patients.filter(p => p.status === 'active');
  const noTempYet      = active.filter(p => !hasTempToday(p._id));
  const noVisitYet     = active.filter(p => !hasDoctorVisitToday(p._id));
  const readyDischarge = active.filter(p => isDischargeReady(p._id) && !p.dischargeApproved);
  const mortalityAlert = parseFloat(stats.mortalityRate) > 15;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Dashboard</h2>
          <p>{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 'var(--r)', fontSize: '0.78rem', color: 'var(--green)', fontWeight: 600 }}>
          <span className="live-dot" /> Live
        </div>
      </div>

      {/* Mortality Alert */}
      {mortalityAlert && (
        <div className="alert-banner danger">
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div><strong>Mortality Rate Alert:</strong> Current rate {stats.mortalityRate}% exceeds the 15% benchmark. Immediate clinical review is recommended.</div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Active Patients', value: stats.activePatients, sub: `${stats.occupancyRate}% occupancy · ${stats.availableBeds} beds free`, color: 'blue', icon: <Users size={18} /> },
          { label: 'Discharged', value: stats.dischargedPatients, sub: `Recovery rate: ${stats.recoveryRate}%`, color: 'green', icon: <CheckCircle size={18} /> },
          { label: 'Mortality Rate', value: `${stats.mortalityRate}%`, sub: `Benchmark ≤ 15% · ${stats.deceasedPatients} deceased`, color: mortalityAlert ? 'red' : 'yellow', icon: <Activity size={18} /> },
          { label: 'Fever Today', value: stats.hasFeverToday, sub: 'Patients with active fever', color: 'red', icon: <Thermometer size={18} /> },
          { label: 'Ready to Discharge', value: stats.readyForDischarge, sub: `${stats.approvedForDischarge} doctor-approved`, color: 'purple', icon: <LogOut size={18} /> },
          { label: 'Available Beds', value: stats.availableBeds, sub: 'of 74 total beds', color: 'teal', icon: <BedDouble size={18} /> },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon-wrap ${s.color}`}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Today's Progress */}
      <div className="grid-2" style={{ marginBottom: 18 }}>
        {/* Temp */}
        <div className="card">
          <div className="section-title"><Thermometer size={15} style={{ color: 'var(--blue)' }} /> Temperature Checks Today</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{stats.tempRecordedToday} / {stats.activePatients} recorded</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--blue)' }}>
              {stats.activePatients > 0 ? Math.round((stats.tempRecordedToday / stats.activePatients) * 100) : 0}%
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 14 }}>
            <div className="progress-fill blue" style={{ width: `${stats.activePatients > 0 ? (stats.tempRecordedToday / stats.activePatients) * 100 : 0}%` }} />
          </div>
          {noTempYet.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: '0.82rem', fontWeight: 600 }}>
              <CheckCircle size={14} /> All patients checked
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Pending ({noTempYet.length})
              </div>
              {noTempYet.slice(0, 5).map(p => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--yellow)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Room {p.room}</span>
                </div>
              ))}
              {noTempYet.length > 5 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 8 }}>+{noTempYet.length - 5} more</div>}
            </div>
          )}
        </div>

        {/* Doctor rounds */}
        <div className="card">
          <div className="section-title"><Stethoscope size={15} style={{ color: 'var(--green)' }} /> Doctor Rounds Today</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{stats.doctorVisitedToday} / {stats.activePatients} visited</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--green)' }}>
              {stats.activePatients > 0 ? Math.round((stats.doctorVisitedToday / stats.activePatients) * 100) : 0}%
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 14 }}>
            <div className="progress-fill green" style={{ width: `${stats.activePatients > 0 ? (stats.doctorVisitedToday / stats.activePatients) * 100 : 0}%` }} />
          </div>
          {noVisitYet.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: '0.82rem', fontWeight: 600 }}>
              <CheckCircle size={14} /> All patients visited
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Not yet visited ({noVisitYet.length})
              </div>
              {noVisitYet.slice(0, 5).map(p => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Room {p.room}</span>
                  {!hasTempToday(p._id) && <span className="badge badge-yellow">No Temp</span>}
                </div>
              ))}
              {noVisitYet.length > 5 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 8 }}>+{noVisitYet.length - 5} more</div>}
            </div>
          )}
        </div>
      </div>

      {/* Ready for Discharge */}
      {readyDischarge.length > 0 && (
        <div className="card" style={{ border: '1px solid var(--purple-border)', background: 'var(--purple-bg)' }}>
          <div className="section-title" style={{ color: 'var(--purple)' }}>
            <LogOut size={15} /> Patients Ready for Discharge ({readyDischarge.length})
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th><th>Room</th><th>Fever-Free Days</th><th>Last Temp</th>
                </tr>
              </thead>
              <tbody>
                {readyDischarge.map(p => {
                  const rec = getLatestTempForDate(p._id, today());
                  return (
                    <tr key={p._id} style={{ background: 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge badge-gray">Room {p.room}</span></td>
                      <td>
                        <div className="fever-dots">
                          {[0,1,2].map(i => <div key={i} className="fever-dot clear" />)}
                          <span style={{ fontSize: '0.72rem', color: 'var(--green)', marginLeft: 5, fontWeight: 600 }}>3 days</span>
                        </div>
                      </td>
                      <td>{rec ? <span className="temp-indicator normal">✓ {rec.temp}°C</span> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
