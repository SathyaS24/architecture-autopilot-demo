export type ArchLayer = 'controllers' | 'services' | 'repositories' | 'unknown';

export interface FileInfo {
  filePath: string;
  layer: ArchLayer;
  imports: string[];       // Unresolved import strings (raw)
  dependencies: string[];  // Resolved absolute/relative file paths
  classes: string[];
  functions: string[];
  exports: string[];
}

export interface LayerViolation {
  sourceFile: string;
  sourceLayer: ArchLayer;
  targetFile: string;
  targetLayer: ArchLayer;
  reason: string;
}

export interface HealthScore {
  score: number;      // 0 - 100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface ArchReport {
  analyzedFileCount: number;
  dependencyCount: number;
  cycleCount: number;
  layerViolationCount: number;
  totalIssueCount: number;
  cycles: string[][]; // Array of cycles, each cycle is a list of filePaths in order
  violations: LayerViolation[];
  healthScore: HealthScore;
}
