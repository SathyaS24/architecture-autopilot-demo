#!/usr/bin/env node
import path from 'path';
import { analyzeProject } from './analyzer.js';

function run() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || '.';
  const resolvedTarget = path.resolve(targetDir);

  console.log(`Analyzing: ${resolvedTarget}\n`);

  try {
    const { report, archaeology } = analyzeProject(resolvedTarget);

    console.log(`Found ${report.analyzedFileCount} TypeScript files.\n`);

    console.log(`Architecture Report`);
    console.log(`Files: ${report.analyzedFileCount}`);
    console.log(`Dependencies: ${report.dependencyCount}`);
    console.log(`Cycles: ${report.cycleCount}`);
    console.log(`Layer violations: ${report.layerViolationCount}`);
    console.log(`Total issues: ${report.totalIssueCount}\n`);

    console.log(`Health Score`);
    console.log(`Score: ${report.healthScore.score}/100`);
    console.log(`Grade: ${report.healthScore.grade}`);
    console.log(`Status: ${report.healthScore.status}\n`);

    if (report.cycles.length > 0) {
      console.log(`Circular Dependencies`);
      report.cycles.forEach((cycle, idx) => {
        const filenames = cycle.map((f) => path.basename(f)).join(' -> ');
        console.log(`  [${idx + 1}] ${filenames}`);
        // print relative paths too for more clarity
        cycle.forEach((file) => {
          console.log(`      - ${path.relative(resolvedTarget, file)}`);
        });
      });
      console.log();
    } else {
      console.log(`Circular Dependencies: None\n`);
    }

    if (report.violations.length > 0) {
      console.log(`Layer Violations`);
      report.violations.forEach((v, idx) => {
        const srcRel = path.relative(resolvedTarget, v.sourceFile);
        const tgtRel = path.relative(resolvedTarget, v.targetFile);
        console.log(`  [${idx + 1}] ${srcRel} (${v.sourceLayer}) -> ${tgtRel} (${v.targetLayer})`);
        console.log(`      Reason: ${v.reason}`);
      });
      console.log();
    } else {
      console.log(`Layer Violations: None\n`);
    }

    if (archaeology) {
      console.log(`Git Archaeology`);
      if (archaeology.warnings.length > 0) {
        archaeology.warnings.forEach((warn) => console.log(`  Warning: ${warn}`));
        console.log();
      } else {
        console.log(`  Analyzed files: ${archaeology.files.length}`);
        console.log(`  Total historical commits mined: ${new Set(archaeology.files.flatMap((f) => f.commitHistory.map((c) => c.sha))).size}`);
        console.log();

        console.log(`  File Classifications & Refactoring Safety:`);
        archaeology.files.forEach((fileRes) => {
          const relPath = path.relative(resolvedTarget, fileRes.file);
          const safety = fileRes.safeToRefactor ? 'SAFE TO REFACTOR' : 'LOCKED (UNSAFE)';
          console.log(`    - ${relPath}:`);
          console.log(`        Classification: ${fileRes.classification}`);
          console.log(`        Safety Status:  ${safety}`);
          console.log(`        Confidence:     ${(fileRes.confidence * 100).toFixed(0)}%`);
          console.log(`        Reason:         ${fileRes.reason}`);
          if (fileRes.supportingCommitSha) {
            console.log(`        Evidence:       Commit ${fileRes.supportingCommitSha.substring(0, 7)}: "${fileRes.supportingCommitMessage}"`);
          }
        });
        console.log();

        if (archaeology.coChanges.length > 0) {
          console.log(`  Historical File Co-Changes (Logical Coupling):`);
          archaeology.coChanges.slice(0, 10).forEach((cc) => {
            const relA = path.relative(resolvedTarget, cc.fileA);
            const relB = path.relative(resolvedTarget, cc.fileB);
            console.log(`    - ${relA} <-> ${relB}:`);
            console.log(`        Co-Changes:     ${cc.coChangeCount} commits`);
            console.log(`        Coupling Strength: ${(cc.strength * 100).toFixed(1)}%`);
          });
          console.log();
        } else {
          console.log(`  Historical File Co-Changes: None detected\n`);
        }
      }
    }

    // Return non-zero status code if critical issues are found, to be CI-friendly
    if (report.healthScore.status === 'CRITICAL') {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error(`Error during analysis:`, err.message);
    process.exit(1);
  }
}

run();
