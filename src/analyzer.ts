import path from 'path';
import { findTsFiles, parseTsFile } from './parser.js';
import { DependencyGraph } from './graph.js';
import { findCycles } from './cycles.js';
import { detectLayerViolations } from './layers.js';
import { generateReport } from './report.js';
import { ArchReport, FileInfo } from './types.js';

export interface AnalyzerResult {
  report: ArchReport;
  files: Map<string, FileInfo>;
  graph: DependencyGraph;
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

  return {
    report,
    files: filesMap,
    graph,
  };
}
