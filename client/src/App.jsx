import React, { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Camera, Save, Circle, X, Check } from 'lucide-react';
import './App.css';

const BUTTON_SIZE = 56;
const CARD_BUFFER = 16;
const VIEWPORT_MARGIN = 16;

const ROLES = [
  { key: 'owner', name: 'Owner', headerClass: 'role-owner' },
  { key: 'manager', name: 'Manager', headerClass: 'role-manager' },
  { key: 'asstManager', name: 'Asst. Manager', headerClass: 'role-asst-manager' },
  { key: 'chef', name: 'Chef', headerClass: 'role-chef' },
  { key: 'staff', name: 'Staff', headerClass: 'role-staff' }
];

const PERMISSION_GROUPS = [
  {
    category: 'Overview',
    items: [
      { id: 'home', name: 'Home' }
    ]
  },
  {
    category: 'Operations',
    items: [
      { id: 'orders', name: 'Orders' },
      { id: 'kitchen', name: 'Kitchen' },
      { id: 'coupons', name: 'Coupons' }
    ]
  },
  {
    category: 'Menu',
    items: [
      { id: 'categories', name: 'Categories' },
      { id: 'items', name: 'Items' },
      { id: 'itemTypes', name: 'Item Types' },
      { id: 'itemCustomization', name: 'Item Customization' },
      { id: 'bulkImport', name: 'Bulk Import' }
    ]
  },
  {
    category: 'People',
    items: [
      { id: 'employees', name: 'Employees' }
    ]
  },
  {
    category: 'Setup',
    items: [
      { id: 'restaurant', name: 'Restaurant' },
      { id: 'locations', name: 'Locations' }
    ]
  }
];

const INITIAL_PERMISSIONS = {
  home: {
    owner: { read: false, write: false },
    manager: { read: false, write: false },
    asstManager: { read: false, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  orders: {
    owner: { read: true, write: false },
    manager: { read: false, write: true },
    asstManager: { read: false, write: false },
    chef: { read: true, write: false },
    staff: { read: false, write: false }
  },
  kitchen: {
    owner: { read: true, write: true },
    manager: { read: true, write: true },
    asstManager: { read: false, write: false },
    chef: { read: true, write: true },
    staff: { read: false, write: false }
  },
  coupons: {
    owner: { read: true, write: true },
    manager: { read: false, write: false },
    asstManager: { read: false, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  categories: {
    owner: { read: true, write: false },
    manager: { read: false, write: false },
    asstManager: { read: false, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  items: {
    owner: { read: true, write: false },
    manager: { read: false, write: false },
    asstManager: { read: false, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  itemTypes: {
    owner: { read: true, write: false },
    manager: { read: false, write: false },
    asstManager: { read: false, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  itemCustomization: {
    owner: { read: true, write: false },
    manager: { read: false, write: false },
    asstManager: { read: false, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  bulkImport: {
    owner: { read: true, write: false },
    manager: { read: false, write: false },
    asstManager: { read: false, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  employees: {
    owner: { read: true, write: true },
    manager: { read: true, write: false },
    asstManager: { read: true, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  restaurant: {
    owner: { read: true, write: true },
    manager: { read: true, write: false },
    asstManager: { read: true, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  },
  locations: {
    owner: { read: true, write: true },
    manager: { read: true, write: false },
    asstManager: { read: true, write: false },
    chef: { read: false, write: false },
    staff: { read: false, write: false }
  }
};

export default function App() {
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
  const [isSaved, setIsSaved] = useState(false);

  // Modal & Capture State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Screen recording state
  const [isPromptingShare, setIsPromptingShare] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(10);

  // Draggable floating button state
  const [btnPos, setBtnPos] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollisionBlocked, setIsCollisionBlocked] = useState(false);

  const overviewCardRef = useRef(null);
  const dragRef = useRef({
    isPointerDown: false,
    startX: 0,
    startY: 0,
    btnOriginX: 0,
    btnOriginY: 0,
    hasMoved: false
  });

  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const combinedStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const displayStreamRef = useRef(null);
  const audioContextRef = useRef(null);

  // Toggle checkbox permission
  const handleTogglePermission = (itemId, roleKey, type) => {
    setPermissions((prev) => {
      const currentItem = prev[itemId] || {};
      const currentRole = currentItem[roleKey] || { read: false, write: false };
      return {
        ...prev,
        [itemId]: {
          ...currentItem,
          [roleKey]: {
            ...currentRole,
            [type]: !currentRole[type]
          }
        }
      };
    });
  };

  const handleSaveChanges = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Helper: check collision with Employee Access card and resolve to nearest outside edge
  const resolvePosition = useCallback((targetX, targetY) => {
    const minX = VIEWPORT_MARGIN;
    const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - BUTTON_SIZE - VIEWPORT_MARGIN);
    const minY = VIEWPORT_MARGIN;
    const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - BUTTON_SIZE - VIEWPORT_MARGIN);

    let clampedX = Math.min(Math.max(minX, targetX), maxX);
    let clampedY = Math.min(Math.max(minY, targetY), maxY);

    if (!overviewCardRef.current) {
      return { x: clampedX, y: clampedY, blocked: false };
    }

    const cardRect = overviewCardRef.current.getBoundingClientRect();
    const boxLeft = cardRect.left - CARD_BUFFER;
    const boxRight = cardRect.right + CARD_BUFFER;
    const boxTop = cardRect.top - CARD_BUFFER;
    const boxBottom = cardRect.bottom + CARD_BUFFER;

    const btnLeft = clampedX;
    const btnRight = clampedX + BUTTON_SIZE;
    const btnTop = clampedY;
    const btnBottom = clampedY + BUTTON_SIZE;

    const isColliding =
      btnRight > boxLeft &&
      btnLeft < boxRight &&
      btnBottom > boxTop &&
      btnTop < boxBottom;

    if (!isColliding) {
      return { x: clampedX, y: clampedY, blocked: false };
    }

    const distToLeft = Math.abs(btnRight - boxLeft);
    const distToRight = Math.abs(boxRight - btnLeft);
    const distToTop = Math.abs(btnBottom - boxTop);
    const distToBottom = Math.abs(boxBottom - btnTop);

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    let resolvedX = clampedX;
    let resolvedY = clampedY;

    if (minDist === distToLeft) {
      resolvedX = boxLeft - BUTTON_SIZE;
    } else if (minDist === distToRight) {
      resolvedX = boxRight;
    } else if (minDist === distToTop) {
      resolvedY = boxTop - BUTTON_SIZE;
    } else {
      resolvedY = boxBottom;
    }

    resolvedX = Math.min(Math.max(minX, resolvedX), maxX);
    resolvedY = Math.min(Math.max(minY, resolvedY), maxY);

    return { x: resolvedX, y: resolvedY, blocked: true };
  }, []);

  // Initial placement at bottom right
  useEffect(() => {
    const initX = window.innerWidth - BUTTON_SIZE - 36;
    const initY = window.innerHeight - BUTTON_SIZE - 36;
    const initial = resolvePosition(initX, initY);
    setBtnPos({ x: initial.x, y: initial.y });

    const handleResize = () => {
      setBtnPos((prev) => {
        const updated = resolvePosition(prev.x, prev.y);
        return { x: updated.x, y: updated.y };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [resolvePosition]);

  // Pointer event handlers
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragRef.current = {
      isPointerDown: true,
      startX: e.clientX,
      startY: e.clientY,
      btnOriginX: btnPos.x,
      btnOriginY: btnPos.y,
      hasMoved: false
    };

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isPointerDown) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 5) {
      dragRef.current.hasMoved = true;
    }

    const nextRawX = dragRef.current.btnOriginX + deltaX;
    const nextRawY = dragRef.current.btnOriginY + deltaY;

    const result = resolvePosition(nextRawX, nextRawY);
    setBtnPos({ x: result.x, y: result.y });
    setIsCollisionBlocked(result.blocked);
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current.isPointerDown) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const didMove = dragRef.current.hasMoved;
    dragRef.current.isPointerDown = false;
    setIsDragging(false);
    setIsCollisionBlocked(false);

    if (!didMove) {
      setIsModalOpen(true);
    }
  };

  const handlePointerCancel = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    dragRef.current.isPointerDown = false;
    setIsDragging(false);
    setIsCollisionBlocked(false);
  };

  // Operation 1: Take Screenshot
  const handleTakeScreenshot = async () => {
    try {
      setIsProcessing(true);

      const modalElement = document.querySelector('.modal-overlay');
      const floatBtnElement = document.querySelector('.floating-camera-btn');
      if (modalElement) modalElement.style.visibility = 'hidden';
      if (floatBtnElement) floatBtnElement.style.visibility = 'hidden';

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        backgroundColor: '#dbe3ed'
      });

      if (modalElement) modalElement.style.visibility = 'visible';
      if (floatBtnElement) floatBtnElement.style.visibility = 'visible';

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsProcessing(false);
          return;
        }

        const formData = new FormData();
        formData.append('screenshot', blob, `screenshot-${Date.now()}.png`);

        try {
          const res = await fetch('/api/upload-screenshot', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            setStatusMessage(`Full page screenshot saved: ${data.filename}`);
          } else {
            setStatusMessage('Failed to save screenshot.');
          }
        } catch (err) {
          console.error(err);
          setStatusMessage('Network error saving screenshot.');
        } finally {
          setIsProcessing(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Screenshot error:', err);
      setIsProcessing(false);
    }
  };

  // Operation 2: Save Issue + Screenshot
  const handleSaveIssueAndScreenshot = async () => {
    try {
      setIsProcessing(true);

      const modalElement = document.querySelector('.modal-overlay');
      const floatBtnElement = document.querySelector('.floating-camera-btn');
      if (modalElement) modalElement.style.visibility = 'hidden';
      if (floatBtnElement) floatBtnElement.style.visibility = 'hidden';

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        backgroundColor: '#dbe3ed'
      });

      if (modalElement) modalElement.style.visibility = 'visible';
      if (floatBtnElement) floatBtnElement.style.visibility = 'visible';

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsProcessing(false);
          return;
        }

        const formData = new FormData();
        formData.append('screenshot', blob, `screenshot-${Date.now()}.png`);
        formData.append('issue', issue || 'Reported Issue');
        formData.append('description', description || '');

        try {
          const res = await fetch('/api/save-issue', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            setStatusMessage(`Full page screenshot saved: ${data.filename}`);
          } else {
            setStatusMessage('Failed to save issue.');
          }
        } catch (err) {
          console.error(err);
          setStatusMessage('Network error saving issue.');
        } finally {
          setIsProcessing(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Save issue error:', err);
      setIsProcessing(false);
    }
  };

  // Operation 3: Start Screen Recording (max 10s)
  const handleStartRecording = async () => {
    const activeIssue = issue || 'Reported Issue';
    const activeDescription = description || 'N/A';

    setIsModalOpen(false);
    setIsPromptingShare(true);

    let micStream = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;
    } catch (e) {
      console.log('Microphone not available or allowed, continuing without it');
    }

    let displayStream = null;
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      displayStreamRef.current = displayStream;
    } catch (e) {
      console.log('Screen capture dismissed or cancelled:', e);
      setIsPromptingShare(false);
      setIsModalOpen(true);
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      return;
    }

    setIsPromptingShare(false);

    let hasMicAudio = false;
    let hasTabAudio = false;
    let finalTracks = [...displayStream.getVideoTracks()];

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();

      if (micStream && micStream.getAudioTracks().length > 0) {
        const micSource = audioCtx.createMediaStreamSource(micStream);
        micSource.connect(dest);
        hasMicAudio = true;
      }

      if (displayStream.getAudioTracks().length > 0) {
        const tabSource = audioCtx.createMediaStreamSource(displayStream);
        tabSource.connect(dest);
        hasTabAudio = true;
      }

      if (hasMicAudio || hasTabAudio) {
        finalTracks.push(...dest.stream.getAudioTracks());
      }
    } catch (err) {
      console.warn('AudioContext mixing error, falling back to display audio', err);
      finalTracks.push(...displayStream.getAudioTracks());
    }

    let audioInfo = 'video only';
    if (hasMicAudio && hasTabAudio) audioInfo = 'with mic + tab audio';
    else if (hasMicAudio) audioInfo = 'with mic audio';
    else if (hasTabAudio) audioInfo = 'with tab audio';

    const combinedStream = new MediaStream(finalTracks);
    combinedStreamRef.current = combinedStream;

    const recordedChunks = [];
    let chosenMime = 'video/webm';
    let fileExt = 'webm';

    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      chosenMime = 'video/mp4;codecs=avc1';
      fileExt = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      chosenMime = 'video/mp4';
      fileExt = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      chosenMime = 'video/webm;codecs=vp9';
      fileExt = 'webm';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      chosenMime = 'video/webm';
      fileExt = 'webm';
    }

    const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: chosenMime });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      combinedStream.getTracks().forEach((track) => track.stop());
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }

      const blob = new Blob(recordedChunks, { type: chosenMime });
      const formData = new FormData();
      formData.append('issue', activeIssue);
      formData.append('description', activeDescription);
      formData.append('audioInfo', audioInfo);
      formData.append('recording', blob, `recording-${Date.now()}.${fileExt}`);

      try {
        const res = await fetch('/api/upload-recording', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          setStatusMessage(data.message);
        } else {
          setStatusMessage('Failed to upload recording.');
        }
      } catch (err) {
        console.error(err);
        setStatusMessage('Network error uploading recording.');
      }

      setIsRecording(false);
      setIsModalOpen(true);
    };

    displayStream.getVideoTracks()[0].onended = () => {
      stopRecordingSession();
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingSecondsLeft(10);

    recordingTimerRef.current = setInterval(() => {
      setRecordingSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(recordingTimerRef.current);
          stopRecordingSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecordingSession = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="page-container" id="page-capture-root">
      {/* Main Employee Permissions Card */}
      <div className="permissions-card" ref={overviewCardRef}>
        <div className="card-header-bar">
          <div>
            <h1 className="main-title">Employee Permissions</h1>
            <p className="subtitle">
              Toggle Read / Write access for every role, then save to apply the changes.
            </p>
          </div>
          <button
            className={`btn-save-changes ${isSaved ? 'saved' : ''}`}
            onClick={handleSaveChanges}
          >
            {isSaved ? 'Changes Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Permissions Matrix Table */}
        <div className="matrix-table-container">
          <table className="permissions-matrix-table">
            <thead>
              {/* Row 1: Role Titles with colored backgrounds */}
              <tr>
                <th className="role-header-corner" rowSpan={1}></th>
                {ROLES.map((role) => (
                  <th
                    key={role.key}
                    colSpan={2}
                    className={`role-header ${role.headerClass}`}
                  >
                    {role.name}
                  </th>
                ))}
              </tr>

              {/* Row 2: Read & Write sub-headers */}
              <tr>
                <th className="sub-header-corner"></th>
                {ROLES.map((role) => (
                  <React.Fragment key={`${role.key}-sub`}>
                    <th className="sub-header-cell">Read</th>
                    <th className="sub-header-cell">Write</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <React.Fragment key={group.category}>
                  {/* Category Header Row */}
                  <tr>
                    <td className="section-row-cell">{group.category}</td>
                    {Array.from({ length: ROLES.length * 2 }).map((_, i) => (
                      <td key={i} className="section-empty-cell"></td>
                    ))}
                  </tr>

                  {/* Category Navigation Items */}
                  {group.items.map((item) => (
                    <tr key={item.id}>
                      <td className="item-name-cell">
                        <button type="button" className="item-link">
                          {item.name}
                        </button>
                      </td>

                      {ROLES.map((role) => {
                        const itemPerms = permissions[item.id] || {};
                        const rolePerms = itemPerms[role.key] || { read: false, write: false };

                        return (
                          <React.Fragment key={`${item.id}-${role.key}`}>
                            {/* Read Checkbox */}
                            <td className="checkbox-cell">
                              <span
                                className={`custom-checkbox ${rolePerms.read ? 'checked' : ''}`}
                                onClick={() => handleTogglePermission(item.id, role.key, 'read')}
                              >
                                {rolePerms.read && <Check size={13} strokeWidth={3} />}
                              </span>
                            </td>

                            {/* Write Checkbox */}
                            <td className="checkbox-cell">
                              <span
                                className={`custom-checkbox ${rolePerms.write ? 'checked' : ''}`}
                                onClick={() => handleTogglePermission(item.id, role.key, 'write')}
                              >
                                {rolePerms.write && <Check size={13} strokeWidth={3} />}
                              </span>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating & Draggable Camera Button */}
      {btnPos.x >= 0 && (
        <button
          className={`floating-camera-btn ${isDragging ? 'is-dragging' : ''} ${isCollisionBlocked ? 'blocked-pulse' : ''}`}
          style={{
            left: `${btnPos.x}px`,
            top: `${btnPos.y}px`
          }}
          aria-label="Open capture options or drag to reposition"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <Camera size={26} strokeWidth={2.2} />
        </button>
      )}

      {/* Capture Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2 className="modal-title">Capture this page</h2>
              <button
                className="modal-close-icon"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="modal-desc">
              Save a screenshot, record your screen, or report an issue.
            </p>

            <div className="input-block">
              <label className="input-label">ISSUE</label>
              <input
                type="text"
                className="text-input"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="Short summary of the issue"
              />
            </div>

            <div className="input-block">
              <label className="input-label">DESCRIPTION</label>
              <textarea
                className="textarea-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, steps to reproduce, etc."
              />
            </div>

            {/* Success / Status Message banner */}
            {statusMessage && (
              <div className="status-box">
                {statusMessage}
              </div>
            )}

            {/* 3 Operations Action Buttons */}
            <div className="actions-container">
              <button
                className="btn-primary-action btn-green"
                onClick={handleSaveIssueAndScreenshot}
                disabled={isProcessing}
              >
                <Save size={18} />
                <span>Save Issue + Screenshot</span>
              </button>

              <button
                className="btn-primary-action btn-blue"
                onClick={handleTakeScreenshot}
                disabled={isProcessing}
              >
                <Camera size={18} />
                <span>Take Screenshot</span>
              </button>

              <button
                className="btn-primary-action btn-red"
                onClick={handleStartRecording}
                disabled={isProcessing}
              >
                <Circle size={14} fill="currentColor" />
                <span>Start Screen Recording (max 10s)</span>
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                className="btn-cancel-link"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Prompt while user allows mic and selects screen/tab */}
      {isPromptingShare && (
        <div className="toast-prompt">
          <span className="recording-dot" />
          <span>Allow mic, then select a tab/window and click Share...</span>
        </div>
      )}

      {/* Floating Recording Bar (active while recording) */}
      {isRecording && (
        <div className="recording-indicator-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="recording-dot" />
            <span>Recording with audio · {recordingSecondsLeft}s left</span>
          </div>
          <button
            className="btn-stop-recording"
            onClick={stopRecordingSession}
          >
            Stop Recording
          </button>
        </div>
      )}
    </div>
  );
}
