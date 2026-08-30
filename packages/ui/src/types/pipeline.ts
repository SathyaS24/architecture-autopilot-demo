import { ArchLayer, ArchReport, FileInfo, HealthScore, LayerViolation } from '../../../src/types.js';

export type PipelineStageName =
  | 'Repository Scan'
  | 'AST Extraction'
  | 'Dependency Graph'
  | 'Tarjan Cycle Detection'
  | 'Layer Analysis'
  | 'Git Archaeology'
  | 'Intent Classification'
  | 'Safety Lock'
  | 'LatentCode Strategy'
  | 'LatentCode Synthesis'
  | 'Sandbox Test'
  | 'Test Failure'
  | 'Self-Healing'
  | 'Fresh Architecture Analysis'
  | 'Invariant Proof';

export type EventStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'warning' | 'locked';

export interface PipelineEvent {
  id: string;
  stageNumber: number; // 1 to 15
  name: PipelineStageName;
  status: EventStatus;
  timestamp: string;
  details?: string;
  failureDetails?: string;
  healingAttempt?: number;
}

export type ArchaeologyClassification =
  | 'CLEAN'
  | 'HISTORICAL_DEBT'
  | 'INTENTIONAL_WORKAROUND'
  | 'HIGH_RISK_LEGACY';

export interface ArchaeologyFileEntry {
  filePath: string;
  layer: ArchLayer;
  classification: ArchaeologyClassification;
  safeToRefactor: boolean;
  supportingCommitSha?: string;
  commitMessage?: string;
  reason: string;
  isLocked: boolean;
}

export interface ArchaeologyReport {
  analyzedFiles: ArchaeologyFileEntry[];
  lockedWorkaroundsCount: number;
  safeToRefactorCount: number;
}

export interface RefactoringStrategy {
  id: string;
  name: string;
  description: string;
  targetFiles: string[];
  extractedInterfaces: string[];
  modifiedFiles: string[];
}

export interface TestFailureDetail {
  file: string;
  testName: string;
  message: string;
  expected?: string;
  received?: string;
  stack?: string;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  failures: TestFailureDetail[];
}

export interface HealingAttemptResult {
  attemptNumber: number;
  strategyApplied: string;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  diff?: string;
  resolvedIssues?: string[];
  timestamp: string;
}

export interface InvariantProof {
  proofStatus: 'VERIFIED' | 'UNVERIFIED' | 'FAILED';
  preservedBehaviors: string[];
  verifiedRules: string[];
  proofHash?: string;
}

export interface PipelineExecutionResult {
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'VERIFIED';
  baselineReport: ArchReport;
  finalReport?: ArchReport;
  files: Map<string, FileInfo>;
  archaeologyReport: ArchaeologyReport;
  refactoringStrategy?: RefactoringStrategy;
  testResult?: TestSuiteResult;
  healingAttempts: HealingAttemptResult[];
  invariantProof?: InvariantProof;
  events: PipelineEvent[];
  errorMessage?: string;
}
