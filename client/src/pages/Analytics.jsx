import { useApp } from '../context/AppContext';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { AlertTriangle, TrendingUp, Activity } from 'lucide-react';

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 12px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.82rem', fontWeight: 600, color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { patients, temperatures, FEVER_THRESHOLD } = useApp();

  const closed     = patients.filter(p => p.status !== 'active');
  const discharged = patients.filter(p => p.status === 'discharged');
  const deceased   = patients.filter(p => p.status === 'deceased');
  const active     = patients.filter(p => p.status === 'active');
  const total      = patients.length;

  const mortalityRate = closed.length > 0 ? ((deceased.length / closed.length) * 100).toFixed(1) : 0;
  const recoveryRate  = closed.length > 0 ? ((discharged.length / closed.length) * 100).toFixed(1) : 0;
  const mortalityAlert = parseFloat(mortalityRate) > 15;

  const avgStay = discharged.length > 0
    ? (discharged.reduce((sum, p) => sum + (p.dischargeDate ? differenceInDays(parseISO(p.dischargeDate), parseISO(p.admitDate)) : 0), 0) / discharged.length).toFixed(1)
    : '—';

  const tempTrend = Array.from({ length: 7 }, (_, i) => {
    const date   = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const label  = format(subDays(new Date(), 6 - i), 'MMM d');
    const recs   = temperatures.filter(t => t.date === date);
    const withFever = recs.filter(t => t.temp >= FEVER_THRESHOLD);
    const avgTemp   = recs.length > 0 ? parseFloat((recs.reduce((s, t) => s + t.temp, 0) / recs.length).toFixed(1)) : null;
    return { date: label, avgTemp, fever: withFever.length, normal: recs.length - withFever.length };
  });

  const pieData = [
    { name: 'Active',     value: active.length,     color: '#2563eb' },
    { name: 'Recovered',  value: discharged.length,  color: '#16a34a' },
    { name: 'Deceased',   value: deceased.length,    color: '#dc2626' },
  ].filter(d => d.value > 0);

  const admitTrend = Array.from({ length: 10 }, (_, i) => {
    const date  = format(subDays(new Date(), 9 - i), 'yyyy-MM-dd');
    return { date: format(subDays(new Date(), 9 - i), 'MMM d'), admitted: patients.filter(p => p.admitDate === date).length };
  });

  const benchmarks = [
    { label: 'Mortality Rate',  value: `${mortalityRate}%`, target: '≤ 15%', pass: parseFloat(mortalityRate) <= 15, detail: `${deceased.length} deceased / ${closed.length} closed` },
    { label: 'Recovery Rate',   value: `${recoveryRate}%`,  target: '≥ 85%', pass: parseFloat(recoveryRate) >= 85,  detail: `${discharged.length} recovered / ${closed.length} closed` },
    { label: 'Bed Occupancy',   value: `${Math.round((active.length/74)*100)}%`, target: '< 95%', pass: active.length < 71, detail: `${active.length}/74 beds used` },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Analytics</h2>
          <p>Performance benchmarks & treatment quality monitoring</p>
        </div>
      </div>

      {mortalityAlert && (
        <div className="alert-banner danger">
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <div><strong>Mortality rate {mortalityRate}% exceeds 15% benchmark.</strong> Immediate clinical review required.</div>
        </div>
      )}

      {/* KPIs */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Mortality Rate', value: `${mortalityRate}%`, sub: 'Benchmark ≤ 15%', color: mortalityAlert ? 'red' : 'green' },
          { label: 'Recovery Rate',  value: `${recoveryRate}%`,  sub: 'Target ≥ 85%', color: 'green' },
          { label: 'Total Patients', value: total, sub: `${active.length} active · ${closed.length} closed`, color: 'blue' },
          { label: 'Avg Stay',       value: `${avgStay}d`, sub: 'Discharged patients', color: 'teal' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon-wrap ${s.color}`}><TrendingUp size={16} /></div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: '1.6rem' }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="section-title"><Activity size={14} /> Avg Temperature — Last 7 Days</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[36, 40]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <ReferenceLine y={37.5} stroke="#dc2626" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="avgTemp" name="Avg Temp (°C)" stroke="#2563eb" strokeWidth={2.5}
                  dot={{ fill: '#2563eb', r: 4, strokeWidth: 0 }} connectNulls activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Red dashed line = fever threshold (37.5°C)
          </div>
        </div>

        <div className="card">
          <div className="section-title">Patient Outcomes</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                </Pie>
                <Tooltip content={<TooltipBox />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="section-title">Fever vs Normal Readings</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tempTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="fever"  name="Fever"  fill="#dc2626" radius={[4,4,0,0]} />
                <Bar dataKey="normal" name="Normal" fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Daily Admissions — Last 10 Days</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={admitTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="admitted" name="Admissions" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Benchmarks */}
      <div className="card">
        <div className="section-title">Performance Benchmarks</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {benchmarks.map(b => (
            <div key={b.label} style={{
              padding: '16px', borderRadius: 'var(--r)',
              background: b.pass ? 'var(--green-bg)' : 'var(--red-bg)',
              border: `1px solid ${b.pass ? 'var(--green-border)' : 'var(--red-border)'}`,
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{b.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: b.pass ? 'var(--green)' : 'var(--red)', lineHeight: 1 }}>{b.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 8px' }}>Target: {b.target}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{b.detail}</div>
              <div style={{ marginTop: 10 }}>
                <span className={`badge ${b.pass ? 'badge-green' : 'badge-red'}`}>{b.pass ? 'On Target' : 'Off Target'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
