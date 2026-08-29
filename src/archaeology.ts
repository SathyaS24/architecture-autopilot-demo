export type ChangeIntent =
  | 'bug_fix'
  | 'feature'
  | 'refactor'
  | 'dependency_change'
  | 'test_change'
  | 'configuration_change'
  | 'documentation'
  | 'unknown';

export type DebtClassification =
  | 'ACCIDENTAL_DEBT'
  | 'INTENTIONAL_WORKAROUND'
  | 'INSUFFICIENT_EVIDENCE';

export interface CommitInfo {
  sha: string;
  author: string;
  date: string;
  message: string;
  changedFiles: string[];
}

export interface CoChangeRelation {
  fileA: string;
  fileB: string;
  coChangeCount: number;
  fileAChangeCount: number;
  fileBChangeCount: number;
  strength: number; // coChangeCount / Math.min(fileAChangeCount, fileBChangeCount)
}

export interface ArchaeologyFileResult {
  file: string;
  classification: DebtClassification;
  reason: string;
  safeToRefactor: boolean;
  supportingCommitSha?: string;
  supportingCommitMessage?: string;
  intent?: ChangeIntent;
  confidence: number; // 0 to 1
  commitHistory: CommitInfo[];
}

export interface ArchaeologyReport {
  analyzedPath: string;
  files: ArchaeologyFileResult[];
  coChanges: CoChangeRelation[];
  warnings: string[];
}
