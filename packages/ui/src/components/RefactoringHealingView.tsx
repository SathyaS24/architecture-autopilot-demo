import React from 'react';
import {
  RefactoringStrategy,
  TestSuiteResult,
  HealingAttemptResult,
  InvariantProof
} from '../types/pipeline.js';
import { ArchReport } from '../../../src/types.js';
import {
  Wrench,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  FileCode,
  Layers,
  Sparkles,
  Award,
  AlertTriangle,
  GitBranch,
  FileCheck
} from 'lucide-react';

interface RefactoringHealingViewProps {
  strategy?: RefactoringStrategy;
  testResult?: TestSuiteResult;
  healingAttempts: HealingAttemptResult[];
  invariantProof?: InvariantProof;
  finalReport?: ArchReport;
}

export const RefactoringHealingView: React.FC<RefactoringHealingViewProps> = ({
  strategy,
  testResult,
  healingAttempts,
  invariantProof,
  finalReport
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Refactoring Strategy & Extracted Interfaces */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-indigo-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Refactoring & Decoupling Strategy</h3>
            <p className="text-xs text-slate-400">Dependency inversion, interface extraction & file synthesis</p>
          </div>
        </div>

        {strategy ? (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-indigo-300 text-sm">{strategy.name}</span>
                <span className="px-2.5 py-0.5 text-[11px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-md">
                  ID: {strategy.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">{strategy.description}</p>

              {/* Target & Modified Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Target Files:</span>
                  <div className="space-y-1">
                    {strategy.targetFiles.map((tf, i) => (
                      <div key={i} className="font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
                        {tf}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Modified / Created Files:</span>
                  <div className="space-y-1">
                    {strategy.modifiedFiles.map((mf, i) => (
                      <div key={i} className="font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-emerald-400">
                        {mf}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Extracted Interfaces */}
            {strategy.extractedInterfaces.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Extracted Abstractions & Interfaces ({strategy.extractedInterfaces.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                  {strategy.extractedInterfaces.map((iface, i) => (
                    <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-indigo-300 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{iface}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-4 text-center">
            No refactoring strategy generated yet.
          </div>
        )}
      </div>

      {/* 2. Test Execution & Healing Attempts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Test Suite Execution & Self-Healing Loop</h3>
              <p className="text-xs text-slate-400">Automated test runs, error diagnostics, and iterative resolution</p>
            </div>
          </div>

          {testResult && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg">
                Total: {testResult.total}
              </span>
              <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-lg">
                Passed: {testResult.passed}
              </span>
              {testResult.failed > 0 && (
                <span className="px-3 py-1 bg-rose-950 border border-rose-800 text-rose-300 rounded-lg">
                  Failed: {testResult.failed}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Test Failures (if any) */}
        {testResult && testResult.failures.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-300 text-xs font-bold w-fit">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>TEST FAILED</span>
            </div>
            <div className="space-y-3">
              {testResult.failures.map((f, i) => (
                <div key={i} className="bg-rose-950/30 border border-rose-900/80 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-rose-200 font-bold border-b border-rose-900/60 pb-2">
                    <span className="text-sm">{f.testName}</span>
                    <span className="font-mono text-[11px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900">{f.file}</span>
                  </div>
                  <div className="text-rose-300 font-mono text-[11px] bg-rose-950/60 p-2.5 rounded border border-rose-900/60">
                    <span className="font-bold text-rose-200">Error Message:</span> {f.message}
                  </div>
                  {f.expected && (
                    <div className="text-emerald-400 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="font-bold text-slate-400">Expected Value:</span> {f.expected}
                    </div>
                  )}
                  {f.received && (
                    <div className="text-rose-400 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="font-bold text-slate-400">Received Value:</span> {f.received}
                    </div>
                  )}
                  {f.stack && (
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-400 font-mono text-[10px] overflow-x-auto whitespace-pre">
                      <span className="font-bold text-slate-300 block mb-1">Stack Trace:</span>
                      {f.stack}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Healing Attempts */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Healing Iteration Log ({healingAttempts.length} Attempts)
          </h4>
          {healingAttempts.length > 0 ? (
            <div className="space-y-3">
              {healingAttempts.map((attempt) => (
                <div
                  key={attempt.attemptNumber}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    attempt.status === 'SUCCESS'
                      ? 'bg-emerald-950/20 border-emerald-900/80'
                      : 'bg-amber-950/20 border-amber-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-mono text-[11px]">
                        #{attempt.attemptNumber}
                      </span>
                      Strategy: {attempt.strategyApplied}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        attempt.status === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-amber-950 text-amber-400 border border-amber-700'
                      }`}
                    >
                      {attempt.status}
                    </span>
                  </div>

                  {attempt.resolvedIssues && attempt.resolvedIssues.length > 0 && (
                    <div className="text-emerald-300 text-[11px]">
                      <span className="font-semibold text-slate-300">Resolved:</span>{' '}
                      {attempt.resolvedIssues.join(', ')}
                    </div>
                  )}

                  {attempt.diff && (
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
                      {attempt.diff}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-3 text-center bg-slate-950 rounded-xl border border-slate-800">
              No healing attempts were required or triggered.
            </div>
          )}
        </div>
      </div>

      {/* 3. Invariant Proof Verification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-950/80 border border-purple-700/60 rounded-xl text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Architectural Invariant Proof</h3>
              <p className="text-xs text-slate-400">Formal behavior preservation & rule assertion validation</p>
            </div>
          </div>

          {invariantProof && (
            <div
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                invariantProof.proofStatus === 'VERIFIED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : invariantProof.proofStatus === 'FAILED'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}
            >
              {invariantProof.proofStatus === 'VERIFIED' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>INVARIANT PROOF: {invariantProof.proofStatus}</span>
            </div>
          )}
        </div>

        {invariantProof ? (
          <div className="space-y-4 text-xs">
            {/* Preserved Behaviors */}
            <div>
              <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Preserved System Behaviors:
              </h4>
              <ul className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {invariantProof.preservedBehaviors.map((b, i) => (
                  <li key={i} className="text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verified Architectural Rules */}
            <div>
              <h4 className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Verified Architectural Rules:
              </h4>
              <ul className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {invariantProof.verifiedRules.map((r, i) => (
                  <li key={i} className="text-slate-300 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {invariantProof.proofHash && (
              <div className="font-mono text-[11px] text-slate-500 bg-slate-950 p-2 rounded border border-slate-800">
                Proof Hash: {invariantProof.proofHash}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-4 text-center">
            Invariant proof not yet evaluated.
          </div>
        )}
      </div>
    </div>
  );
};
