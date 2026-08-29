#!/usr/bin/env node
import path from 'path';
import { analyzeProject } from './analyzer.js';

function run() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || '.';
  const resolvedTarget = path.resolve(targetDir);

  console.log(`Analyzing: ${resolvedTarget}\n`);

  try {
    const { report } = analyzeProject(resolvedTarget);

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
