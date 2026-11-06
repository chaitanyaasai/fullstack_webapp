# Screen Capture & Issue Reporting System (Assignment)

A full-stack React and Node.js application for capturing page screenshots, recording screens with audio (MP4/WebM), and logging issues.

## Project Structure

```
Assignment/
├── client/                     # Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── App.jsx             # Main dashboard, capture modal & recording logic
│   │   ├── App.css             # Matrix table styling & animations
│   │   ├── index.css           # Base styles
│   │   └── main.jsx            # React root mount
│   ├── index.html              # HTML shell
│   ├── vite.config.js          # Vite config with backend proxy
│   └── package.json            # React, html2canvas, lucide-react
├── server/                     # Backend (Node.js + Express)
│   ├── data/
│   │   └── notes.txt           # Saved issues log with timestamps and screenshot filenames
│   ├── uploads/
│   │   ├── recordings/         # Stored screen recordings (.mp4 / .webm)
│   │   └── screenshots/        # Stored page screenshots (.png)
│   ├── index.js                # Express API & file upload endpoints
│   └── package.json            # Express, Multer, CORS
├── package.json                # Root package.json with concurrent runner scripts
├── .gitignore                  # Git ignore rules
└── README.md                   # Documentation
```

## Quick Start (Run Locally After Submitting)

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v8.0.0 or higher

---

### Step 1: Install Dependencies
Open a terminal in the root `Assignment` folder and run:
```bash
npm run setup
```
*(This automatically installs all dependencies across the root, the `client`, and the `server` in one step).*

---

### Step 2: Start the Application
In the same terminal, run:
```bash
npm run dev
```
This starts both services simultaneously:
* **Backend API**: `http://localhost:5000`
* **Frontend Web App**: `http://localhost:5173`

---

### Step 3: Open in Browser
Visit **[http://localhost:5173](http://localhost:5173)**.

---

## Alternative: Running in Two Separate Terminals

If you prefer to run the backend and frontend in separate terminals:

**Terminal 1 (Backend Server)**:
```bash
cd server
npm install
node index.js
# Runs on http://localhost:5000
```

**Terminal 2 (Frontend Client)**:
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```
