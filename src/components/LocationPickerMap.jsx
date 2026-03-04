import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from 'lucide-react';

// Fix default Leaflet marker icon broken in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper: fly map to new position
function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 15, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

const LocationPickerMap = ({ value, onChange }) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [markerPos, setMarkerPos] = useState(null); // { lat, lng }
  const [flyTo, setFlyTo] = useState(null);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search using Nominatim
  const handleSearch = useCallback((q) => {
    setQuery(q);
    onChange && onChange(q); // reflect partial input to parent
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/geocode/search?q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [onChange]);

  const handleSelect = (item) => {
    const label = item.display_name;
    setQuery(label);
    setResults([]);
    setShowDropdown(false);
    const pos = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setMarkerPos(pos);
    setFlyTo(pos);
    onChange && onChange(label);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Search input + dropdown */}
      <div style={{ position: 'relative' }}>
        <Search size={17} style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          color: '#94a3b8', pointerEvents: 'none', zIndex: 2
        }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search for a venue or location..."
          autoComplete="off"
          style={{
            width: '100%',
            padding: '14px 16px 14px 48px',
            borderRadius: showDropdown ? '12px 12px 0 0' : 12,
            border: '2px solid #2563eb',
            fontSize: '1rem',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border 0.2s',
            background: '#fff',
          }}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            color: '#94a3b8', fontSize: 13
          }}>Searching…</span>
        )}
        {/* Dropdown results */}
        {showDropdown && results.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              border: '2px solid #2563eb',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              zIndex: 9999,
              boxShadow: '0 8px 24px rgba(37,99,235,0.12)',
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {results.map((item, i) => (
              <div
                key={item.place_id || i}
                onMouseDown={() => handleSelect(item)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <MapPin size={15} style={{ flexShrink: 0, marginTop: 3, color: '#3b82f6' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name || item.display_name.split(',')[0]}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.display_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaflet Map */}
      <div style={{
        borderRadius: showDropdown ? 0 : '0 0 12px 12px',
        overflow: 'hidden',
        border: '2px solid #e2e8f0',
        borderTop: 'none',
        height: 240,
        position: 'relative',
        zIndex: 1
      }}>
        <MapContainer
          center={markerPos ? [markerPos.lat, markerPos.lng] : [27.7172, 85.3240]}
          zoom={markerPos ? 15 : 7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {flyTo && <FlyTo coords={flyTo} />}
          {markerPos && (
            <Marker position={[markerPos.lat, markerPos.lng]}>
              <Popup>{query || 'Selected Location'}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPickerMap;
