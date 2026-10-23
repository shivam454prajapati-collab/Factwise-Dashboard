import { useApp } from '../context/AppContext';
import { useState } from 'react';
import PatientDetail from '../components/PatientDetail';
import { BedDouble } from 'lucide-react';

export default function RoomMap() {
  const { patients, isDischargeReady, getLatestTempForDate, today, FEVER_THRESHOLD } = useApp();
  const [selected, setSelected] = useState(null);

  const activePatients = patients.filter(p => p.status === 'active');
  const roomMap = {};
  activePatients.forEach(p => { if (p.room) roomMap[p.room] = p; });

  const rooms = Array.from({ length: 74 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const patient = roomMap[num] || roomMap[String(i + 1)];
    return { num, patient };
  });

  const getCellClass = (room) => {
    if (!room.patient) return 'empty';
    if (isDischargeReady(room.patient._id)) return 'ready-discharge';
    const rec = getLatestTempForDate(room.patient._id, today());
    return rec && rec.temp >= FEVER_THRESHOLD ? 'occupied-fever' : 'occupied-normal';
  };

  const occupancy  = activePatients.length;
  const pct        = Math.round((occupancy / 74) * 100);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Room Map</h2>
          <p>{occupancy}/74 occupied · {74 - occupancy} available</p>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)', label: 'Fever', count: activePatients.filter(p => { const r = getLatestTempForDate(p._id, today()); return r && r.temp >= FEVER_THRESHOLD && !isDischargeReady(p._id); }).length },
          { color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)', label: 'Normal', count: activePatients.filter(p => { const r = getLatestTempForDate(p._id, today()); return (!r || r.temp < FEVER_THRESHOLD) && !isDischargeReady(p._id); }).length },
          { color: 'var(--purple)', bg: 'var(--purple-bg)', border: 'var(--purple-border)', label: 'Discharge Ready', count: activePatients.filter(p => isDischargeReady(p._id)).length },
          { color: 'var(--text-muted)', bg: 'var(--bg-soft)', border: 'var(--border)', label: 'Empty', count: 74 - occupancy },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', background: s.bg, border: `1px solid ${s.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: s.color, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)' }}>Bed Occupancy</span>
          <span style={{ fontWeight: 700, color: pct >= 90 ? 'var(--red)' : pct >= 75 ? 'var(--yellow)' : 'var(--blue)' }}>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${pct >= 90 ? 'red' : pct >= 75 ? 'yellow' : 'blue'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Room Grid */}
      <div className="card">
        <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { cls: 'occupied-fever',  label: 'Fever',           color: 'var(--red)' },
            { cls: 'occupied-normal', label: 'Normal',           color: 'var(--green)' },
            { cls: 'ready-discharge', label: 'Discharge Ready',  color: 'var(--purple)' },
            { cls: 'empty',           label: 'Empty',            color: 'var(--text-muted)' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 11, height: 11, borderRadius: 3, background: color + '30', border: `1.5px solid ${color}` }} />
              {label}
            </div>
          ))}
        </div>
        <div className="room-grid">
          {rooms.map(room => (
            <div
              key={room.num}
              className={`room-cell ${getCellClass(room)}`}
              onClick={() => room.patient && setSelected(room.patient)}
              title={room.patient ? `${room.patient.name} — click to view` : `Room ${room.num} — empty`}
              id={`room-${room.num}`}
            >
              <span className="room-num">{room.num}</span>
              {room.patient ? (
                <span style={{ fontSize: '0.58rem', maxWidth: 72, textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {room.patient.name.split(' ')[0]}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {selected && <PatientDetail patient={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
