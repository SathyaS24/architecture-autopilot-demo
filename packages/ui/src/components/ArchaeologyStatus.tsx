import React from 'react';
import { ArchaeologyReport, ArchaeologyClassification } from '../types/pipeline.js';
import {
  History,
  Lock,
  ShieldCheck,
  ShieldAlert,
  GitCommit,
  CheckCircle2,
  AlertOctagon,
  FileCode,
  Layers
} from 'lucide-react';

interface ArchaeologyStatusProps {
  report: ArchaeologyReport | null;
}

export const ArchaeologyStatus: React.FC<ArchaeologyStatusProps> = ({ report }) => {
  if (!report) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        <History className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">Git Archaeology report not yet generated.</p>
      </div>
    );
  }

  const getClassificationBadge = (classification: ArchaeologyClassification, isLocked: boolean) => {
    if (isLocked || classification === 'INTENTIONAL_WORKAROUND') {
      return (
        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-purple-950 border border-purple-700 text-purple-300 flex items-center gap-1.5 shadow-sm">
          <Lock className="w-3.5 h-3.5 text-purple-400" />
          LOCKED WORKAROUND
        </span>
      );
    }

    switch (classification) {
      case 'CLEAN':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            CLEAN
          </span>
        );
      case 'HISTORICAL_DEBT':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-950 border border-amber-700 text-amber-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-amber-400" />
            HISTORICAL DEBT
          </span>
        );
      case 'HIGH_RISK_LEGACY':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-950 border border-rose-700 text-rose-300 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            HIGH RISK LEGACY
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
            {classification}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-indigo-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-lg">Git Archaeology & Intent Classification</h3>
            <p className="text-xs text-slate-400">
              Commit history analysis, workaround locks, and refactoring safety validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-purple-950/60 border border-purple-800/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-purple-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            {report.lockedWorkaroundsCount} Locked Intentional Workarounds
          </div>
          <div className="bg-emerald-950/60 border border-emerald-800/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {report.safeToRefactorCount} Safe to Refactor
          </div>
        </div>
      </div>

      {/* File List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.analyzedFiles.map((file, idx) => {
          const isWorkaround = file.classification === 'INTENTIONAL_WORKAROUND' || file.isLocked;
          // MANDATORY RULE: For INTENTIONAL_WORKAROUND, never allow UI to mark it as refactorable
          const effectiveSafeToRefactor = isWorkaround ? false : file.safeToRefactor;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isWorkaround
                  ? 'bg-purple-950/20 border-purple-900/80 shadow-purple-950/10'
                  : effectiveSafeToRefactor
                  ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/10 border-rose-900/60'
              }`}
            >
              {/* Top Row: File Name & Classification */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-200 text-sm truncate" title={file.filePath}>
                    {file.filePath.split(/[/\\]/).pop()}
                  </span>
                </div>
                {getClassificationBadge(file.classification, isWorkaround)}
              </div>

              {/* Path */}
              <div className="text-[11px] font-mono text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 truncate mb-3">
                {file.filePath}
              </div>

              {/* Refactorable Status */}
              <div className="mb-3">
                {isWorkaround ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-950/80 p-2 rounded-lg border border-purple-800/80">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>WORKAROUND LOCKED — REFUTED FROM AUTOMATED REFACTORING</span>
                  </div>
                ) : effectiveSafeToRefactor ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/60">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Safe for automated refactoring</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-950/60 p-2 rounded-lg border border-rose-800/60">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Unsafe / High Risk (Manual inspection required)</span>
                  </div>
                )}
              </div>

              {/* Commit SHA & Message */}
              {(file.supportingCommitSha || file.commitMessage) && (
                <div className="text-xs bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  {file.supportingCommitSha && (
                    <div className="flex items-center gap-2 font-mono text-indigo-400 text-[11px]">
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>{file.supportingCommitSha}</span>
                    </div>
                  )}
                  {file.commitMessage && (
                    <div className="text-slate-300 italic text-[11px] font-sans">
                      "{file.commitMessage}"
                    </div>
                  )}
                </div>
              )}

              {/* Reasoning */}
              <div className="mt-2.5 text-xs text-slate-400">
                <span className="font-medium text-slate-300">Archaeology Reasoning:</span> {file.reason}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
