import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CommitInfo } from './archaeology.js';

/**
 * Normalizes absolute path by resolving symlinks, drive casing, and slashes.
 */
export function normalizePath(p: string): string {
  let resolved = path.resolve(p);
  try {
    resolved = fs.realpathSync.native(resolved);
  } catch {
    try {
      resolved = fs.realpathSync(resolved);
    } catch {
      // Keep resolved target
    }
  }
  if (resolved.match(/^[a-zA-Z]:/)) {
    resolved = resolved[0].toUpperCase() + resolved.substring(1);
  }
  return resolved.replace(/\\/g, '/');
}

/**
 * Finds the Git executable on Windows or falls back to system 'git'.
 */
export function findGitExecutable(): string {
  const winPaths = [
    'C:\\Program Files\\Git\\bin\\git.exe',
    'C:\\Program Files (x86)\\Git\\bin\\git.exe',
  ];
  for (const p of winPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return 'git';
}

/**
 * Safely runs a Git command and returns its output.
 * Returns null or throws if git is not available or if execution fails.
 */
export function runGitCommand(args: string[], workDir: string): string | null {
  const gitPath = findGitExecutable();
  try {
    const output = execFileSync(gitPath, args, {
      cwd: workDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'], // ignore stderr to prevent console pollution
      maxBuffer: 10 * 1024 * 1024, // 10MB limit
    });
    return output;
  } catch (error) {
    // If it fails because the folder is not a Git repo or Git isn't installed
    return null;
  }
}

/**
 * Parses git log output using the structured format:
 * COMMIT:SHA|Author|Date|Subject
 * File list lines...
 */
export function parseGitLog(output: string, resolvedTarget: string): CommitInfo[] {
  const commits: CommitInfo[] = [];
  const lines = output.split(/\r?\n/);
  let currentCommit: CommitInfo | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('COMMIT:')) {
      if (currentCommit) {
        commits.push(currentCommit);
      }
      const rawMetadata = trimmed.substring('COMMIT:'.length);
      const [sha, author, date, message] = rawMetadata.split('|');

      currentCommit = {
        sha: sha || '',
        author: author || '',
        date: date || '',
        message: message || '',
        changedFiles: [],
      };
    } else if (currentCommit) {
      // It should be a file change line, e.g. "A\tpath/to/file" or "M\tpath/to/file"
      // Git log --name-status outputs "STATUS\tFILE" or "STATUS\tFILE1\tFILE2" for renames
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const filePath = parts[parts.length - 1]; // get the target file path
        // Resolve absolute path relative to target directory to stay consistent
        const absolutePath = normalizePath(path.resolve(resolvedTarget, filePath));
        currentCommit.changedFiles.push(absolutePath);
      }
    }
  }

  if (currentCommit) {
    commits.push(currentCommit);
  }

  return commits;
}

/**
 * Retrieves full Git history of a directory.
 */
export function getGitHistory(workDir: string): CommitInfo[] {
  const resolvedTarget = path.resolve(workDir);
  const logArgs = [
    'log',
    '--name-status',
    '--pretty=format:COMMIT:%H|%an|%ad|%s',
  ];
  const output = runGitCommand(logArgs, resolvedTarget);
  if (!output) {
    return [];
  }

  // Get git repo toplevel root to resolve file paths correctly
  const toplevelOutput = runGitCommand(['rev-parse', '--show-toplevel'], resolvedTarget);
  let gitRoot = resolvedTarget;
  if (toplevelOutput) {
    const trimmed = toplevelOutput.trim();
    gitRoot = path.resolve(trimmed);
  }
  gitRoot = normalizePath(gitRoot);

  return parseGitLog(output, gitRoot);
}
