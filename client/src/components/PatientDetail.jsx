import { useApp } from '../context/AppContext';
import { format, parseISO, differenceInDays } from 'date-fns';
import { X, Thermometer, Stethoscope, User, Phone, Droplets, Calendar } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function PatientDetail({ patient, onClose }) {
  const { getPatientTemps, getPatientVisits, getFeverFreeDays, isDischargeReady, FEVER_THRESHOLD } = useApp();

  const temps  = getPatientTemps(patient._id);
  const visits = getPatientVisits(patient._id);
  const freeD  = getFeverFreeDays(patient._id);
  const ready  = isDischargeReady(patient._id);

  const days = differenceInDays(new Date(), parseISO(patient.admitDate));

  // Chart data: last 10 readings
  const chartData = [...temps].reverse().slice(-10).map(t => ({
    label: `${t.date.slice(5)} ${t.time}`,
    temp: t.temp,
  }));

  const statusColor = { active: 'badge-blue', discharged: 'badge-green', deceased: 'badge-red' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ padding: '28px' }}>
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {patient.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 2 }}>{patient.name}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={`badge ${statusColor[patient.status]}`}>{patient.status}</span>
                {ready && <span className="badge badge-purple">Discharge Ready</span>}
                {patient.room && <span className="badge badge-gray">Room {patient.room}</span>}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Info Grid */}
        <div className="form-grid" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.875rem' }}>
              <User size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Age / Gender</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{patient.age}y · {patient.gender}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.875rem' }}>
              <Droplets size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Blood Type</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{patient.bloodType}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.875rem' }}>
              <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Admitted</span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{format(parseISO(patient.admitDate), 'd MMM yyyy')} ({days}d ago)</span>
            </div>
            {patient.contactPhone && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.875rem' }}>
                <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Emergency</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{patient.contactName} · {patient.contactPhone}</span>
              </div>
            )}
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              3-Day Fever-Free Progress
            </div>
            <div className="fever-dots" style={{ marginBottom: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} className={`fever-dot ${i <= freeD ? 'clear' : 'empty'}`}
                  style={{ width: 18, height: 18 }}
                  title={`Day ${i}: ${i <= freeD ? 'Clear' : 'Not met'}`}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: ready ? 'var(--green)' : 'var(--text-secondary)' }}>
              {freeD}/3 days fever-free
            </div>
            {ready && <div style={{ marginTop: 8 }}><span className="badge badge-green">✓ Eligible for Discharge</span></div>}
          </div>
        </div>

        {/* Temperature Chart */}
        {chartData.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div className="section-title"><Thermometer size={14} /> Temperature History</div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[35.5, 41]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: '0.8rem' }}
                    labelStyle={{ color: 'var(--text-muted)' }}
                  />
                  <ReferenceLine y={FEVER_THRESHOLD} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Fever', fill: '#ef4444', fontSize: 10 }} />
                  <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="#3b82f6" strokeWidth={2.5}
                    dot={({ cx, cy, payload }) => (
                      <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4}
                        fill={payload.temp >= FEVER_THRESHOLD ? '#ef4444' : '#22c55e'}
                        stroke="none" />
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Temperature Records */}
        <div style={{ marginBottom: 20 }}>
          <div className="section-title"><Thermometer size={14} /> Recent Readings ({temps.length})</div>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {temps.slice(0, 8).map(t => (
              <div key={t._id} className="temp-history-item">
                <div>
                  <span style={{ fontWeight: 700, color: t.temp >= FEVER_THRESHOLD ? 'var(--red)' : 'var(--green)' }}>
                    {t.temp}°C
                  </span>
                  {t.temp >= FEVER_THRESHOLD && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--red)' }}>Fever</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <div>{t.date} at {t.time}</div>
                  <div>{t.recordedBy}</div>
                  {t.note && <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{t.note}"</div>}
                </div>
              </div>
            ))}
            {temps.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '16px 0' }}>No temperature records yet</div>}
          </div>
        </div>

        {/* Recent Doctor Visits */}
        <div>
          <div className="section-title"><Stethoscope size={14} /> Doctor Visits ({visits.length})</div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {visits.slice(0, 5).map(v => (
              <div key={v._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{v.doctorName}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v.date} {v.time}</span>
                </div>
                {v.prescription && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <strong>Rx:</strong> {v.prescription}
                  </div>
                )}
                {v.notes && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2, fontStyle: 'italic' }}>
                    {v.notes}
                  </div>
                )}
              </div>
            ))}
            {visits.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '16px 0' }}>No doctor visits recorded</div>}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
