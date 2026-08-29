import React from 'react';
import { ArchitectureNodeData } from '../utils/graphTransform.js';
import {
  FileCode,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';

interface NodeDetailsPanelProps {
  nodeData: ArchitectureNodeData | null;
  onClose: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ nodeData, onClose }) => {
  if (!nodeData) return null;

  const {
    label,
    filePath,
    layer,
    classes,
    functions,
    exports,
    dependencies,
    dependents,
    isInCycle,
    cyclePaths,
    hasViolation,
    violationReasons,
    archaeology,
    safeToRefactor,
    isLocked,
  } = nodeData;

  const getLayerColor = (l: string) => {
    switch (l) {
      case 'controllers':
        return 'bg-blue-900/40 text-blue-400 border-blue-600/50';
      case 'services':
        return 'bg-emerald-900/40 text-emerald-400 border-emerald-600/50';
      case 'repositories':
        return 'bg-purple-900/40 text-purple-400 border-purple-600/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-96 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-5 overflow-y-auto text-slate-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileCode className="w-5 h-5 text-indigo-400 shrink-0" />
          <h3 className="font-semibold text-lg text-white truncate" title={label}>
            {label}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* File Path */}
      <div className="text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all mb-4 text-slate-400">
        {filePath}
      </div>

      {/* Layer Badge & Refactor Status */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getLayerColor(layer)} flex items-center gap-1.5`}>
          <Layers className="w-3.5 h-3.5" />
          {layer.toUpperCase()}
        </span>

        {isLocked ? (
          <span className="px-2.5 py-1 text-xs font-medium rounded-md border bg-amber-950/60 text-amber-400 border-amber-600/60 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            LOCKED (WORKAROUND)
          </span>
        ) : safeToRefactor ? (
          <span className="px-2.5 py-1 text-xs font-medium rounded-md border bg-emerald-950/60 text-emerald-400 border-emerald-600/60 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            SAFE TO REFACTOR
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-medium rounded-md border bg-rose-950/60 text-rose-400 border-rose-600/60 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            RISK / UNSAFE
          </span>
        )}
      </div>

      {/* Archaeology Details (Member 2 integration) */}
      <div className="mb-4 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          Archaeology Status
        </div>
        {archaeology ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Classification:</span>
              <span className="font-medium text-slate-200">{archaeology.classification}</span>
            </div>
            {archaeology.supportingCommitSha && (
              <div className="flex justify-between">
                <span className="text-slate-400">Commit SHA:</span>
                <span className="font-mono text-indigo-400">{archaeology.supportingCommitSha}</span>
              </div>
            )}
            {archaeology.commitMessage && (
              <div>
                <span className="text-slate-400 block mb-0.5">Commit Msg:</span>
                <span className="italic text-slate-300 bg-slate-900 p-1.5 rounded block">
                  "{archaeology.commitMessage}"
                </span>
              </div>
            )}
            <div className="mt-1 text-slate-400">
              <span className="font-medium text-slate-300">Reason:</span> {archaeology.reason}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No archaeology data attached yet.</div>
        )}
      </div>

      {/* Cycle & Violation Alerts */}
      {(isInCycle || hasViolation) && (
        <div className="mb-4 space-y-2">
          {isInCycle && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-200">Part of Circular Dependency</div>
                {cyclePaths && (
                  <ul className="mt-1 list-disc list-inside text-rose-300/80 font-mono text-[11px] space-y-0.5">
                    {cyclePaths.map((cp, idx) => (
                      <li key={idx} className="truncate" title={cp}>
                        {cp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {hasViolation && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-200">Architectural Layer Violation</div>
                {violationReasons && (
                  <ul className="mt-1 list-disc list-inside text-amber-300/80 text-[11px] space-y-0.5">
                    {violationReasons.map((vr, idx) => (
                      <li key={idx}>{vr}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dependencies (Outgoing) */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          Dependencies ({dependencies.length})
        </h4>
        {dependencies.length > 0 ? (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {dependencies.map((dep, i) => (
              <div
                key={i}
                className="text-xs font-mono bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-800/80 text-slate-300 truncate"
                title={dep}
              >
                {dep.split(/[/\\]/).pop() || dep}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No dependencies</div>
        )}
      </div>

      {/* Dependents (Incoming) */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          Dependents ({dependents.length})
        </h4>
        {dependents.length > 0 ? (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {dependents.map((dep, i) => (
              <div
                key={i}
                className="text-xs font-mono bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-800/80 text-slate-300 truncate"
                title={dep}
              >
                {dep.split(/[/\\]/).pop() || dep}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No dependents</div>
        )}
      </div>

      {/* AST Declarations */}
      <div className="mt-auto pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Classes:</span>
          <span className="font-mono text-slate-200">{classes.length > 0 ? classes.join(', ') : 'None'}</span>
        </div>
        <div className="flex justify-between">
          <span>Functions:</span>
          <span className="font-mono text-slate-200">{functions.length > 0 ? functions.join(', ') : 'None'}</span>
        </div>
        <div className="flex justify-between">
          <span>Exports:</span>
          <span className="font-mono text-slate-200">{exports.length > 0 ? exports.join(', ') : 'None'}</span>
        </div>
      </div>
    </div>
  );
};
