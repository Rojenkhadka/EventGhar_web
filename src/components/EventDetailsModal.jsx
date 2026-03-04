


import React from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(15,23,42,0.35)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(1.5px)'
};

const modalStyle = {
  background: '#fff',
  borderRadius: 22,
  boxShadow: '0 8px 32px rgba(15,23,42,0.10)',
  maxWidth: 480,
  width: '95vw',
  minWidth: 320,
  position: 'relative',
  padding: '36px 32px 32px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

const closeBtnStyle = {
  position: 'absolute',
  top: 18,
  right: 18,
  background: 'none',
  border: 'none',
  fontSize: 26,
  color: '#64748b',
  cursor: 'pointer',
  zIndex: 2,
  padding: 2,
  borderRadius: 4,
  transition: 'background 0.15s',
};

const labelStyle = {
  fontWeight: 600,
  fontSize: 15,
  color: '#334155',
  marginBottom: 4,
  marginTop: 18,
  display: 'block',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  fontSize: 16,
  color: '#0f172a',
  marginBottom: 0,
  marginTop: 0,
  outline: 'none',
  fontWeight: 500,
  pointerEvents: 'none',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 60,
  resize: 'none',
};

const EventDetailsModal = ({ event, onClose }) => {
  if (!event) return null;
  // Extract date and time
  let dateStr = '-';
  let timeStr = '-';
  if (event.date) {
    const d = new Date(event.date);
    dateStr = d.toLocaleDateString();
  }
  if (event.time) {
    // event.time is stored as "HH:MM:SS" or "HH:MM" — format it nicely
    const match = String(event.time).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const min = match[2];
      const ap = match[3];
      if (ap) {
        if (ap.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ap.toUpperCase() === 'AM' && h === 12) h = 0;
      }
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = (h % 12 || 12).toString().padStart(2, '0');
      timeStr = `${displayH}:${min} ${ampm}`;
    } else {
      timeStr = event.time;
    }
  } else if (event.date) {
    // Fallback: derive from date only if no dedicated time field
    const d = new Date(event.date);
    timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeBtnStyle} aria-label="Close">&times;</button>
        <div style={{ fontWeight: 800, fontSize: 26, color: '#0f172a', marginBottom: 18 }}>Event Details</div>
        <div>
          <label style={labelStyle}>Event Name</label>
          <input style={inputStyle} value={event.title || ''} readOnly />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date</label>
              <input style={inputStyle} value={dateStr} readOnly />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Time</label>
              <input style={inputStyle} value={timeStr} readOnly />
            </div>
          </div>

          <label style={labelStyle}>Venue / Location</label>
          <input style={inputStyle} value={event.location || ''} readOnly />

          <label style={labelStyle}>Description</label>
          <textarea style={textareaStyle} value={event.description || ''} readOnly />

          {/* If you have a category field, show it here. Otherwise, remove this. */}
          {/* <label style={labelStyle}>Category</label>
          <input style={inputStyle} value={event.category || ''} readOnly /> */}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
