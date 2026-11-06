const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const uploadsDir = path.join(__dirname, 'uploads');
const screenshotsDir = path.join(uploadsDir, 'screenshots');
const recordingsDir = path.join(uploadsDir, 'recordings');
const dataDir = path.join(__dirname, 'data');
const notesFilePath = path.join(dataDir, 'notes.txt');

[uploadsDir, screenshotsDir, recordingsDir, dataDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer storage for screenshots
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, screenshotsDir);
  },
  filename: (req, file, cb) => {
    const filename = `screenshot-${Date.now()}.png`;
    cb(null, filename);
  }
});

// Configure Multer storage for recordings
const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recordingsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    const filename = `recording-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const uploadScreenshot = multer({ storage: screenshotStorage });
const uploadRecording = multer({ storage: recordingStorage });

// Serve static uploaded files
app.use('/uploads', express.static(uploadsDir));

// Helper: Format file size
function formatBytes(bytes, decimals = 0) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i === 0) return `${bytes} Bytes`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Take Screenshot endpoint
app.post('/api/upload-screenshot', uploadScreenshot.single('screenshot'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot file provided' });
    }
    const filename = req.file.filename;
    console.log(`[Screenshot Saved]: ${filename}`);
    return res.json({
      success: true,
      filename: filename,
      path: `/uploads/screenshots/${filename}`,
      message: `Full page screenshot saved: ${filename}`
    });
  } catch (err) {
    console.error('Error saving screenshot:', err);
    return res.status(500).json({ error: 'Failed to save screenshot' });
  }
});

// 3. Save Issue + Screenshot endpoint
app.post('/api/save-issue', uploadScreenshot.single('screenshot'), (req, res) => {
  try {
    const { issue, description } = req.body;
    const filename = req.file ? req.file.filename : null;

    if (!filename) {
      return res.status(400).json({ error: 'Screenshot file is required' });
    }

    const timestamp = new Date().toISOString();
    const noteEntry = [
      '==================================================',
      `Timestamp:   ${timestamp}`,
      `Issue:       ${issue || 'N/A'}`,
      `Description: ${description || 'N/A'}`,
      `Screenshot:  ${filename}`,
      '==================================================\n\n'
    ].join('\n');

    fs.appendFileSync(notesFilePath, noteEntry, 'utf8');
    console.log(`[Issue Logged]: ${issue} -> ${filename}`);

    return res.json({
      success: true,
      filename: filename,
      issue: issue || '',
      description: description || '',
      message: `Full page screenshot saved: ${filename}`
    });
  } catch (err) {
    console.error('Error saving issue and screenshot:', err);
    return res.status(500).json({ error: 'Failed to save issue and screenshot' });
  }
});

// 4. Upload Screen Recording endpoint
app.post('/api/upload-recording', uploadRecording.single('recording'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No recording file provided' });
    }

    const filename = req.file.filename;
    const fileSizeFormatted = formatBytes(req.file.size);
    const audioInfo = req.body.audioInfo || 'with mic + tab audio';
    const issue = req.body.issue || 'Reported Issue';
    const description = req.body.description || 'N/A';

    // Append recording and issue details to notes.txt
    const timestamp = new Date().toISOString();
    const noteEntry = [
      '==================================================',
      `Timestamp:   ${timestamp}`,
      `Type:        Screen Recording`,
      `Issue:       ${issue}`,
      `Description: ${description}`,
      `Recording:   ${filename} (${fileSizeFormatted}) · ${audioInfo}`,
      '==================================================\n\n'
    ].join('\n');

    fs.appendFileSync(notesFilePath, noteEntry, 'utf8');
    console.log(`[Recording & Issue Logged]: ${issue} -> ${filename} (${fileSizeFormatted})`);

    return res.json({
      success: true,
      filename: filename,
      size: fileSizeFormatted,
      audioInfo: audioInfo,
      issue: issue,
      description: description,
      path: `/uploads/recordings/${filename}`,
      message: `Recording saved: ${filename}\n(${fileSizeFormatted}) · ${audioInfo}`
    });
  } catch (err) {
    console.error('Error saving recording:', err);
    return res.status(500).json({ error: 'Failed to save recording' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

