import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Stethoscope, Search, CheckCircle, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorRounds() {
  const { patients, recordDoctorVisit, hasDoctorVisitToday, hasTempToday,
          getPatientVisits, currentRole, currentUser, today, getLatestTempForDate, FEVER_THRESHOLD } = useApp();

  const active = patients.filter(p => p.status === 'active');
  const [search, setSearch] = useState('');
  const [filterPending, setFP] = useState(false);
  const [showModal, setModal] = useState(false);
  const [selPat, setSelPat] = useState(null);
  const [form, setForm] = useState({ prescription: '', notes: '' });

  const filtered = active.filter(p => {
    const matchS = p.name.toLowerCase().includes(search.toLowerCase()) || (p.room||'').includes(search);
    return matchS && (!filterPending || !hasDoctorVisitToday(p._id));
  });

  const openVisit = (p) => {
    setSelPat(p);
    const last = getPatientVisits(p._id)[0];
    setForm({ prescription: last?.prescription || '', notes: '' });
    setModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    recordDoctorVisit(selPat._id, form.prescription, form.notes, 'Dr. Mehta');
    toast.success(`Visit recorded for ${selPat.name}`);
    setModal(false);
  };

  const done  = active.filter(p => hasDoctorVisitToday(p._id)).length;
  const total = active.length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Doctor Rounds</h2>
          <p>{done} of {total} patients visited today</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.875rem' }}>Today's Rounds</span>
          <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.875rem' }}>{done}/{total} · {total > 0 ? Math.round((done/total)*100) : 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill green" style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }} />
        </div>
        {done === total && total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', marginTop: 10, fontSize: '0.82rem', fontWeight: 600 }}>
            <CheckCircle size={14} /> All patients visited
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} id="rounds-search" />
        </div>
        <button className={`btn btn-sm ${filterPending ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFP(!filterPending)}>
          {filterPending ? 'Not Yet Visited' : 'All Patients'}
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Patient</th><th>Room</th><th>Temp Today</th><th>Visit Status</th><th>Last Prescription</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><Stethoscope size={36} /><h3>No patients</h3></div></td></tr>
              ) : filtered.map(p => {
                const visited   = hasDoctorVisitToday(p._id);
                const tempDone  = hasTempToday(p._id);
                const rec       = getLatestTempForDate(p._id, today());
                const fever     = rec && rec.temp >= FEVER_THRESHOLD;
                const visits    = getPatientVisits(p._id);
                const lastVisit = visits[0];

                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.age}y · {p.gender}</div>
                    </td>
                    <td><span className="badge badge-gray">Room {p.room}</span></td>
                    <td>
                      {rec
                        ? <span style={{ fontWeight: 600, color: fever ? 'var(--red)' : 'var(--green)', fontSize: '0.875rem' }}>{rec.temp}°C</span>
                        : <span className="badge badge-yellow">No Reading</span>}
                    </td>
                    <td>
                      {visited ? (
                        <div>
                          <span className="badge badge-green">Visited</span>
                          {lastVisit && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>{lastVisit.doctorName} · {lastVisit.time}</div>}
                        </div>
                      ) : (
                        <div>
                          <span className="badge badge-red">Pending</span>
                          {!tempDone && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--yellow)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle size={10} /> No temperature yet
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: 180, fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastVisit?.prescription || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {currentRole === 'doctor' ? (
                        <button
                          className={`btn btn-sm ${visited ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => openVisit(p)}
                          id={`visit-btn-${p._id}`}
                          disabled={!tempDone && !visited}
                          title={!tempDone && !visited ? 'Record temperature first' : ''}
                        >
                          <Stethoscope size={12} /> {visited ? 'Update' : 'Record Visit'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Doctor only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selPat && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Record Doctor Visit</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 'var(--r)', marginBottom: 18, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{selPat.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Room {selPat.room} · {selPat.age}y</div>
              {(() => {
                const rec = getLatestTempForDate(selPat._id, today());
                return rec ? (
                  <div style={{ marginTop: 6, fontWeight: 600, fontSize: '0.82rem', color: rec.temp >= FEVER_THRESHOLD ? 'var(--red)' : 'var(--green)' }}>
                    Today's temp: {rec.temp}°C
                  </div>
                ) : (
                  <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle size={12} /> Temperature not yet recorded
                  </div>
                );
              })()}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Prescription / Treatment *</label>
                <textarea className="form-textarea" placeholder="e.g. Paracetamol 500mg every 6hrs…"
                  value={form.prescription} onChange={e => setForm({...form, prescription: e.target.value})}
                  id="prescription-input" required style={{ minHeight: 100 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea className="form-textarea" placeholder="Patient condition, observations…"
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} id="visit-notes-input" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="submit-visit-btn"><Stethoscope size={14} /> Save Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
