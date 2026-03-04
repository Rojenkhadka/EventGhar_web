
import React, { useEffect, useState, useMemo } from 'react';
import { getMyBookings, cancelBooking } from '../../api/bookings';
import { Calendar, MapPin, Ticket, Users, Download, Trash2, X, Clock, Hash, User, CheckCircle2, Search } from 'lucide-react';

function formatBookingDate(date, timeStr) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d)) return null;
  const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (timeStr) {
    const match = String(timeStr).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
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
      return `${datePart} • ${displayH}:${min} ${ampm}`;
    }
  }
  return datePart + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateOnly(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTimeOnly(date) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d)) return null;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ── Simple QR-like grid for visual only ──────────────────────────────────────
function QRPlaceholder({ value }) {
  // deterministic pattern from booking id
  const seed = String(value || 'ticket').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const size = 7;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const r = Math.floor(i / size), c = i % size;
    // always fill corners (finder pattern)
    if ((r < 2 && c < 2) || (r < 2 && c >= size - 2) || (r >= size - 2 && c < 2)) return true;
    return ((seed * (i + 3) * 7) % 17) > 8;
  });
  return (
    <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 2, padding: 8, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
      {cells.map((on, i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: on ? '#1e1b4b' : 'transparent' }} />
      ))}
    </div>
  );
}

// ── Ticket Modal ──────────────────────────────────────────────────────────────
function TicketModal({ booking, onClose }) {
  const event = booking.event || {};
  const eventTitle    = event.title       || booking.eventTitle    || 'Event';
  const eventDateRaw  = event.date        || booking.eventDate     || null;
  const eventLocation = event.location    || booking.eventLocation || null;
  const eventImage    = booking.eventImage || event.image          || null;
  const eventDesc     = event.description || null;
  const organizerName = event.organizerName || booking.organizerName || null;
  const ticketCount   = booking.attendeeCount || booking.ticketCount || 1;
  const eventDate     = eventDateRaw ? new Date(eventDateRaw) : null;
  const eventTime     = event.time || booking.eventTime || (eventDate ? formatTimeOnly(eventDate) : null);

  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'CANCELED';
  const ticketId = `TKT-${String(booking.id).padStart(6, '0')}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440,
          maxHeight: '95vh', overflowY: 'auto',
          borderRadius: 28,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
        >
          <X size={18} color="#fff" />
        </button>

        {/* ── TOP: Banner + Title ── */}
        <div style={{
          position: 'relative', height: 220,
          background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#a855f7 100%)',
          borderRadius: '28px 28px 0 0', overflow: 'hidden',
        }}>
          {eventImage && (
            <img src={eventImage} alt={eventTitle}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          {/* gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 60%, transparent 100%)' }} />
          {/* Event name + organizer */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, right: 60 }}>
            {isCancelled && (
              <span style={{ display: 'inline-block', background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: 1, marginBottom: 8 }}>
                CANCELLED
              </span>
            )}
            {!isCancelled && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.85)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: 1, marginBottom: 8 }}>
                <CheckCircle2 size={11} /> CONFIRMED
              </span>
            )}
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {eventTitle}
            </h2>
            {organizerName && (
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '6px 0 0', fontWeight: 500 }}>
                Organized by <strong style={{ color: 'rgba(255,255,255,0.95)' }}>{organizerName}</strong>
              </p>
            )}
          </div>
        </div>

        {/* ── PERFORATED DIVIDER ── */}
        <div style={{ position: 'relative', background: '#fff', height: 24, display: 'flex', alignItems: 'center' }}>
          {/* Left notch */}
          <div style={{ position: 'absolute', left: -14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(6px)' }} />
          {/* Right notch */}
          <div style={{ position: 'absolute', right: -14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(6px)' }} />
          {/* Dashed line */}
          <div style={{ flex: 1, margin: '0 20px', borderTop: '2.5px dashed #e2e8f0' }} />
        </div>

        {/* ── MAIN TICKET BODY ── */}
        <div style={{ background: '#fff', padding: '4px 28px 24px' }}>
          {/* Detail rows */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 12px', marginBottom: 20 }}>
            <DetailCell icon={<Calendar size={15} color="#6366f1" />} label="Date" value={formatDateOnly(eventDate)} />
            <DetailCell icon={<Clock size={15} color="#6366f1" />} label="Time" value={eventTime || (eventDate ? formatTimeOnly(eventDate) : '—')} />
            {eventLocation && (
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailCell icon={<MapPin size={15} color="#6366f1" />} label="Venue / Location" value={eventLocation} />
              </div>
            )}
            <DetailCell icon={<Ticket size={15} color="#6366f1" />} label="Tickets" value={`${ticketCount} × Entry`} />
            <DetailCell icon={<Hash size={15} color="#6366f1" />} label="Booking ID" value={`#${booking.id}`} />
          </div>

          {eventDesc && (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 14px', marginBottom: 20, borderLeft: '3px solid #818cf8' }}>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{eventDesc}</p>
            </div>
          )}

          {/* ── PERFORATED DIVIDER 2 ── */}
          <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center', margin: '4px -28px 20px' }}>
            <div style={{ position: 'absolute', left: -14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,23,42,0.72)' }} />
            <div style={{ position: 'absolute', right: -14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(15,23,42,0.72)' }} />
            <div style={{ flex: 1, margin: '0 20px', borderTop: '2.5px dashed #e2e8f0' }} />
          </div>

          {/* ── STUB: QR + Ticket ID ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <QRPlaceholder value={booking.id} />
              <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 6, fontFamily: 'monospace', letterSpacing: 1 }}>
                SCAN TO VERIFY
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                borderRadius: 14, padding: '14px 18px',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, margin: '0 0 4px', textTransform: 'uppercase' }}>Ticket ID</p>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: 2, fontFamily: 'monospace' }}>{ticketId}</p>
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '10px 0 0', textAlign: 'center' }}>
                Present this ticket at the entrance
              </p>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          background: '#f8fafc', borderTop: '1px solid #f1f5f9',
          borderRadius: '0 0 28px 28px',
          padding: '14px 28px', display: 'flex', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 14,
              border: '1.5px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            Close
          </button>
          <button
            style={{
              flex: 2, padding: '11px 0', borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <Download size={16} /> Download Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailCell({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, lineHeight: 1.3 }}>{value || '—'}</span>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  // Start of today — events on today's date are still "upcoming"
  const startOfToday = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const reload = () => {
    setLoading(true);
    setError(null);
    getMyBookings()
      .then((res) => {
        const data = res?.bookings || (Array.isArray(res) ? res : []);
        setBookings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load bookings:', err);
        setError('Failed to load bookings. Please refresh.');
        setLoading(false);
      });
  };

  useEffect(() => { reload(); }, []);

  // ── Tab + Search filtering ──────────────────────────────────────────────
  // Compare at DAY level — events on today still count as upcoming
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const classifyBooking = (booking) => {
    const event = booking.event || {};
    const isCancelled = booking.status === 'CANCELLED' || booking.status === 'CANCELED';
    const isConfirmed = booking.status === 'CONFIRMED';
    const isPending   = booking.status === 'PENDING';
    const eventDateRaw = event.date || booking.eventDate || null;
    const eventDate = eventDateRaw ? new Date(eventDateRaw) : null;
    // An event is "past" only if its date was before the START of today
    const isPast = eventDate ? eventDate < startOfToday : false;
    return { isCancelled, isConfirmed, isPending, isPast };
  };

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const event = booking.event || {};
      const { isCancelled, isConfirmed, isPending, isPast } = classifyBooking(booking);

      let tabMatch = true;
      if (activeTab === 'upcoming')   tabMatch = !isCancelled && !isPast;
      if (activeTab === 'completed')  tabMatch = isConfirmed && isPast;
      if (activeTab === 'cancelled')  tabMatch = isCancelled;

      if (!tabMatch) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const title = (event.title || booking.eventTitle || '').toLowerCase();
      const loc = (event.location || booking.eventLocation || '').toLowerCase();
      const org = (event.organizerName || booking.organizerName || '').toLowerCase();
      return title.includes(q) || loc.includes(q) || org.includes(q);
    });
  }, [bookings, activeTab, searchTerm, startOfToday]);

  const TAB_LABELS = [    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const tabCount = (key) => {
    return bookings.filter((booking) => {
      const { isCancelled, isConfirmed, isPast } = classifyBooking(booking);
      if (key === 'upcoming')  return !isCancelled && !isPast;
      if (key === 'completed') return isConfirmed && isPast;
      if (key === 'cancelled') return isCancelled;
      return false;
    }).length;
  };

  return (
    <>
      {selectedTicket && <TicketModal booking={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      <div style={{ padding: '0 0.5rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 4, color: '#0f172a' }}>My Bookings</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Manage and view all your event bookings</p>

        {/* ── Tab Bar + Search ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 14, padding: 4, gap: 2 }}>
            {TAB_LABELS.map(({ key, label }) => {
              const active = activeTab === key;
              const count = tabCount(key);
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: '8px 18px', borderRadius: 11, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 14, transition: 'all 0.18s',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#4f46e5' : '#64748b',
                    boxShadow: active ? '0 1px 6px rgba(79,70,229,0.12)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{
                      background: active ? '#4f46e5' : '#94a3b8',
                      color: '#fff', fontSize: 11, fontWeight: 800,
                      borderRadius: 20, padding: '1px 7px', lineHeight: 1.6,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: 220, maxWidth: 360, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search events, venues…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 36px',
                border: '1.5px solid #e2e8f0', borderRadius: 12,
                fontSize: 14, color: '#334155', outline: 'none',
                background: '#fff', transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#818cf8'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>
        </div>

      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#94a3b8', fontSize: 15 }}>Loading bookings…</div>
      ) : error ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#ef4444', fontSize: 15 }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <Calendar size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <div style={{ color: '#94a3b8', fontSize: 15, fontWeight: 600 }}>
            {searchTerm ? 'No bookings match your search.' : `No ${activeTab} bookings.`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map((booking) => {
            const event = booking.event || {};

            // ── Field mapping ──────────────────────────────────────────
            const eventTitle     = event.title       || booking.eventTitle    || 'Event';
            const eventDateRaw   = event.date        || booking.eventDate     || null;
            const eventLocation  = event.location    || booking.eventLocation || null;
            const eventImage     = booking.eventImage || event.image          || null;
            const eventDesc      = event.description || null;
            const organizerName  = event.organizerName || booking.organizerName || null;
            const maxAttendees   = event.maxAttendees  || booking.eventMaxAttendees || null;
            const ticketCount    = booking.attendeeCount || booking.ticketCount || 1;
            const eventDate      = eventDateRaw ? new Date(eventDateRaw) : null;
            const eventTime      = event.time || booking.eventTime || null;
            const isUpcoming     = eventDate ? eventDate >= startOfToday : true;

            const isCancelled = booking.status === 'CANCELLED' || booking.status === 'CANCELED';
            const isPending   = booking.status === 'PENDING';

            const badgeBg   = isCancelled ? 'rgba(100,116,139,0.9)' : isPending ? 'rgba(245,158,11,0.92)' : 'rgba(34,197,94,0.92)';
            const badgeText = isCancelled ? 'CANCELLED' : isPending ? 'PENDING' : 'CONFIRMED';

            return (
              <div
                key={booking.id}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(30,41,59,0.06)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(30,41,59,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(30,41,59,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* ── Banner ── */}
                <div style={{
                  position: 'relative', width: '100%', height: 180, overflow: 'hidden', flexShrink: 0,
                  background: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 50%, #818cf8 100%)',
                }}>
                  {eventImage ? (
                    <img
                      src={eventImage}
                      alt={eventTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Calendar size={52} color="rgba(255,255,255,0.65)" strokeWidth={1.2} />
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600 }}>No banner uploaded</span>
                    </div>
                  )}
                  {/* Dark overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.5) 0%, transparent 60%)' }} />
                  {/* Status badge */}
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: badgeBg, color: '#fff',
                    fontSize: 11, fontWeight: 800, padding: '4px 12px',
                    borderRadius: 20, letterSpacing: 0.8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {badgeText}
                  </div>
                  {/* Date badge */}
                  {eventDate && (
                    <div style={{
                      position: 'absolute', bottom: 12, left: 12,
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      fontSize: 12, fontWeight: 700, padding: '5px 12px',
                      borderRadius: 20, letterSpacing: 0.3,
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                      {formatBookingDate(eventDate, eventTime)}
                    </div>
                  )}
                </div>

                {/* ── Card Body ── */}
                <div style={{ padding: '18px 20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                    {eventTitle}
                  </h3>

                  {organizerName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>{organizerName.charAt(0).toUpperCase()}</span>
                      </div>
                      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>By {organizerName}</span>
                    </div>
                  )}

                  {eventDesc && (
                    <p style={{
                      fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {eventDesc}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                    {eventLocation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} color="#94a3b8" />
                        <span style={{ fontSize: 13, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {eventLocation}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Ticket size={13} color="#94a3b8" />
                      <span style={{ fontSize: 13, color: '#64748b' }}>
                        {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
                      </span>
                    </div>
                    {maxAttendees && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={13} color="#94a3b8" />
                        <span style={{ fontSize: 13, color: '#64748b' }}>{maxAttendees} capacity</span>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, marginTop: 2 }}>
                    Booking #{booking.id}
                  </div>
                </div>

                {/* ── Footer ── */}
                <div style={{
                  display: 'flex', gap: 10, padding: '12px 20px',
                  borderTop: '1px solid #f1f5f9', background: '#fafbfc',
                }}>
                  {isCancelled ? (
                    <div style={{ flex: 1, textAlign: 'center', padding: 10, color: '#94a3b8', fontSize: 14, fontWeight: 700 }}>
                      Booking Cancelled
                    </div>
                  ) : isPending ? (
                    <>
                      <button style={{
                        flex: 1, padding: '10px 18px', borderRadius: 12,
                        border: '1.5px solid #e2e8f0', background: '#f1f5f9',
                        color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'default',
                      }}>
                        Waiting for Confirmation
                      </button>
                      {isUpcoming && (
                        <button
                          title="Cancel Booking"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to cancel this booking?')) {
                              try {
                                await cancelBooking(booking.id);
                                reload();
                              } catch {
                                alert('Failed to cancel. Please try again.');
                              }
                            }
                          }}
                          style={{
                            width: 42, height: 42, borderRadius: 12,
                            border: '1.5px solid #fee2e2', background: '#fff',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedTicket(booking)}
                        style={{
                          flex: 1, padding: '10px 18px', borderRadius: 12,
                          border: 'none',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        <Ticket size={15} /> View Ticket
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
}
