import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

function getGlucoseBadge(val) {
  if (val < 70) {
    return {
      label: 'Low',
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      dot: 'bg-sky-400',
      borderLeft: 'border-l-sky-500'
    };
  }
  if (val <= 140) {
    return {
      label: 'In Target',
      bg: 'bg-royal-500/10 text-royal-300 border-royal-500/20',
      dot: 'bg-royal-400',
      borderLeft: 'border-l-royal-500'
    };
  }
  if (val <= 199) {
    return {
      label: 'Elevated',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
      borderLeft: 'border-l-amber-500'
    };
  }
  return {
    label: 'High',
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    dot: 'bg-rose-400',
    borderLeft: 'border-l-rose-500'
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

function getRelativeDateLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
  return null;
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
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-5">Slot</th>
              <th className="py-3 px-5">Glucose Level</th>
              <th className="py-3 px-5">Classification</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {readings.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-xs mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                      <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-200 text-sm">No entries found</p>
                    <p className="text-xs text-slate-500">
                      Use the "Log Reading" button above to record your first blood glucose value.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              readings.map((reading) => {
                const badge = getGlucoseBadge(reading.value);
                const relLabel = getRelativeDateLabel(reading.reading_date);
                return (
                  <tr
                    key={reading.id}
                    className="hover:bg-slate-800/40 transition-colors duration-150 group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {formatDisplayDate(reading.reading_date)}
                        </span>
                        {relLabel && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-royal-950 text-royal-300 border border-royal-800/60">
                            {relLabel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700/50">
                        {reading.slot}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-base font-bold text-white tracking-tight">
                          {reading.value}
                        </span>
                        <span className="text-[11px] text-slate-500 font-sans font-normal">mg/dl</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(reading)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-royal-300 hover:bg-slate-800 transition-all duration-150"
                          title="Edit reading"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(reading)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all duration-150"
                          title="Delete reading"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/30 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{readings.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{pagination.total}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 mr-1">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-800 shadow-2xl animate-scaleUp">
            <div className="w-11 h-11 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white text-center">Delete Reading</h4>
            <p className="text-xs text-slate-400 text-center mt-1.5 mb-6 leading-relaxed">
              Are you sure you want to delete the <strong className="text-slate-200">{deleteTarget.slot}</strong> reading on{' '}
              <strong className="text-slate-200">{formatDisplayDate(deleteTarget.reading_date)}</strong>?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-750 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/40 disabled:opacity-50 transition-all"
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
