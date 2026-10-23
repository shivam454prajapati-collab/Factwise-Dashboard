# QuarantineOS — Quarantine & Treatment Facility Management System

> **A specialized clinical management and workflow optimization dashboard designed for virus quarantine facilities with strict discharge protocols.**

---

## 📌 Overview

During high-mortality viral outbreaks (~15% mortality rate), quarantine facilities face immense strain. Understaffed medical teams with up to 74 beds at peak occupancy struggle with coordination — resulting in missed temperature readings, delayed doctor rounds, and bottlenecks in discharge workflows.

**QuarantineOS** resolves these operational bottlenecks by providing real-time visibility, automated clinical checklists, role-based interfaces (Nurse, Doctor, Administrator), and automated compliance with the **3-Day Fever-Free** discharge protocol.

---

## 🚀 Key Features

### 1. Daily Clinical Workflow & Progress Tracking
- **Nurse Temperature Station**: Quick logging of daily body temperatures (°C / °F) with fever flagging (fever threshold: $\ge 38.0^\circ\text{C}$ / $100.4^\circ\text{F}$).
- **Doctor Rounds Station**: Daily visit logging, clinical condition assessment (Stable / Serious / Critical), and treatment & medication prescription notes.
- **Workflow Completion Bars**: Live visual indicators showing daily progress for both temperature logging and doctor rounds.

### 2. Automated 3-Day Fever-Free Discharge Engine
- Tracks consecutive days without fever for each patient.
- Automatically flags patients eligible for discharge upon reaching 3 consecutive fever-free days.
- Admin discharge approval workflow that frees up bed space immediately in the 74-bed capacity pool.

### 3. Visual 74-Bed Room Grid
- Interactive visual map representing all 74 facility rooms.
- Color-coded status: Occupied (Stable, Serious, Critical), Eligible for Discharge, and Empty.
- Click-to-inspect patient details and clinical history.

### 4. Role-Based Access Control (RBAC)
- **Nurse View**: Optimized for high-throughput vitals recording.
- **Doctor View**: Focused on rounds, diagnoses, and medical orders.
- **Admin View**: Occupancy management, intake/admissions, and discharge approvals.

### 5. Facility Analytics & Epidemic Intelligence
- Patient outcome distribution (Active, Discharged / Cured, Deceased).
- Facility mortality benchmark monitoring (comparing against expected 15% rate).
- Temperature trend charts across hospital stay.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6
- **UI & Icons**: Lucide React, Clean Medical Design System
- **Data Visualization**: Recharts
- **State & Persistence**: React Context API + LocalStorage persistence
- **Backend (Optional / Ready)**: Node.js / Express REST API structure

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or newer recommended)
- npm or yarn

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shivam454prajapati-collab/Factwise-Dashboard.git
   cd Factwise-Dashboard
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 📂 Project Structure

```text
├── client/
│   ├── src/
│   │   ├── components/      # Sidebar, PatientDetail, Navbar, Modals
│   │   ├── context/         # AppContext (data store, 3-day fever logic, RBAC)
│   │   ├── pages/           # Dashboard, Patients, Temperature, Rounds, Discharge, RoomMap, Analytics
│   │   ├── App.jsx          # Route configuration
│   │   ├── index.css        # Clinical light theme & design tokens
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── server/                  # Backend API structure
├── .gitignore
└── README.md
```

---

## 📄 License
MIT License. Built for quarantine facility optimization and clinical workflows.
