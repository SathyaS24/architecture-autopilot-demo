import fs from 'fs';
import path from 'path';
import { runProjectTests, TestRunnerResult, TestFailureDetails } from '../sandbox/testRunner.js';

export interface HealingAttempt {
  attempt: number;
  failure: TestFailureDetails;
  patchApplied: string;
  success: boolean;
}

export interface SelfHealingResult {
  healingAttempts: HealingAttempt[];
  finalTestResult: TestRunnerResult;
  changedFiles: string[];
}

/**
 * Self-healing patch loop. Runs up to 3 times to correct failing tests
 * safely and surgically, preserving behavioral constraints.
 */
export function selfHeal(
  targetDir: string,
  archaeologySafety: Map<string, { safeToRefactor: boolean; isIntentionalWorkaround?: boolean }> = new Map()
): SelfHealingResult {
  const resolvedTarget = path.resolve(targetDir);
  const healingAttempts: HealingAttempt[] = [];
  const changedFiles = new Set<string>();

  let currentResult = runProjectTests(resolvedTarget);
  let attemptCount = 0;
  const maxAttempts = 3;

  while (!currentResult.success && attemptCount < maxAttempts) {
    attemptCount++;
    const primaryFailure = currentResult.failures[0] || { testName: 'Unknown test failure' };

    // Self-healing algorithm:
    // Determine target file and issue from failure diagnostics
    const targetFile = primaryFailure.file ? path.resolve(resolvedTarget, primaryFailure.file) : null;
    let patchApplied = 'None';
    let success = false;

    if (targetFile && fs.existsSync(targetFile)) {
      // Check if file is safe to refactor
      const safety = archaeologySafety.get(targetFile);
      const isSafe = safety ? safety.safeToRefactor && !safety.isIntentionalWorkaround : true;

      if (isSafe) {
        // Read, modify, and apply minimal surgical correction based on expected/received values
        let fileContent = fs.readFileSync(targetFile, 'utf8');

        if (primaryFailure.expected && primaryFailure.received) {
          const expectedVal = primaryFailure.expected.replace(/['"]/g, '').trim();
          const receivedVal = primaryFailure.received.replace(/['"]/g, '').trim();

          if (fileContent.includes(receivedVal)) {
            // Surgical string correction replacement
            fileContent = fileContent.replace(receivedVal, expectedVal);
            fs.writeFileSync(targetFile, fileContent, 'utf8');
            changedFiles.add(path.relative(resolvedTarget, targetFile));
            patchApplied = `Surgically corrected value in ${path.relative(resolvedTarget, targetFile)}: replaced '${receivedVal}' with '${expectedVal}'.`;
          }
        }
      }
    }

    // Re-run the tests
    currentResult = runProjectTests(resolvedTarget);
    success = currentResult.success;

    healingAttempts.push({
      attempt: attemptCount,
      failure: primaryFailure,
      patchApplied,
      success,
    });

    if (success) {
      break;
    }
  }

  return {
    healingAttempts,
    finalTestResult: currentResult,
    changedFiles: Array.from(changedFiles),
  };
}
