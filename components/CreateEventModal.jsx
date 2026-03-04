import React from "react";

export default function CreateEventModal({ open, onClose, onSubmit }) {
  if (!open) return null;

  return (
    <div className="org-modal-overlay">
      <div className="org-modal" style={{ maxWidth: 480, width: '95%', borderRadius: 20, boxShadow: '0 8px 32px rgba(59,130,246,0.12)' }}>
        <div className="org-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', letterSpacing: -1 }}>Create New Event</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, borderRadius: 12, padding: 4, cursor: 'pointer', color: '#64748b' }} aria-label="Close">×</button>
        </div>
        <form className="org-form" onSubmit={onSubmit} style={{ gap: 18 }}>
          <div className="org-form-group">
            <label htmlFor="eventName">Event Name</label>
            <input id="eventName" name="eventName" type="text" placeholder="e.g. Summer Music Festival" required />
          </div>
          <div className="org-form-row" style={{ display: 'flex', gap: 16 }}>
            <div className="org-form-group" style={{ flex: 1 }}>
              <label htmlFor="date">Date</label>
              <input id="date" name="date" type="date" required />
            </div>
            <div className="org-form-group" style={{ flex: 1 }}>
              <label htmlFor="startTime">Start Time</label>
              <input id="startTime" name="startTime" type="time" required />
            </div>
          </div>
          <div className="org-form-group">
            <label htmlFor="venue">Venue / Location</label>
            <input id="venue" name="venue" type="text" placeholder="e.g. Kathmandu City Hall" required />
          </div>
          <div className="org-form-group">
            <label htmlFor="description">Brief Description</label>
            <textarea id="description" name="description" placeholder="Tell people about your event..." rows={3} required />
          </div>
          <div className="org-form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue="General">
              <option value="General">General</option>
              <option value="Music">Music</option>
              <option value="Conference">Conference</option>
              <option value="Workshop">Workshop</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            <button type="button" className="org-btn" style={{ background: '#f1f5f9', color: '#0f172a', flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="org-btn" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', boxShadow: '0 4px 16px rgba(59,130,246,0.12)', flex: 1 }}>Publish Event</button>
          </div>
        </form>
      </div>
    </div>
  );
}
