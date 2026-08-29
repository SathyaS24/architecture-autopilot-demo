import path from 'path';
import { analyzeProject } from '../analyzer.js';
import { ArchReport } from '../types.js';

export interface ComparisonResult {
  before: {
    cycleCount: number;
    layerViolationCount: number;
    healthScore: number;
    analyzedFileCount: number;
    dependencyCount: number;
  };
  after: {
    cycleCount: number;
    layerViolationCount: number;
    healthScore: number;
    analyzedFileCount: number;
    dependencyCount: number;
  };
  delta: {
    cycleCount: number;
    layerViolationCount: number;
    healthScore: number;
    analyzedFileCount: number;
    dependencyCount: number;
  };
}

/**
 * Executes a fresh post-refactoring architecture analysis
 * and calculates the exact architectural delta.
 */
export function compareArchitecture(
  targetDir: string,
  baselineReport: ArchReport
): ComparisonResult {
  const resolvedTarget = path.resolve(targetDir);
  
  // Execute a fresh analyzer run on the post-refactored state
  const { report: postReport } = analyzeProject(resolvedTarget);

  const before = {
    cycleCount: baselineReport.cycleCount,
    layerViolationCount: baselineReport.layerViolationCount,
    healthScore: baselineReport.healthScore.score,
    analyzedFileCount: baselineReport.analyzedFileCount,
    dependencyCount: baselineReport.dependencyCount,
  };

  const after = {
    cycleCount: postReport.cycleCount,
    layerViolationCount: postReport.layerViolationCount,
    healthScore: postReport.healthScore.score,
    analyzedFileCount: postReport.analyzedFileCount,
    dependencyCount: postReport.dependencyCount,
  };

  const delta = {
    cycleCount: after.cycleCount - before.cycleCount,
    layerViolationCount: after.layerViolationCount - before.layerViolationCount,
    healthScore: after.healthScore - before.healthScore,
    analyzedFileCount: after.analyzedFileCount - before.analyzedFileCount,
    dependencyCount: after.dependencyCount - before.dependencyCount,
  };

  return {
    before,
    after,
    delta,
  };
}
