import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

function getGlucoseBadge(val) {
  if (val < 70) {
    return {
      label: 'Low',
      bg: 'bg-sky-950 text-sky-300 border-sky-800/80',
      dot: 'bg-sky-400'
    };
  }
  if (val <= 140) {
    return {
      label: 'Normal',
      bg: 'bg-royal-950 text-royal-200 border-royal-700/80',
      dot: 'bg-royal-400'
    };
  }
  if (val <= 199) {
    return {
      label: 'Elevated',
      bg: 'bg-amber-950 text-amber-300 border-amber-800/80',
      dot: 'bg-amber-400'
    };
  }
  return {
    label: 'High',
    bg: 'bg-rose-950 text-rose-300 border-rose-800/80',
    dot: 'bg-rose-400'
  };
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function ReadingsTable({
  readings,
  pagination,
  onPageChange,
  onEdit,
  onDelete
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-5">Time Slot</th>
              <th className="py-3 px-5">Glucose Value</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {readings.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Calendar className="w-6 h-6 text-slate-600" />
                    <p className="font-medium text-slate-300">No readings found</p>
                    <p className="text-xs text-slate-500">Log a new reading to start tracking</p>
                  </div>
                </td>
              </tr>
            ) : (
              readings.map((reading) => {
                const badge = getGlucoseBadge(reading.value);
                return (
                  <tr
                    key={reading.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-5 font-medium text-slate-200">
                      {formatDisplayDate(reading.reading_date)}
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {reading.slot}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-white">{reading.value}</span>
                        <span className="text-xs text-slate-500">mg/dl</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(reading)}
                          className="p-1.5 rounded text-slate-400 hover:text-royal-300 hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(reading)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-semibold text-slate-200">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-200">{pagination.totalPages}</span> ({pagination.total} entries)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl max-w-sm w-full p-6 border border-slate-800 shadow-2xl">
            <div className="w-10 h-10 rounded-lg bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white text-center">Delete Reading?</h4>
            <p className="text-xs text-slate-400 text-center mt-1.5 mb-6">
              Delete the <strong className="text-slate-200">{deleteTarget.slot}</strong> reading on{' '}
              <strong className="text-slate-200">{formatDisplayDate(deleteTarget.reading_date)}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
