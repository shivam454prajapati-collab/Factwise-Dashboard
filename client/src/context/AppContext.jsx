// ─── In-Memory Data Store ─────────────────────────────────────────────────
// Simulates MongoDB collections using React context + localStorage persistence

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { format, subDays, differenceInDays, parseISO, isToday } from 'date-fns';

// ── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => format(new Date(), 'yyyy-MM-dd');
const FEVER_THRESHOLD = 37.5; // °C

// ── Seed Data ────────────────────────────────────────────────────────────────
const seedPatients = () => {
  const names = [
    'Arjun Sharma','Priya Patel','Rahul Verma','Anjali Singh','Vikram Nair',
    'Deepika Reddy','Sanjay Mehta','Kavya Iyer','Rohit Gupta','Sneha Joshi',
    'Amit Kumar','Pooja Agarwal','Ravi Chandran','Meera Pillai','Karan Malhotra',
    'Sunita Rao','Nikhil Bose','Aditi Sharma','Manish Tiwari','Divya Kapoor',
  ];
  const admitDates = [
    subDays(new Date(), 12), subDays(new Date(), 9), subDays(new Date(), 7),
    subDays(new Date(), 5),  subDays(new Date(), 4), subDays(new Date(), 3),
    subDays(new Date(), 8),  subDays(new Date(), 11),subDays(new Date(), 6),
    subDays(new Date(), 2),  subDays(new Date(), 10),subDays(new Date(), 5),
    subDays(new Date(), 3),  subDays(new Date(), 7), subDays(new Date(), 1),
    subDays(new Date(), 9),  subDays(new Date(), 4), subDays(new Date(), 6),
    subDays(new Date(), 8),  subDays(new Date(), 2),
  ];
  const statuses = [
    'active','active','active','active','active',
    'active','active','active','discharged','active',
    'active','active','active','active','active',
    'active','discharged','active','active','active',
  ];

  return names.map((name, i) => {
    const admitDate = format(admitDates[i], 'yyyy-MM-dd');
    const status = statuses[i];
    const age = 20 + Math.floor(Math.random() * 55);
    const gender = i % 2 === 0 ? 'Male' : 'Female';
    const room = status === 'discharged' ? null : (i + 1).toString().padStart(2, '0');
    return {
      _id: uid(),
      name,
      age,
      gender,
      room,
      admitDate,
      status,           // 'active' | 'discharged' | 'deceased'
      dischargeDate: status === 'discharged' ? format(subDays(new Date(), 1), 'yyyy-MM-dd') : null,
      dischargeApproved: status === 'discharged',
      dischargeApprovedDate: status === 'discharged' ? format(subDays(new Date(), 1), 'yyyy-MM-dd') : null,
      bloodType: ['A+','B+','O+','AB+','A-','B-'][i % 6],
      contactName: 'Family Member',
      contactPhone: `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
      notes: '',
    };
  });
};

const seedTemperatures = (patients) => {
  const records = [];
  patients.forEach(p => {
    if (p.status === 'discharged') {
      // discharged: last 3 days were all normal
      for (let d = 5; d >= 0; d--) {
        const date = format(subDays(new Date(), d), 'yyyy-MM-dd');
        const temp = d >= 3 ? (38 + Math.random()).toFixed(1) : (36.2 + Math.random() * 0.9).toFixed(1);
        records.push({ _id: uid(), patientId: p._id, date, temp: parseFloat(temp), recordedBy: 'Nurse Priya', time: '08:30', note: '' });
      }
      return;
    }
    const daysAdmitted = differenceInDays(new Date(), parseISO(p.admitDate));
    for (let d = Math.min(daysAdmitted, 10); d >= 0; d--) {
      const date = format(subDays(new Date(), d), 'yyyy-MM-dd');
      // Simulate fever pattern: high at start, may taper
      const dayNum = daysAdmitted - d;
      let baseTemp;
      if (dayNum < 3) baseTemp = 38.5 + Math.random() * 1.2;
      else if (dayNum < 6) baseTemp = 37.8 + Math.random() * 1.0;
      else baseTemp = 36.4 + Math.random() * 1.5;
      records.push({
        _id: uid(),
        patientId: p._id,
        date,
        temp: parseFloat(baseTemp.toFixed(1)),
        recordedBy: ['Nurse Priya','Nurse Ravi','Nurse Anjali'][d % 3],
        time: `0${7 + (d % 3)}:${d % 2 === 0 ? '00' : '30'}`,
        note: '',
      });
    }
  });
  return records;
};

const seedDoctorVisits = (patients) => {
  const visits = [];
  patients.forEach(p => {
    const daysAdmitted = differenceInDays(new Date(), parseISO(p.admitDate));
    for (let d = Math.min(daysAdmitted, 10); d >= 1; d--) {
      const date = format(subDays(new Date(), d), 'yyyy-MM-dd');
      visits.push({
        _id: uid(),
        patientId: p._id,
        date,
        doctorName: ['Dr. Mehta','Dr. Krishnan','Dr. Anil'][d % 3],
        prescription: 'Paracetamol 500mg, IV fluids',
        notes: 'Patient stable',
        time: `${10 + (d % 4)}:00`,
      });
    }
  });
  return visits;
};

// ── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

const STORAGE_KEY = 'quarantineOS_v2';

const loadStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const initStore = () => {
  const saved = loadStore();
  if (saved) return saved;
  const patients = seedPatients();
  const temperatures = seedTemperatures(patients);
  const doctorVisits = seedDoctorVisits(patients);
  return { patients, temperatures, doctorVisits };
};

export function AppProvider({ children }) {
  const initial = initStore();
  const [patients, setPatients]           = useState(initial.patients);
  const [temperatures, setTemperatures]   = useState(initial.temperatures);
  const [doctorVisits, setDoctorVisits]   = useState(initial.doctorVisits);
  const [currentRole, setCurrentRole]     = useState('admin'); // 'nurse' | 'doctor' | 'admin'
  const [currentUser]                     = useState({ name: 'Dr. Mehta', nurse: 'Nurse Priya', admin: 'Admin Suresh' });

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ patients, temperatures, doctorVisits }));
  }, [patients, temperatures, doctorVisits]);

  // ── Derived helpers ─────────────────────────────────────────────────────

  /** Get latest temperature for a patient on a given date */
  const getLatestTempForDate = useCallback((patientId, date) => {
    const recs = temperatures
      .filter(t => t.patientId === patientId && t.date === date)
      .sort((a, b) => b.time.localeCompare(a.time));
    return recs[0] || null;
  }, [temperatures]);

  /** Check if patient has had temp recorded today */
  const hasTempToday = useCallback((patientId) => {
    return temperatures.some(t => t.patientId === patientId && t.date === today());
  }, [temperatures]);

  /** Check if doctor visited today */
  const hasDoctorVisitToday = useCallback((patientId) => {
    return doctorVisits.some(v => v.patientId === patientId && v.date === today());
  }, [doctorVisits]);

  /** Count consecutive fever-free days (looking back from today) */
  const getFeverFreeDays = useCallback((patientId) => {
    let count = 0;
    for (let d = 0; d < 10; d++) {
      const date = format(subDays(new Date(), d), 'yyyy-MM-dd');
      const rec = getLatestTempForDate(patientId, date);
      if (!rec) break; // No reading — can't confirm fever-free
      if (rec.temp >= FEVER_THRESHOLD) break; // Has fever
      count++;
    }
    return count;
  }, [getLatestTempForDate]);

  /** Is patient eligible for discharge (3+ consecutive fever-free days with readings)? */
  const isDischargeReady = useCallback((patientId) => {
    return getFeverFreeDays(patientId) >= 3;
  }, [getFeverFreeDays]);

  /** Get all temp records for a patient */
  const getPatientTemps = useCallback((patientId) => {
    return temperatures
      .filter(t => t.patientId === patientId)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }, [temperatures]);

  /** Get all doctor visits for a patient */
  const getPatientVisits = useCallback((patientId) => {
    return doctorVisits
      .filter(v => v.patientId === patientId)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  }, [doctorVisits]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const addPatient = useCallback((data) => {
    const newP = {
      _id: uid(),
      ...data,
      admitDate: today(),
      status: 'active',
      dischargeDate: null,
      dischargeApproved: false,
      dischargeApprovedDate: null,
    };
    setPatients(prev => [...prev, newP]);
    return newP;
  }, []);

  const updatePatient = useCallback((id, data) => {
    setPatients(prev => prev.map(p => p._id === id ? { ...p, ...data } : p));
  }, []);

  const recordTemperature = useCallback((patientId, temp, note = '', nurseName) => {
    const now = new Date();
    const rec = {
      _id: uid(),
      patientId,
      date: today(),
      temp: parseFloat(temp),
      recordedBy: nurseName || 'Nurse',
      time: format(now, 'HH:mm'),
      note,
    };
    setTemperatures(prev => [...prev, rec]);
    return rec;
  }, []);

  const recordDoctorVisit = useCallback((patientId, prescription, notes, doctorName) => {
    const now = new Date();
    const visit = {
      _id: uid(),
      patientId,
      date: today(),
      doctorName: doctorName || 'Doctor',
      prescription,
      notes,
      time: format(now, 'HH:mm'),
    };
    setDoctorVisits(prev => [...prev, visit]);
    return visit;
  }, []);

  const approveDischarge = useCallback((patientId) => {
    setPatients(prev => prev.map(p =>
      p._id === patientId
        ? { ...p, dischargeApproved: true, dischargeApprovedDate: today() }
        : p
    ));
  }, []);

  const confirmDischarge = useCallback((patientId) => {
    setPatients(prev => prev.map(p =>
      p._id === patientId
        ? { ...p, status: 'discharged', dischargeDate: today(), room: null }
        : p
    ));
  }, []);

  const markDeceased = useCallback((patientId) => {
    setPatients(prev => prev.map(p =>
      p._id === patientId
        ? { ...p, status: 'deceased', dischargeDate: today(), room: null }
        : p
    ));
  }, []);

  // ── Aggregate Stats ──────────────────────────────────────────────────────

  const stats = (() => {
    const active    = patients.filter(p => p.status === 'active');
    const discharged= patients.filter(p => p.status === 'discharged');
    const deceased  = patients.filter(p => p.status === 'deceased');
    const total     = patients.length;
    const closed    = discharged.length + deceased.length;
    const mortalityRate = closed > 0 ? ((deceased.length / closed) * 100).toFixed(1) : '0.0';
    const recoveryRate  = closed > 0 ? ((discharged.length / closed) * 100).toFixed(1) : '0.0';

    const readyDischarge = active.filter(p => isDischargeReady(p._id) && !p.dischargeApproved);
    const approvedDischarge = active.filter(p => p.dischargeApproved);

    const tempToday = active.filter(p => hasTempToday(p._id));
    const visitToday= active.filter(p => hasDoctorVisitToday(p._id));

    const hasFeverToday = active.filter(p => {
      const rec = getLatestTempForDate(p._id, today());
      return rec && rec.temp >= FEVER_THRESHOLD;
    });

    return {
      totalPatients: total,
      activePatients: active.length,
      dischargedPatients: discharged.length,
      deceasedPatients: deceased.length,
      occupancyRate: ((active.length / 74) * 100).toFixed(0),
      mortalityRate,
      recoveryRate,
      availableBeds: 74 - active.length,
      readyForDischarge: readyDischarge.length,
      approvedForDischarge: approvedDischarge.length,
      tempRecordedToday: tempToday.length,
      doctorVisitedToday: visitToday.length,
      hasFeverToday: hasFeverToday.length,
      pendingTemp: active.length - tempToday.length,
      pendingVisit: active.length - visitToday.length,
    };
  })();

  const value = {
    patients, temperatures, doctorVisits,
    currentRole, setCurrentRole, currentUser,
    // Helpers
    getLatestTempForDate, hasTempToday, hasDoctorVisitToday,
    getFeverFreeDays, isDischargeReady, getPatientTemps, getPatientVisits,
    // Actions
    addPatient, updatePatient, recordTemperature, recordDoctorVisit,
    approveDischarge, confirmDischarge, markDeceased,
    // Stats
    stats,
    FEVER_THRESHOLD,
    today,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
