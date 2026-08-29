import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { parseGitLog, findGitExecutable, runGitCommand, normalizePath } from '../src/git.js';
import { calculateCoChanges } from '../src/cochange.js';
import { classifyChangeIntent, classifyDebtAndSafety } from '../src/classifier.js';
import { runArchaeology } from '../src/analyzer.js';
import { CommitInfo } from '../src/archaeology.js';

describe('Git Output Parsing', () => {
  test('should parse structured git log correctly', () => {
    const rawLog = `COMMIT:26113206a59f5905bdb0351491eb5b075148a220|SathyaS24|Sat Aug 29 18:51:02 2026 +0530|Implement architecture analysis engine
A\tpackage.json
A\tsrc/analyzer.ts
A\tsrc/cli.ts
COMMIT:1234567890abcdef1234567890abcdef12345678|John Doe|Sun Aug 30 12:00:00 2026 +0530|fix: solve layer violation issue
M\tsrc/analyzer.ts
M\tsrc/layers.ts
`;
    const targetDir = path.resolve('/mock/dir');
    const parsed = parseGitLog(rawLog, targetDir);

    expect(parsed.length).toBe(2);

    expect(parsed[0].sha).toBe('26113206a59f5905bdb0351491eb5b075148a220');
    expect(parsed[0].author).toBe('SathyaS24');
    expect(parsed[0].date).toBe('Sat Aug 29 18:51:02 2026 +0530');
    expect(parsed[0].message).toBe('Implement architecture analysis engine');
    expect(parsed[0].changedFiles.map(f => path.basename(f))).toEqual([
      'package.json',
      'analyzer.ts',
      'cli.ts',
    ]);

    expect(parsed[1].sha).toBe('1234567890abcdef1234567890abcdef12345678');
    expect(parsed[1].author).toBe('John Doe');
    expect(parsed[1].message).toBe('fix: solve layer violation issue');
    expect(parsed[1].changedFiles.map(f => path.basename(f))).toEqual([
      'analyzer.ts',
      'layers.ts',
    ]);
  });
});

describe('Change Intent Classifier', () => {
  test('should classify bug fixes', () => {
    expect(classifyChangeIntent('fix layers bug')).toBe('bug_fix');
    expect(classifyChangeIntent('solved circular dependencies issue')).toBe('bug_fix');
    expect(classifyChangeIntent('defect resolution')).toBe('bug_fix');
  });

  test('should classify features', () => {
    expect(classifyChangeIntent('feat: add git archaeology module')).toBe('feature');
    expect(classifyChangeIntent('implement co-change analysis')).toBe('feature');
    expect(classifyChangeIntent('introduce safety lock')).toBe('feature');
  });

  test('should classify refactoring', () => {
    expect(classifyChangeIntent('refactor(cli): clean up log messages')).toBe('refactor');
    expect(classifyChangeIntent('simplify parser node visitor')).toBe('refactor');
    expect(classifyChangeIntent('rewrite cycles.ts in TypeScript')).toBe('refactor');
  });

  test('should classify dependency changes', () => {
    expect(classifyChangeIntent('update packages and npm dependencies')).toBe('dependency_change');
    expect(classifyChangeIntent('import vitest libraries')).toBe('dependency_change');
  });

  test('should classify test changes', () => {
    expect(classifyChangeIntent('add test coverage for git archaeology')).toBe('test_change');
    expect(classifyChangeIntent('vitest specs for tarjan algorithm')).toBe('test_change');
  });

  test('should classify configurations', () => {
    expect(classifyChangeIntent('modify tsconfig.json options')).toBe('configuration_change');
    expect(classifyChangeIntent('tweak build package.json')).toBe('configuration_change');
  });

  test('should classify documentation', () => {
    expect(classifyChangeIntent('update README.md with usage info')).toBe('documentation');
    expect(classifyChangeIntent('add comments to analyzer.ts')).toBe('documentation');
  });

  test('should return unknown for non-matching messages', () => {
    expect(classifyChangeIntent('just a random message with no keywords')).toBe('unknown');
  });
});

describe('File Co-Change Coupling Strength', () => {
  test('should calculate co-change strength based on shared commits', () => {
    const fileA = path.resolve('/mock/dir/fileA.ts');
    const fileB = path.resolve('/mock/dir/fileB.ts');
    const fileC = path.resolve('/mock/dir/fileC.ts');

    const commits: CommitInfo[] = [
      {
        sha: '1',
        author: 'A',
        date: 'D1',
        message: 'C1',
        changedFiles: [fileA, fileB],
      },
      {
        sha: '2',
        author: 'A',
        date: 'D2',
        message: 'C2',
        changedFiles: [fileA, fileB],
      },
      {
        sha: '3',
        author: 'A',
        date: 'D3',
        message: 'C3',
        changedFiles: [fileA, fileC],
      },
    ];

    // fileA changed 3 times, fileB changed 2 times, fileC changed 1 time.
    // co-changes:
    // (fileA, fileB) changed together 2 times.
    // (fileA, fileC) changed together 1 time.

    const relations = calculateCoChanges(commits, [fileA, fileB, fileC]);

    expect(relations.length).toBe(2);

    // Pair A & B: co-change count = 2. min(3, 2) = 2. strength = 2 / 2 = 100%
    const relationAB = relations.find(
      (r) =>
        (r.fileA === fileA && r.fileB === fileB) ||
        (r.fileA === fileB && r.fileB === fileA)
    );
    expect(relationAB).toBeDefined();
    expect(relationAB!.coChangeCount).toBe(2);
    expect(relationAB!.fileAChangeCount).toBe(3); // fileA (sorted alphabetically as fileA)
    expect(relationAB!.fileBChangeCount).toBe(2); // fileB (sorted alphabetically as fileB)
    expect(relationAB!.strength).toBe(1.0);

    // Pair A & C: co-change count = 1. min(3, 1) = 1. strength = 1 / 1 = 100%
    const relationAC = relations.find(
      (r) =>
        (r.fileA === fileA && r.fileB === fileC) ||
        (r.fileA === fileC && r.fileB === fileA)
    );
    expect(relationAC).toBeDefined();
    expect(relationAC!.coChangeCount).toBe(1);
    expect(relationAC!.strength).toBe(1.0);
  });
});

describe('Debt and Safety Classification', () => {
  const fileMock = path.resolve('/mock/dir/dummy.ts');

  test('should classify INTENTIONAL_WORKAROUND when Kubernetes or probe keyword is present', () => {
    const fileCommits: CommitInfo[] = [
      {
        sha: '1',
        author: 'A',
        date: 'D',
        message: 'Workaround for Kubernetes liveness probe latency issue',
        changedFiles: [fileMock],
      },
    ];

    const result = classifyDebtAndSafety(fileMock, fileCommits);
    expect(result.classification).toBe('INTENTIONAL_WORKAROUND');
    expect(result.safeToRefactor).toBe(false);
    expect(result.confidence).toBe(0.9);
    expect(result.supportingCommitSha).toBe('1');
    expect(result.intent).toBe('bug_fix'); // "issue" and "workaround" contains issue -> bug_fix
  });

  test('should classify ACCIDENTAL_DEBT when temporary/hack keyword is in commit message', () => {
    const fileCommits: CommitInfo[] = [
      {
        sha: '2',
        author: 'A',
        date: 'D',
        message: 'This is a dirty hack we must refactor later',
        changedFiles: [fileMock],
      },
    ];

    const result = classifyDebtAndSafety(fileMock, fileCommits);
    expect(result.classification).toBe('ACCIDENTAL_DEBT');
    expect(result.safeToRefactor).toBe(true);
    expect(result.confidence).toBe(0.9);
    expect(result.supportingCommitSha).toBe('2');
  });

  test('should classify INSUFFICIENT_EVIDENCE if no keywords are triggered', () => {
    const fileCommits: CommitInfo[] = [
      {
        sha: '3',
        author: 'A',
        date: 'D',
        message: 'Implement simple feature to do math',
        changedFiles: [fileMock],
      },
    ];

    const result = classifyDebtAndSafety(fileMock, fileCommits);
    expect(result.classification).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.safeToRefactor).toBe(false);
    expect(result.confidence).toBe(0.5);
  });
});

describe('Temporary Git Repository Integration', () => {
  let tempRepoDir: string;
  let hasGit = false;

  beforeAll(() => {
    // Determine if git is available
    const gitPath = findGitExecutable();
    try {
      execFileSync(gitPath, ['--version'], { stdio: 'ignore' });
      hasGit = true;
    } catch {
      hasGit = false;
    }

    if (hasGit) {
      tempRepoDir = path.join(os.tmpdir(), `test-git-archaeology-${Date.now()}`);
      fs.mkdirSync(tempRepoDir, { recursive: true });

      // Initialize git repo
      execFileSync(gitPath, ['init'], { cwd: tempRepoDir, stdio: 'ignore' });
      
      // Set configuration
      execFileSync(gitPath, ['config', 'user.name', 'Archaeology Tester'], { cwd: tempRepoDir, stdio: 'ignore' });
      execFileSync(gitPath, ['config', 'user.email', 'tester@archaeology.local'], { cwd: tempRepoDir, stdio: 'ignore' });
    }
  });

  afterAll(() => {
    if (hasGit && tempRepoDir && fs.existsSync(tempRepoDir)) {
      try {
        fs.rmSync(tempRepoDir, { recursive: true, force: true });
      } catch {
        // Ignored
      }
    }
  });

  test('should extract real Git history, co-changes, and classifications in a real repo', () => {
    if (!hasGit) {
      console.warn('Skipping integration test as Git is not installed.');
      return;
    }

    const gitPath = findGitExecutable();
    const file1 = path.join(tempRepoDir, 'FileA.ts');
    const file2 = path.join(tempRepoDir, 'FileB.ts');

    // Create FileA.ts
    fs.writeFileSync(file1, '// Source code FileA\n// Workaround for Kubernetes liveness probe latency\n');
    execFileSync(gitPath, ['add', 'FileA.ts'], { cwd: tempRepoDir });
    execFileSync(gitPath, ['commit', '-m', 'feat: initial commit for FileA'], { cwd: tempRepoDir });

    // Create FileB.ts with accidental debt comments
    fs.writeFileSync(file2, '// Source code FileB\n// FIXME: temporary dirty hack\n');
    execFileSync(gitPath, ['add', 'FileB.ts'], { cwd: tempRepoDir });
    execFileSync(gitPath, ['commit', '-m', 'feat: initial commit for FileB with hack'], { cwd: tempRepoDir });

    // Modify both together
    fs.appendFileSync(file1, '\n// Change A');
    fs.appendFileSync(file2, '\n// Change B');
    execFileSync(gitPath, ['add', 'FileA.ts', 'FileB.ts'], { cwd: tempRepoDir });
    execFileSync(gitPath, ['commit', '-m', 'fix: fix both files together in quick patch'], { cwd: tempRepoDir });

    // Run archaeology report
    const report = runArchaeology(tempRepoDir, [file1, file2]);

    expect(report.warnings.length).toBe(0);
    expect(report.files.length).toBe(2);

    const fileARes = report.files.find(f => f.file === normalizePath(file1));
    const fileBRes = report.files.find(f => f.file === normalizePath(file2));

    expect(fileARes).toBeDefined();
    expect(fileBRes).toBeDefined();

    // FileA should have INTENTIONAL_WORKAROUND due to Kubernetes keywords in the code comment
    expect(fileARes!.classification).toBe('INTENTIONAL_WORKAROUND');
    expect(fileARes!.safeToRefactor).toBe(false);

    // FileB should have ACCIDENTAL_DEBT due to FIXME/hack keywords in the code comment
    expect(fileBRes!.classification).toBe('ACCIDENTAL_DEBT');
    expect(fileBRes!.safeToRefactor).toBe(true);

    // Both files were modified together in the last commit, so they should have a co-change relationship
    expect(report.coChanges.length).toBe(1);
    expect(report.coChanges[0].coChangeCount).toBe(1);
    expect(report.coChanges[0].strength).toBeGreaterThan(0);
  });
});
