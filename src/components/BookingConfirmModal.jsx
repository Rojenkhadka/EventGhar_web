
import React from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.35)',
  zIndex: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(1.5px)'
};

const modalStyle = {
  background: '#fff',
  borderRadius: 20,
  boxShadow: '0 8px 32px rgba(15,23,42,0.10)',
  maxWidth: 370,
  width: '92vw',
  padding: '32px 28px 28px 28px',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0,
};

const titleStyle = {
  fontWeight: 700,
  fontSize: 22,
  color: '#1e293b',
  marginBottom: 18,
  textAlign: 'left',
  width: '100%',
};

const messageStyle = {
  color: '#334155',
  fontSize: 16,
  marginBottom: 8,
  width: '100%',
  textAlign: 'left',
};

const organizerStyle = {
  color: '#64748b',
  fontSize: 15,
  marginBottom: 18,
  width: '100%',
  textAlign: 'left',
};

const buttonRowStyle = {
  display: 'flex',
  gap: 16,
  justifyContent: 'flex-end',
  width: '100%',
  marginTop: 10,
};

const cancelBtnStyle = {
  padding: '10px 28px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#f1f5f9',
  color: '#334155',
  fontWeight: 500,
  fontSize: 16,
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const confirmBtnStyle = {
  padding: '10px 28px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  fontSize: 16,
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const BookingConfirmModal = ({ event, open, onConfirm, onCancel, loading }) => {
  if (!open || !event) return null;
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={titleStyle}>Confirm Booking</div>
        <div style={messageStyle}>
          Are you sure you want to book <strong>{event.title}</strong>?
        </div>
        <div style={organizerStyle}>By {event.organizerName}</div>
        <div style={buttonRowStyle}>
          <button onClick={onCancel} style={cancelBtnStyle} disabled={loading}>Cancel</button>
          <button onClick={onConfirm} style={confirmBtnStyle} disabled={loading}>{loading ? 'Booking...' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmModal;
