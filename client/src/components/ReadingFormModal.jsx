import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
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
    if (!date) {
      return 'Please select a date.';
    }
    if (date > todayStr) {
      return 'Date cannot be in the future.';
    }

    if (!slot || !SLOTS.includes(slot)) {
      return 'Please select a valid time slot.';
    }

    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Please enter a glucose value.';
    }

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <div>
            <h3 className="text-base font-bold text-white">
              {isEditing ? 'Edit Blood Glucose Reading' : 'Log Blood Glucose Reading'}
            </h3>
            <p className="text-xs text-royal-300 mt-0.5">
              Record reading for daily reports
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              data-testid="error-message"
              className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 font-medium"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label htmlFor="reading-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Reading Date
            </label>
            <input
              id="reading-date"
              type="date"
              max={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-royal-500 font-medium"
              required
            />
          </div>

          {/* Slot */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
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
                    className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'border-royal-500 bg-royal-950 text-royal-200'
                        : 'border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{s}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-royal-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="glucose-value" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Glucose Value
              </label>
              <span className="text-[11px] text-slate-500">40–600 mg/dl</span>
            </div>
            <div className="relative">
              <input
                id="glucose-value"
                type="number"
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-royal-500 font-semibold pr-16"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 pointer-events-none">
                mg/dl
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-royal-600 hover:bg-royal-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Reading' : 'Save Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
