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

const errorStyle = {
  width: '100%',
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: '10px 14px',
  marginBottom: 14,
  fontWeight: 600,
  fontSize: 15,
  textAlign: 'center',
};

const BookingConfirmModal = ({ event, open, onConfirm, onCancel, loading, error }) => {
  if (!open || !event) return null;
  
  const maxAttendees = event.maxAttendees || 0;
  const ticketsSold = event.ticketsSold || 0;
  const availableSeats = maxAttendees - ticketsSold;
  const isSoldOut = maxAttendees > 0 && availableSeats <= 0;
  
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={titleStyle}>Confirm Booking</div>
        <div style={messageStyle}>
          Are you sure you want to book <strong>{event.title}</strong>?
        </div>
        <div style={organizerStyle}>By {event.organizerName}</div>
        {error && <div style={errorStyle}>{error}</div>}
        {maxAttendees > 0 && (
          <div style={{ 
            width: '100%', 
            padding: '10px 14px', 
            borderRadius: 8, 
            background: isSoldOut ? '#fee2e2' : availableSeats <= 10 ? '#fef3c7' : '#dcfce7',
            border: `1px solid ${isSoldOut ? '#fecaca' : availableSeats <= 10 ? '#fde68a' : '#bbf7d0'}`,
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 600,
            color: isSoldOut ? '#991b1b' : availableSeats <= 10 ? '#92400e' : '#065f46'
          }}>
            {isSoldOut ? '⚠️ All tickets sold out!' : `🎫 ${availableSeats} / ${maxAttendees} seats available`}
          </div>
        )}
        <div style={buttonRowStyle}>
          <button onClick={onCancel} style={cancelBtnStyle} disabled={loading}>Cancel</button>
          <button 
            onClick={onConfirm} 
            style={{
              ...confirmBtnStyle,
              opacity: isSoldOut ? 0.5 : 1,
              cursor: isSoldOut || loading ? 'not-allowed' : 'pointer',
              background: isSoldOut ? '#94a3b8' : '#2563eb'
            }} 
            disabled={loading || isSoldOut}
          >
            {loading ? 'Booking...' : isSoldOut ? 'Sold Out' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmModal;
