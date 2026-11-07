import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Clock, Check } from 'lucide-react';
import api from '../services/api';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

export default function ReadingFormModal({ isOpen, onClose, onSaved, initialReading }) {
  const isEditing = Boolean(initialReading);
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialReading) {
      setDate(initialReading.reading_date || todayStr);
      setSlot(initialReading.slot || SLOTS[0]);
      setValue(String(initialReading.value || ''));
    } else {
      setDate(todayStr);
      setSlot(SLOTS[0]);
      setValue('');
    }
    setError('');
  }, [initialReading, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    // 1. Date cannot be in the future
    if (!date) {
      return 'Please select a date.';
    }
    if (date > todayStr) {
      return 'Date cannot be in the future.';
    }

    // 2. Slot selection
    if (!slot || !SLOTS.includes(slot)) {
      return 'Please select a valid time slot.';
    }

    // 3. Value is required
    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Please enter a glucose value.';
    }

    // 4. Value whole number between 40 and 600
    const num = Number(value);
    const isWholeNumber = Number.isInteger(num) && !String(value).includes('.');

    if (!isWholeNumber || num < 40 || num > 600) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErr = validateForm();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reading_date: date,
        slot,
        value: parseInt(value, 10)
      };

      if (isEditing) {
        await api.put(`/readings/${initialReading.id}`, payload);
      } else {
        await api.post('/readings', payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      const serverMsg = err.response?.data?.error || 'Failed to save reading. Please try again.';
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {isEditing ? 'Edit Blood Glucose Reading' : 'Log Blood Glucose Reading'}
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Record daily readings to monitor your health
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              data-testid="error-message"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label htmlFor="reading-date" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Reading Date
            </label>
            <div className="relative">
              <input
                id="reading-date"
                type="date"
                max={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 text-sm font-medium transition-all"
                required
              />
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Time Slot (Up to 4 per day)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SLOTS.map((s) => {
                const isSelected = slot === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{s}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value in mg/dl */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="glucose-value" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Glucose Value
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Whole number (40–600 mg/dl)</span>
            </div>
            <div className="relative">
              <input
                id="glucose-value"
                type="number"
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 text-sm font-semibold transition-all pr-16"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                mg/dl
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Reading' : 'Save Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
