import path from 'path';
import fs from 'fs';
import { findTsFiles, parseTsFile } from './parser.js';
import { DependencyGraph } from './graph.js';
import { findCycles } from './cycles.js';
import { detectLayerViolations } from './layers.js';
import { generateReport } from './report.js';
import { ArchReport, FileInfo } from './types.js';
import { ArchaeologyReport } from './archaeology.js';
import { getGitHistory, normalizePath } from './git.js';
import { calculateCoChanges } from './cochange.js';
import { classifyDebtAndSafety } from './classifier.js';

export interface AnalyzerResult {
  report: ArchReport;
  files: Map<string, FileInfo>;
  graph: DependencyGraph;
  archaeology?: ArchaeologyReport;
}

/**
 * Public function to run Git Archaeology analysis.
 */
export function runArchaeology(targetDir: string, filesList: string[]): ArchaeologyReport {
  const resolvedTarget = normalizePath(targetDir);
  const warnings: string[] = [];

  const commits = getGitHistory(resolvedTarget);
  if (commits.length === 0) {
    warnings.push('No Git history found or Git is not available.');
  }

  const normalizedFilesList = filesList.map((file) => normalizePath(file));

  const filesResults = normalizedFilesList.map((file) => {
    const fileCommits = commits.filter((c) => c.changedFiles.includes(file));
    const classificationResult = classifyDebtAndSafety(file, fileCommits);

    return {
      file,
      ...classificationResult,
      commitHistory: fileCommits,
    };
  });

  const coChanges = calculateCoChanges(commits, normalizedFilesList);

  return {
    analyzedPath: resolvedTarget,
    files: filesResults,
    coChanges,
    warnings,
  };
}

/**
 * Public function to analyze a target directory.
 */
export function analyzeProject(targetDir: string): AnalyzerResult {
  const resolvedTarget = path.resolve(targetDir);
  const tsFiles = findTsFiles(resolvedTarget);

  const filesMap: Map<string, FileInfo> = new Map();
  const graph = new DependencyGraph();

  // Parse all TS files
  for (const file of tsFiles) {
    const fileInfo = parseTsFile(file);
    filesMap.set(fileInfo.filePath, fileInfo);
    graph.addNode(fileInfo.filePath);
  }

  // Construct dependency graph
  for (const [filePath, fileInfo] of filesMap.entries()) {
    for (const depPath of fileInfo.dependencies) {
      graph.addEdge(filePath, depPath);
    }
  }

  // Detect circular dependencies
  const cycles = findCycles(graph);

  // Detect layer violations
  const violations = detectLayerViolations(filesMap);

  // Generate report
  const report = generateReport(
    filesMap.size,
    graph.getDependencyCount(),
    cycles,
    violations
  );

  let archaeology: ArchaeologyReport | undefined;
  try {
    archaeology = runArchaeology(resolvedTarget, Array.from(filesMap.keys()));
  } catch (err: any) {
    // Gracefully ignore and fallback
  }

  return {
    report,
    files: filesMap,
    graph,
    archaeology,
  };
}
