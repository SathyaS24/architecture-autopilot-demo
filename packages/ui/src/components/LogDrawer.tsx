import React, { useState } from 'react';
import { PipelineEvent, EventStatus } from '../types/pipeline.js';
import {
  Terminal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Lock,
  Loader2,
  ListFilter
} from 'lucide-react';

interface LogDrawerProps {
  events: PipelineEvent[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export const LogDrawer: React.FC<LogDrawerProps> = ({ events, isOpen = true, onToggle }) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const toggleExpand = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  const filteredEvents = events.filter((ev) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'FAILED') return ev.status === 'failed';
    if (filterStatus === 'HEALING') return ev.healingAttempt !== undefined || ev.name.includes('Healing');
    return true;
  });

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60">
            <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-950/80 text-rose-400 border border-rose-700/60">
            <XCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-950/80 text-blue-400 border border-blue-700/60 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> IN PROGRESS
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950/80 text-amber-400 border border-amber-700/60">
            <AlertCircle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      case 'locked':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-950/80 text-purple-400 border border-purple-700/60">
            <Lock className="w-3.5 h-3.5" /> LOCKED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3.5 h-3.5" /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/80 border border-indigo-700/60 rounded-lg text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">Pipeline Structured Event Log</h3>
            <p className="text-xs text-slate-400">Chronological execution stream (Stages 1 - 15)</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <ListFilter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2 py-0.5 rounded ${filterStatus === 'ALL' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setFilterStatus('FAILED')}
              className={`px-2 py-0.5 rounded ${filterStatus === 'FAILED' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Failed
            </button>
            <button
              onClick={() => setFilterStatus('HEALING')}
              className={`px-2 py-0.5 rounded ${filterStatus === 'HEALING' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Healing
            </button>
          </div>

          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Event list stream */}
      {isOpen && (
        <div className="p-4 max-h-[480px] overflow-y-auto space-y-3 bg-slate-950/50">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              No events matched the current filter.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isExpanded = expandedEventId === event.id;

              return (
                <div
                  key={event.id}
                  className={`border rounded-xl p-3.5 transition-all duration-200 ${
                    event.status === 'failed'
                      ? 'bg-rose-950/20 border-rose-900/60'
                      : event.status === 'warning'
                      ? 'bg-amber-950/20 border-amber-900/60'
                      : event.status === 'success'
                      ? 'bg-slate-900/80 border-slate-800'
                      : 'bg-slate-900/40 border-slate-800/60'
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(event.id)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {event.stageNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 text-sm truncate">{event.name}</span>
                          {event.healingAttempt !== undefined && (
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-700/60 rounded flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" /> Attempt #{event.healingAttempt}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {event.timestamp || new Date().toISOString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(event.status)}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded event details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-2">
                      {event.details && (
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 whitespace-pre-wrap">
                          {event.details}
                        </div>
                      )}

                      {event.failureDetails && (
                        <div className="bg-rose-950/40 border border-rose-800/80 p-2.5 rounded text-rose-300">
                          <div className="font-bold text-rose-200 mb-1 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Failure Diagnostics:
                          </div>
                          <pre className="whitespace-pre-wrap text-[11px] overflow-x-auto">{event.failureDetails}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
