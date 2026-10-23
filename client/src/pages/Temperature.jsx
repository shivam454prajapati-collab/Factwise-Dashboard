import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Thermometer, Search, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Temperature() {
  const { patients, recordTemperature, hasTempToday, getLatestTempForDate,
          today, FEVER_THRESHOLD, currentRole, currentUser } = useApp();

  const active = patients.filter(p => p.status === 'active');
  const [search, setSearch]   = useState('');
  const [showModal, setModal] = useState(false);
  const [selPat, setSelPat]   = useState(null);
  const [temp, setTemp]       = useState('');
  const [note, setNote]       = useState('');
  const [filterPending, setFP] = useState(false);

  const filtered = active.filter(p => {
    const matchS = p.name.toLowerCase().includes(search.toLowerCase()) || (p.room||'').includes(search);
    return matchS && (!filterPending || !hasTempToday(p._id));
  });

  const openModal = (p) => { setSelPat(p); setTemp(''); setNote(''); setModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const t = parseFloat(temp);
    if (isNaN(t) || t < 34 || t > 43) { toast.error('Enter a valid temperature (34–43°C)'); return; }
    const nurseName = currentRole === 'nurse' ? currentUser.nurse : 'Doctor';
    recordTemperature(selPat._id, t, note, nurseName);
    t >= FEVER_THRESHOLD
      ? toast.error(`Fever recorded: ${t}°C for ${selPat.name}`)
      : toast.success(`Temperature ${t}°C recorded for ${selPat.name}`);
    setModal(false);
  };

  const done  = active.filter(p => hasTempToday(p._id)).length;
  const total = active.length;

  const tempColor = (t) => {
    if (t >= 39)           return 'var(--orange)';
    if (t >= FEVER_THRESHOLD) return 'var(--red)';
    return 'var(--green)';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Temperature Recording</h2>
          <p>{done} of {total} patients checked today</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.875rem' }}>Daily Progress</span>
          <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: '0.875rem' }}>
            {done}/{total} &middot; {total > 0 ? Math.round((done/total)*100) : 0}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill blue" style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }} />
        </div>
        {done === total && total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', marginTop: 10, fontSize: '0.82rem', fontWeight: 600 }}>
            <CheckCircle size={14} /> All patients checked today
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Search patient or room…" value={search} onChange={e => setSearch(e.target.value)} id="temp-search" />
        </div>
        <button className={`btn btn-sm ${filterPending ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFP(!filterPending)}>
          {filterPending ? 'Pending Only' : 'All Patients'}
        </button>
      </div>

      {/* Patient Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filtered.map(p => {
          const rec   = getLatestTempForDate(p._id, today());
          const done  = hasTempToday(p._id);
          const fever = rec && rec.temp >= FEVER_THRESHOLD;

          return (
            <div key={p._id} className="card" style={{
              padding: '18px',
              borderColor: done ? (fever ? 'var(--red-border)' : 'var(--green-border)') : 'var(--border)',
              transition: 'all 0.2s',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Room {p.room} · {p.age}y</div>
                </div>
                {done
                  ? <span className={`badge ${fever ? 'badge-red' : 'badge-green'}`}>{fever ? 'Fever' : 'Normal'}</span>
                  : <span className="badge badge-yellow animate-pulse">Pending</span>}
              </div>

              {/* Temp Display */}
              <div style={{
                textAlign: 'center', padding: '14px 0',
                borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 14,
                background: 'var(--bg-soft)', borderRadius: 'var(--r-sm)',
              }}>
                {rec ? (
                  <>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: tempColor(rec.temp), lineHeight: 1 }}>{rec.temp}°C</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>
                      {rec.time} · {rec.recordedBy}
                    </div>
                    {rec.note && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3, fontStyle: 'italic' }}>"{rec.note}"</div>}
                  </>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '6px 0' }}>
                    No reading today
                  </div>
                )}
              </div>

              {(currentRole === 'nurse' || currentRole === 'doctor') ? (
                <button
                  className={`btn btn-sm ${done ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => openModal(p)}
                  id={`record-temp-${p._id}`}
                >
                  <Thermometer size={13} /> {done ? 'Re-record' : 'Record Temperature'}
                </button>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>Nurse / Doctor only</div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state"><Thermometer size={40} /><h3>No patients found</h3></div>
      )}

      {/* Modal */}
      {showModal && selPat && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Record Temperature</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 'var(--r)', marginBottom: 18, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{selPat.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Room {selPat.room} · {selPat.age}y · {selPat.gender}</div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Temperature (°C) *</label>
                <input
                  className="form-input"
                  type="number" step="0.1" min="34" max="43"
                  placeholder="e.g. 38.5"
                  value={temp} onChange={e => setTemp(e.target.value)}
                  id="temp-input" required autoFocus
                  style={{ fontSize: '1.4rem', fontWeight: 700, textAlign: 'center' }}
                />
                {temp && (
                  <div style={{
                    marginTop: 8, textAlign: 'center', fontSize: '0.82rem', fontWeight: 600,
                    color: parseFloat(temp) >= FEVER_THRESHOLD ? 'var(--red)' : 'var(--green)',
                    padding: '6px', borderRadius: 'var(--r-sm)',
                    background: parseFloat(temp) >= FEVER_THRESHOLD ? 'var(--red-bg)' : 'var(--green-bg)',
                  }}>
                    {parseFloat(temp) >= FEVER_THRESHOLD ? '⚠ Fever detected' : '✓ Normal temperature'}
                    {parseFloat(temp) >= 39 && ' — High fever!'}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <textarea className="form-textarea" placeholder="Observations…" value={note} onChange={e => setNote(e.target.value)} style={{ minHeight: 60 }} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="submit-temp-btn"><Thermometer size={14} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
