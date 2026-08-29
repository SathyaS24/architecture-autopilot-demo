import { HealthScore, LayerViolation, ArchReport } from './types.js';

/**
 * Calculates a deterministic architecture health score.
 */
export function calculateHealthScore(
  cycleCount: number,
  layerViolationCount: number
): HealthScore {
  // Base score
  let score = 100;

  // Deduct 10 points per cycle (max deduction 50)
  const cycleDeduction = Math.min(cycleCount * 10, 50);

  // Deduct 15 points per layer violation (max deduction 50)
  const violationDeduction = Math.min(layerViolationCount * 15, 50);

  score = Math.max(0, score - cycleDeduction - violationDeduction);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';

  if (score >= 90) {
    grade = 'A';
    status = 'HEALTHY';
  } else if (score >= 75) {
    grade = 'B';
    status = 'HEALTHY';
  } else if (score >= 60) {
    grade = 'C';
    status = 'WARNING';
  } else if (score >= 40) {
    grade = 'D';
    status = 'WARNING';
  } else {
    grade = 'F';
    status = 'CRITICAL';
  }

  return { score, grade, status };
}

/**
 * Generates the full architecture report.
 */
export function generateReport(
  fileCount: number,
  dependencyCount: number,
  cycles: string[][],
  violations: LayerViolation[]
): ArchReport {
  const cycleCount = cycles.length;
  const layerViolationCount = violations.length;
  const totalIssueCount = cycleCount + layerViolationCount;
  const healthScore = calculateHealthScore(cycleCount, layerViolationCount);

  return {
    analyzedFileCount: fileCount,
    dependencyCount,
    cycleCount,
    layerViolationCount,
    totalIssueCount,
    cycles,
    violations,
    healthScore,
  };
}
