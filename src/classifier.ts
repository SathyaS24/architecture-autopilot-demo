import { ChangeIntent, CommitInfo, DebtClassification, ArchaeologyFileResult } from './archaeology.js';
import fs from 'fs';

/**
 * Deterministically classifies a commit message into a ChangeIntent.
 */
export function classifyChangeIntent(message: string): ChangeIntent {
  const lower = message.toLowerCase();

  if (
    lower.includes('fix') ||
    lower.includes('bug') ||
    lower.includes('crash') ||
    lower.includes('issue') ||
    lower.includes('error') ||
    lower.includes('solve') ||
    lower.includes('defect')
  ) {
    return 'bug_fix';
  }

  if (
    lower.includes('config') ||
    lower.includes('tsconfig') ||
    lower.includes('package.json') ||
    lower.includes('env')
  ) {
    return 'configuration_change';
  }

  if (
    lower.includes('dependency') ||
    lower.includes('dependencies') ||
    lower.includes('package') ||
    lower.includes('npm') ||
    lower.includes('import') ||
    lower.includes('lockfile')
  ) {
    return 'dependency_change';
  }

  if (
    lower.includes('test') ||
    lower.includes('spec') ||
    lower.includes('coverage') ||
    lower.includes('vitest') ||
    lower.includes('jest')
  ) {
    return 'test_change';
  }

  if (
    lower.includes('doc') ||
    lower.includes('docs') ||
    lower.includes('readme') ||
    lower.includes('comment') ||
    lower.includes('changelog')
  ) {
    return 'documentation';
  }

  if (
    lower.includes('refactor') ||
    lower.includes('cleanup') ||
    lower.includes('rewrite') ||
    lower.includes('simplify') ||
    lower.includes('restructure')
  ) {
    return 'refactor';
  }

  if (
    lower.includes('feat') ||
    lower.includes('feature') ||
    lower.includes('add') ||
    lower.includes('new') ||
    lower.includes('implement') ||
    lower.includes('introduce')
  ) {
    return 'feature';
  }

  return 'unknown';
}

/**
 * Evaluates file history and content to classify debt and refactoring safety.
 */
export function classifyDebtAndSafety(
  file: string,
  fileCommits: CommitInfo[]
): Omit<ArchaeologyFileResult, 'file' | 'commitHistory'> {
  let fileContent = '';
  try {
    if (fs.existsSync(file)) {
      fileContent = fs.readFileSync(file, 'utf8');
    }
  } catch (err) {
    // Gracefully ignore file reading failures
  }

  // 1. Check for intentional workarounds in commit history
  const intentionalCommitKeywords = [
    'kubernetes',
    'k8s',
    'liveness',
    'readiness',
    'probe',
    'heartbeat',
    'latency',
    'performance',
    'compliance',
    'compatibility',
    'operational workaround',
    'production requirement',
    'workaround',
    'production',
    'hotfix',
  ];

  for (const commit of fileCommits) {
    const msgLower = commit.message.toLowerCase();
    for (const kw of intentionalCommitKeywords) {
      if (msgLower.includes(kw)) {
        return {
          classification: 'INTENTIONAL_WORKAROUND',
          reason: `Intentional workaround detected in commit message: "${commit.message}" (keyword: "${kw}"). Refactoring this could impact production behavior/compliance.`,
          safeToRefactor: false,
          supportingCommitSha: commit.sha,
          supportingCommitMessage: commit.message,
          confidence: 0.9,
          intent: classifyChangeIntent(commit.message),
        };
      }
    }
  }

  // 2. Check for intentional workarounds in file comments/symbols
  const intentionalContentKeywords = [
    'liveness probe',
    'readiness probe',
    'kubernetes workaround',
    'k8s workaround',
    'heartbeat latency',
    'compliance requirement',
    'operational workaround',
    'production workaround',
  ];
  for (const kw of intentionalContentKeywords) {
    if (fileContent.toLowerCase().includes(kw)) {
      return {
        classification: 'INTENTIONAL_WORKAROUND',
        reason: `Intentional workaround pattern found in source code comments: "${kw}". Refactoring could break production liveness/compliance.`,
        safeToRefactor: false,
        confidence: 0.85,
        intent: fileCommits.length > 0 ? classifyChangeIntent(fileCommits[0].message) : 'unknown',
      };
    }
  }

  // 3. Check for accidental debt in commit history
  const accidentalCommitKeywords = [
    'quick fix',
    'temporary',
    'refactor later',
    'deadline',
    'hack',
    'fixme',
    'todo',
    'debt',
    'ugly',
    'dirty',
  ];

  for (const commit of fileCommits) {
    const msgLower = commit.message.toLowerCase();
    for (const kw of accidentalCommitKeywords) {
      if (msgLower.includes(kw)) {
        return {
          classification: 'ACCIDENTAL_DEBT',
          reason: `Accidental debt detected in commit message: "${commit.message}" (keyword: "${kw}"). Refactoring is recommended as this was marked as temporary.`,
          safeToRefactor: true,
          supportingCommitSha: commit.sha,
          supportingCommitMessage: commit.message,
          confidence: 0.9,
          intent: classifyChangeIntent(commit.message),
        };
      }
    }
  }

  // 4. Check for accidental debt in source comments (e.g. FIXME, TODO, hack)
  const accidentalContentKeywords = [
    '// fixme',
    '// todo',
    '/* fixme',
    '/* todo',
    '// hack',
    '// quick fix',
    '// temporary',
  ];
  for (const kw of accidentalContentKeywords) {
    if (fileContent.toLowerCase().includes(kw)) {
      return {
        classification: 'ACCIDENTAL_DEBT',
        reason: `Accidental debt pattern found in source code comments: "${kw}". Refactoring is highly recommended.`,
        safeToRefactor: true,
        confidence: 0.8,
        intent: fileCommits.length > 0 ? classifyChangeIntent(fileCommits[0].message) : 'unknown',
      };
    }
  }

  // 5. Default case: Insufficient Evidence
  const lastCommit = fileCommits[0];
  return {
    classification: 'INSUFFICIENT_EVIDENCE',
    reason: `Insufficient historical or structural evidence to confidently classify file. Refactoring locked for safety.`,
    safeToRefactor: false,
    supportingCommitSha: lastCommit?.sha,
    supportingCommitMessage: lastCommit?.message,
    confidence: 0.5,
    intent: lastCommit ? classifyChangeIntent(lastCommit.message) : 'unknown',
  };
}
