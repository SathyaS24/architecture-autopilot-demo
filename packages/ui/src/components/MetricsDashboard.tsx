import React from 'react';
import { ArchReport } from '../../../src/types.js';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCode,
  GitBranch,
  Repeat,
  ShieldAlert,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';

interface MetricsDashboardProps {
  baselineReport: ArchReport;
  finalReport?: ArchReport;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ baselineReport, finalReport }) => {
  const currentReport = finalReport || baselineReport;
  const { healthScore, analyzedFileCount, dependencyCount, cycleCount, layerViolationCount, totalIssueCount } = currentReport;

  // Calculate Deltas if finalReport exists
  const hasComparison = !!finalReport;
  const scoreDelta = hasComparison ? finalReport.healthScore.score - baselineReport.healthScore.score : 0;
  const cycleDelta = hasComparison ? finalReport.cycleCount - baselineReport.cycleCount : 0;
  const violationDelta = hasComparison ? finalReport.layerViolationCount - baselineReport.layerViolationCount : 0;
  const issueDelta = hasComparison ? finalReport.totalIssueCount - baselineReport.totalIssueCount : 0;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-600/60';
      case 'B':
        return 'text-blue-400 bg-blue-950/80 border-blue-600/60';
      case 'C':
        return 'text-amber-400 bg-amber-950/80 border-amber-600/60';
      case 'D':
      case 'F':
        return 'text-rose-400 bg-rose-950/80 border-rose-600/60';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> HEALTHY
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-950 border border-amber-700 text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> WARNING
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-950 border border-rose-700 text-rose-400 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Health Score Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-400" />
            Architecture Health
          </span>
          {getStatusBadge(healthScore.status)}
        </div>

        <div className="flex items-baseline gap-3 my-2">
          <span className="text-4xl font-extrabold text-white font-mono">{healthScore.score}</span>
          <span className="text-xs text-slate-500 font-medium">/ 100</span>

          <span className={`ml-auto text-2xl font-black px-3 py-0.5 rounded-xl border ${getGradeColor(healthScore.grade)}`}>
            {healthScore.grade}
          </span>
        </div>

        {hasComparison ? (
          <div className="text-xs pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Health Delta:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts (From {baselineReport.healthScore.score})
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            Baseline evaluation metric
          </div>
        )}
      </div>

      {/* 2. Files & Dependencies */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <FileCode className="w-4 h-4 text-blue-400" />
          Codebase Scope
        </div>

        <div className="grid grid-cols-2 gap-2 my-1">
          <div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{analyzedFileCount}</div>
            <div className="text-[11px] text-slate-400">Analyzed Files</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{dependencyCount}</div>
            <div className="text-[11px] text-slate-400">Dependencies</div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Target Directory:</span>
          <span className="font-mono text-slate-400">demo-project</span>
        </div>
      </div>

      {/* 3. Circular Dependencies Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Repeat className="w-4 h-4 text-rose-400" />
          Circular Dependencies
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div className="text-3xl font-extrabold font-mono text-rose-400">{cycleCount}</div>
          {hasComparison && (
            <div className="text-xs text-slate-400 font-mono">
              Before: <span className="text-rose-300 line-through mr-1">{baselineReport.cycleCount}</span>
              After: <span className="text-emerald-400 font-bold">{finalReport.cycleCount}</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Status:</span>
          {cycleCount === 0 ? (
            <span className="text-emerald-400 font-bold">0 Cycles (Clean)</span>
          ) : (
            <span className="text-rose-400 font-bold">{cycleCount} Active Cycles</span>
          )}
        </div>
      </div>

      {/* 4. Layer Violations Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Layer Violations
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div className="text-3xl font-extrabold font-mono text-amber-400">{layerViolationCount}</div>
          {hasComparison && (
            <div className="text-xs text-slate-400 font-mono">
              Before: <span className="text-amber-300 line-through mr-1">{baselineReport.layerViolationCount}</span>
              After: <span className="text-emerald-400 font-bold">{finalReport.layerViolationCount}</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>Total Issues:</span>
          <span className="font-mono text-slate-200 font-bold">{totalIssueCount}</span>
        </div>
      </div>
    </div>
  );
};
