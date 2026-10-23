import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Search, Plus, X, User, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import PatientDetail from '../components/PatientDetail';

export default function Patients() {
  const { patients, addPatient, currentRole, isDischargeReady, hasTempToday,
          hasDoctorVisitToday, getLatestTempForDate, today, FEVER_THRESHOLD } = useApp();

  const [search, setSearch]     = useState('');
  const [filterStatus, setStatus] = useState('active');
  const [showAdd, setShowAdd]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name:'', age:'', gender:'Male', room:'', bloodType:'O+',
    contactName:'', contactPhone:'', notes:'',
  });

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.room||'').includes(search);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.room.trim()) { toast.error('Name and room are required'); return; }
    const roomTaken = patients.find(p => p.room === form.room && p.status === 'active');
    if (roomTaken) { toast.error(`Room ${form.room} is already occupied`); return; }
    addPatient({ ...form, age: parseInt(form.age) || 0 });
    toast.success(`${form.name} admitted`);
    setShowAdd(false);
    setForm({ name:'', age:'', gender:'Male', room:'', bloodType:'O+', contactName:'', contactPhone:'', notes:'' });
  };

  const statusBadge = { active: 'badge-blue', discharged: 'badge-green', deceased: 'badge-red' };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Patients</h2>
          <p>{patients.filter(p => p.status === 'active').length} active · {patients.length} total</p>
        </div>
        {(currentRole === 'admin' || currentRole === 'nurse') && (
          <button className="btn btn-primary" id="admit-patient-btn" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Admit Patient
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Search name or room…" value={search} onChange={e => setSearch(e.target.value)} id="patient-search" />
        </div>
        {['all','active','discharged','deceased'].map(s => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Room</th><th>Admitted</th><th>Days</th>
                <th>Status</th><th>Today's Temp</th><th>Fever-Free</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state"><User size={36} /><h3>No patients found</h3><p>Adjust your filters</p></div>
                </td></tr>
              ) : filtered.map(p => {
                const days   = differenceInDays(new Date(), parseISO(p.admitDate));
                const rec    = getLatestTempForDate(p._id, today());
                const fever  = rec && rec.temp >= FEVER_THRESHOLD;
                const ready  = isDischargeReady(p._id);
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{p.age}y · {p.gender} · {p.bloodType}</div>
                    </td>
                    <td>{p.room ? <span className="badge badge-gray">Room {p.room}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{format(parseISO(p.admitDate), 'd MMM yyyy')}</td>
                    <td style={{ fontWeight: 600 }}>{days}d</td>
                    <td>
                      <span className={`badge ${statusBadge[p.status]}`}>{p.status}</span>
                      {p.status === 'active' && ready && <span className="badge badge-purple" style={{ marginLeft: 4 }}>Discharge Ready</span>}
                    </td>
                    <td>
                      {rec ? (
                        <span className={`temp-indicator ${fever ? 'fever' : 'normal'}`}>{rec.temp}°C</span>
                      ) : p.status === 'active' ? (
                        <span className="badge badge-yellow">Pending</span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {p.status === 'active' ? (
                        <div className="fever-dots">
                          {[2,1,0].map(d => {
                            const r2 = getLatestTempForDate(p._id, format(new Date(Date.now() - d * 86400000), 'yyyy-MM-dd'));
                            const cls = !r2 ? 'empty' : r2.temp >= FEVER_THRESHOLD ? 'fever' : 'clear';
                            return <div key={d} className={`fever-dot ${cls}`} title={`${d===0?'Today':d+'d ago'}: ${r2?r2.temp+'°C':'No reading'}`} />;
                          })}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelected(p)} id={`view-patient-${p._id}`}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Admit New Patient</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" id="new-patient-name" placeholder="Patient name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" id="new-patient-age" placeholder="Age" value={form.age} onChange={e => setForm({...form, age: e.target.value})} min={0} max={120} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Type</label>
                  <select className="form-select" value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})}>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Room Number *</label>
                <input className="form-input" id="new-patient-room" placeholder="e.g. 21" value={form.room} onChange={e => setForm({...form, room: e.target.value})} required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input className="form-input" placeholder="Contact name" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input className="form-input" placeholder="+91 XXXXXXXXXX" value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Notes</label>
                <textarea className="form-textarea" placeholder="Any observations…" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="submit-admit-btn"><Plus size={14} /> Admit Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && <PatientDetail patient={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
