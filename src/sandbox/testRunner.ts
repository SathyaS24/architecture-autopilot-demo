import { spawnSync } from 'child_process';
import path from 'path';

export interface TestFailureDetails {
  testName?: string;
  file?: string;
  line?: number;
  expected?: string;
  received?: string;
  stack?: string;
}

export interface TestRunnerResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  failures: TestFailureDetails[];
}

/**
 * Executes the target repository's real test command in an isolated manner.
 * Parses the stdout and stderr to extract failure information where possible.
 */
export function runProjectTests(targetDir: string): TestRunnerResult {
  const resolvedTarget = path.resolve(targetDir);

  // Execute the real test runner command using Vitest (or npm test if needed) via vitest binary directly
  // By executing via the global or npx paths if available, or fallback to direct execution.
  // Since we cannot run npm install dynamically due to lack of network connectivity, we run the tests directly using vitest.
  // Wait, let's see if we can locate any vitest binary or simply run a spawned child process with 'npm test' or 'npx vitest run' or similar.
  // To avoid shell missing binaries, we will spawn with shell: true or try direct execution.
  const result = spawnSync('npm', ['test'], {
    cwd: resolvedTarget,
    encoding: 'utf8',
    shell: true,
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const exitCode = result.status;
  const success = exitCode === 0;

  const failures: TestFailureDetails[] = [];

  // Parse stdout/stderr for failing tests and stack trace info
  if (!success) {
    // Basic regex-based extractor for test failure outputs (such as Vitest/Jest style logs)
    const errorLines = stderr.split('\n').concat(stdout.split('\n'));
    let currentFailure: TestFailureDetails | null = null;

    for (const line of errorLines) {
      if (line.includes('FAIL') || line.includes('❌') || line.includes('Error:')) {
        if (currentFailure) {
          failures.push(currentFailure);
        }
        currentFailure = {
          testName: line.trim(),
          stack: '',
        };
      } else if (currentFailure) {
        if (line.includes('Expected') || line.includes('expected')) {
          currentFailure.expected = line.trim();
        } else if (line.includes('Received') || line.includes('received') || line.includes('Actual') || line.includes('actual')) {
          currentFailure.received = line.trim();
        } else if (line.includes('at ') && !currentFailure.stack?.includes(line)) {
          currentFailure.stack += line.trim() + '\n';
          const match = line.match(/at\s+(.+):(\d+):(\d+)/);
          if (match) {
            currentFailure.file = match[1];
            currentFailure.line = parseInt(match[2], 10);
          }
        }
      }
    }

    if (currentFailure) {
      failures.push(currentFailure);
    }
  }

  return {
    success,
    exitCode,
    stdout,
    stderr,
    failures,
  };
}
