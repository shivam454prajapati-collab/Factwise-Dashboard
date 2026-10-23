import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO, differenceInDays } from 'date-fns';
import { LogOut, CheckCircle, X, Skull } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Discharge() {
  const { patients, isDischargeReady, getFeverFreeDays, approveDischarge,
          confirmDischarge, markDeceased, currentRole, getLatestTempForDate, today, FEVER_THRESHOLD } = useApp();

  const active     = patients.filter(p => p.status === 'active');
  const discharged = patients.filter(p => p.status === 'discharged');
  const deceased   = patients.filter(p => p.status === 'deceased');

  const readyNotApproved = active.filter(p => isDischargeReady(p._id) && !p.dischargeApproved);
  const approved         = active.filter(p => p.dischargeApproved);

  const [confirmPat, setConfirmPat]   = useState(null);
  const [confirmType, setConfirmType] = useState('');

  const handleApprove = (p) => {
    approveDischarge(p._id);
    toast.success(`Discharge approved for ${p.name}`);
  };

  const handleConfirm = () => {
    if (confirmType === 'discharge') {
      confirmDischarge(confirmPat._id);
      toast.success(`${confirmPat.name} has been discharged`);
    } else {
      markDeceased(confirmPat._id);
      toast.error(`${confirmPat.name} marked as deceased`);
    }
    setConfirmPat(null);
  };

  const FeverDots = ({ patientId }) => {
    const days = getFeverFreeDays(patientId);
    return (
      <div className="fever-dots">
        {[1,2,3].map(i => <div key={i} className={`fever-dot ${i <= days ? 'clear' : 'empty'}`} />)}
        <span style={{ fontSize: '0.72rem', marginLeft: 5, fontWeight: 600, color: days >= 3 ? 'var(--green)' : 'var(--text-muted)' }}>
          {days}/3 days
        </span>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Discharge Management</h2>
          <p>3-day fever-free discharge criterion</p>
        </div>
      </div>

      <div className="alert-banner info" style={{ marginBottom: 20 }}>
        <CheckCircle size={15} style={{ flexShrink: 0 }} />
        <div>A patient is eligible for discharge after <strong>3 consecutive fever-free days</strong> (temp below {FEVER_THRESHOLD}°C with daily readings).</div>
      </div>

      {/* Ready — Doctor to Approve */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)' }} />
          Awaiting Doctor Approval
          {readyNotApproved.length > 0 && <span className="badge badge-purple" style={{ marginLeft: 4 }}>{readyNotApproved.length}</span>}
        </div>
        <div className="card" style={{ padding: 0 }}>
          {readyNotApproved.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}><CheckCircle size={28} /><h3>No pending approvals</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Patient</th><th>Room</th><th>Days Admitted</th><th>Fever-Free</th><th>Last Temp</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {readyNotApproved.map(p => {
                    const days = differenceInDays(new Date(), parseISO(p.admitDate));
                    const rec  = getLatestTempForDate(p._id, today());
                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.age}y · {p.gender}</div>
                        </td>
                        <td><span className="badge badge-gray">Room {p.room}</span></td>
                        <td style={{ fontWeight: 600 }}>{days}d</td>
                        <td><FeverDots patientId={p._id} /></td>
                        <td>{rec ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>{rec.temp}°C</span> : '—'}</td>
                        <td>
                          {currentRole === 'doctor' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-success btn-sm" id={`approve-${p._id}`} onClick={() => handleApprove(p)}>
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button className="btn btn-danger btn-sm" id={`deceased-${p._id}`} onClick={() => { setConfirmPat(p); setConfirmType('deceased'); }}>
                                <Skull size={12} /> Deceased
                              </button>
                            </div>
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
          )}
        </div>
      </div>

      {/* Approved — Admin to Confirm */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          Awaiting Admin Confirmation
          {approved.length > 0 && <span className="badge badge-green" style={{ marginLeft: 4 }}>{approved.length}</span>}
        </div>
        <div className="card" style={{ padding: 0 }}>
          {approved.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}><CheckCircle size={28} /><h3>No pending confirmations</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Patient</th><th>Room</th><th>Approved On</th><th>Action</th></tr></thead>
                <tbody>
                  {approved.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.age}y · {p.gender}</div>
                      </td>
                      <td><span className="badge badge-gray">Room {p.room}</span></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.dischargeApprovedDate}</td>
                      <td>
                        {currentRole === 'admin' ? (
                          <button className="btn btn-primary btn-sm" id={`discharge-${p._id}`} onClick={() => { setConfirmPat(p); setConfirmType('discharge'); }}>
                            <LogOut size={12} /> Confirm Discharge
                          </button>
                        ) : (
                          <span className="badge badge-green">Doctor approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)', marginBottom: 10 }}>
          Discharge History ({discharged.length + deceased.length})
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Patient</th><th>Admitted</th><th>Discharged</th><th>Duration</th><th>Outcome</th></tr></thead>
              <tbody>
                {[...discharged, ...deceased]
                  .sort((a,b) => (b.dischargeDate||'').localeCompare(a.dischargeDate||''))
                  .map(p => {
                    const dur = p.dischargeDate ? differenceInDays(parseISO(p.dischargeDate), parseISO(p.admitDate)) : '—';
                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.age}y · {p.gender}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{format(parseISO(p.admitDate), 'd MMM yyyy')}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.dischargeDate ? format(parseISO(p.dischargeDate), 'd MMM yyyy') : '—'}</td>
                        <td style={{ fontWeight: 600 }}>{dur}d</td>
                        <td><span className={`badge ${p.status === 'discharged' ? 'badge-green' : 'badge-red'}`}>{p.status === 'discharged' ? 'Recovered' : 'Deceased'}</span></td>
                      </tr>
                    );
                  })}
                {discharged.length === 0 && deceased.length === 0 && (
                  <tr><td colSpan={5}><div className="empty-state" style={{ padding: '28px' }}><h3>No history yet</h3></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmPat && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmPat(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>{confirmType === 'discharge' ? 'Confirm Discharge' : 'Mark as Deceased'}</h3>
              <button className="modal-close" onClick={() => setConfirmPat(null)}><X size={16} /></button>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
                background: confirmType === 'discharge' ? 'var(--green-bg)' : 'var(--red-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {confirmType === 'discharge'
                  ? <CheckCircle size={24} style={{ color: 'var(--green)' }} />
                  : <Skull size={24} style={{ color: 'var(--red)' }} />}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {confirmType === 'discharge'
                  ? <>Discharge <strong style={{ color: 'var(--text-heading)' }}>{confirmPat.name}</strong>? This will free Room {confirmPat.room}.</>
                  : <>Mark <strong style={{ color: 'var(--text-heading)' }}>{confirmPat.name}</strong> as deceased? This cannot be undone.</>}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmPat(null)}>Cancel</button>
              <button className={`btn ${confirmType === 'discharge' ? 'btn-success' : 'btn-danger'}`} onClick={handleConfirm} id="confirm-action-btn">
                {confirmType === 'discharge' ? 'Confirm Discharge' : 'Mark Deceased'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
