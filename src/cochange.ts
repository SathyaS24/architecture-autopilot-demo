import { CoChangeRelation, CommitInfo } from './archaeology.js';

/**
 * Calculates historical co-change strength between files in the project.
 *
 * Formula:
 *   strength(A, B) = coChangeCount(A, B) / min(changeCount(A), changeCount(B))
 *
 * Why this formula:
 *   It calculates the overlap ratio relative to the less frequently changed file.
 *   This represents the conditional probability that if the less-frequently-changed file
 *   is modified, the other file is also modified. It serves as an excellent measure
 *   of structural or logical coupling without being biased by a file that changes in every commit.
 */
export function calculateCoChanges(
  commits: CommitInfo[],
  targetFiles: string[],
  minCoChanges = 1
): CoChangeRelation[] {
  const fileChangeCounts: Map<string, number> = new Map();
  const pairChangeCounts: Map<string, number> = new Map();

  // Initialize file change counts
  for (const file of targetFiles) {
    fileChangeCounts.set(file, 0);
  }

  // Count individual and joint occurrences
  for (const commit of commits) {
    // Only consider files of interest that were modified in this commit
    const modifiedTargetFiles = commit.changedFiles.filter((f) =>
      fileChangeCounts.has(f)
    );

    // Increment individual counts
    for (const f of modifiedTargetFiles) {
      fileChangeCounts.set(f, fileChangeCounts.get(f)! + 1);
    }

    // Increment joint counts for every unique pair of files changed in this commit
    for (let i = 0; i < modifiedTargetFiles.length; i++) {
      for (let j = i + 1; j < modifiedTargetFiles.length; j++) {
        const fileA = modifiedTargetFiles[i];
        const fileB = modifiedTargetFiles[j];

        // Keep order deterministic (alphabetical) for the key
        const key = fileA < fileB ? `${fileA}|||${fileB}` : `${fileB}|||${fileA}`;
        pairChangeCounts.set(key, (pairChangeCounts.get(key) || 0) + 1);
      }
    }
  }

  const relations: CoChangeRelation[] = [];

  for (const [key, coChangeCount] of pairChangeCounts.entries()) {
    if (coChangeCount < minCoChanges) continue;

    const [fileA, fileB] = key.split('|||');
    const fileAChangeCount = fileChangeCounts.get(fileA) || 0;
    const fileBChangeCount = fileChangeCounts.get(fileB) || 0;

    const minCount = Math.min(fileAChangeCount, fileBChangeCount);
    const strength = minCount > 0 ? coChangeCount / minCount : 0;

    relations.push({
      fileA,
      fileB,
      coChangeCount,
      fileAChangeCount,
      fileBChangeCount,
      strength,
    });
  }

  // Sort by strength descending, then by coChangeCount descending, then alphabetically
  return relations.sort((r1, r2) => {
    if (Math.abs(r2.strength - r1.strength) > 0.0001) {
      return r2.strength - r1.strength;
    }
    if (r2.coChangeCount !== r1.coChangeCount) {
      return r2.coChangeCount - r1.coChangeCount;
    }
    return r1.fileA.localeCompare(r2.fileA);
  });
}
