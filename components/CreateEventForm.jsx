import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { EventSchema } from '../pages/private/schema/event.schema';
import ReactDOM from 'react-dom';

const MODAL_ROOT_ID = 'modal-root';

const CreateEventForm = ({ onSubmit, onCancel, defaultValues = {}, errors = {} }) => {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(EventSchema),
    defaultValues,
  });

  // Debug: Log when modal is rendered
  console.log('CreateEventForm modal rendered');

  // Ensure modal-root exists
  let modalRoot = document.getElementById(MODAL_ROOT_ID);
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = MODAL_ROOT_ID;
    document.body.appendChild(modalRoot);
  }

  const modalContent = (
    <div className="org-modal-overlay" onClick={onCancel} style={{ background: 'rgba(15, 23, 42, 0.4)', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <div className="org-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', maxWidth: 480, width: '95%', borderRadius: 20, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '32px 24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="org-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#0f172a', letterSpacing: -0.5 }}>{defaultValues && defaultValues.title ? 'Edit Event' : 'Create New Event'}</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 24, borderRadius: 12, padding: 8, cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }} aria-label="Close" onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={(e) => e.currentTarget.style.background = 'none'}><X size={24} /></button>
        </div>
        <form className="org-form" onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="org-form-group" style={{ width: '100%' }}>
            <label htmlFor="eventName" style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a', fontSize: '0.95rem' }}>Event Name</label>
            <input id="eventName" type="text" placeholder="e.g. Summer Music Festival" {...register('title')} style={{ width: '100%', borderRadius: 10, border: '2px solid #e2e8f0', padding: '14px 18px', fontSize: '1rem', fontFamily: 'inherit', transition: 'all 0.3s' }} />
            {formState.errors.title && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 6, display: 'block' }}>{formState.errors.title.message}</span>}
          </div>
          <div className="org-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%' }}>
            <div className="org-form-group" style={{ flex: 1 }}>
              <label htmlFor="date" style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a', fontSize: '0.95rem' }}>Date</label>
              <input id="date" type="date" {...register('date')} style={{ width: '100%', borderRadius: 10, border: '2px solid #e2e8f0', padding: '14px 18px', fontSize: '1rem', fontFamily: 'inherit', transition: 'all 0.3s' }} />
              {formState.errors.date && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 6, display: 'block' }}>{formState.errors.date.message}</span>}
            </div>
            <div className="org-form-group" style={{ flex: 1 }}>
              <label htmlFor="startTime" style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a', fontSize: '0.95rem' }}>Time</label>
              <input id="startTime" type="time" {...register('time')} style={{ width: '100%', borderRadius: 10, border: '2px solid #e2e8f0', padding: '14px 18px', fontSize: '1rem', fontFamily: 'inherit', transition: 'all 0.3s' }} />
              {formState.errors.time && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 6, display: 'block' }}>{formState.errors.time.message}</span>}
            </div>
          </div>
          <div className="org-form-group" style={{ width: '100%' }}>
            <label htmlFor="venue" style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a', fontSize: '0.95rem' }}>Venue / Location</label>
            <input id="venue" type="text" placeholder="e.g. Kathmandu City Hall" {...register('venue')} style={{ width: '100%', borderRadius: 10, border: '2px solid #e2e8f0', padding: '14px 18px', fontSize: '1rem', fontFamily: 'inherit', transition: 'all 0.3s' }} />
            {formState.errors.venue && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 6, display: 'block' }}>{formState.errors.venue.message}</span>}
          </div>
          <div className="org-form-group" style={{ width: '100%' }}>
            <label htmlFor="description" style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a', fontSize: '0.95rem' }}>Description</label>
            <textarea id="description" rows={4} placeholder="Tell people about your event..." {...register('description')} style={{ width: '100%', borderRadius: 10, border: '2px solid #e2e8f0', padding: '14px 18px', fontSize: '1rem', fontFamily: 'inherit', transition: 'all 0.3s', resize: 'vertical', minHeight: 100 }}></textarea>
            {formState.errors.description && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 6, display: 'block' }}>{formState.errors.description.message}</span>}
          </div>
          <div className="org-form-group" style={{ width: '100%' }}>
            <label htmlFor="category" style={{ fontWeight: 700, marginBottom: 8, color: '#0f172a', fontSize: '0.95rem' }}>Category</label>
            <select id="category" {...register('category')} style={{ width: '100%', borderRadius: 10, border: '2px solid #e2e8f0', padding: '14px 18px', fontSize: '1rem', fontFamily: 'inherit', transition: 'all 0.3s' }}>
              <option value="General">General</option>
              <option value="Music">Music</option>
              <option value="Tech">Tech</option>
              <option value="Sports">Sports</option>
              <option value="Food">Food & Drink</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="org-btn org-btn-secondary" style={{ flex: 1, padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', border: '2px solid #e2e8f0', background: '#f1f5f9', color: '#0f172a', cursor: 'pointer', transition: 'all 0.3s' }} onClick={onCancel}>Cancel</button>
            <button type="submit" className="org-btn org-btn-primary" style={{ flex: 1, padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', cursor: 'pointer', transition: 'all 0.3s', border: 'none' }}>
              {defaultValues && defaultValues.title ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default CreateEventForm;
