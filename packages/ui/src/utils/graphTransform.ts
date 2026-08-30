import { Node, Edge } from '@xyflow/react';
import { ArchReport, FileInfo, ArchLayer } from '../../../src/types.js';
import { ArchaeologyFileEntry, ArchaeologyReport } from '../types/pipeline.js';

export interface ArchitectureNodeData {
  label: string;
  filePath: string;
  layer: ArchLayer;
  classes: string[];
  functions: string[];
  exports: string[];
  dependencies: string[];
  dependents: string[];
  isInCycle: boolean;
  cyclePaths?: string[];
  hasViolation: boolean;
  violationReasons?: string[];
  archaeology?: ArchaeologyFileEntry;
  safeToRefactor: boolean;
  isLocked: boolean;
}

export interface GraphTransformation {
  nodes: Node<ArchitectureNodeData>[];
  edges: Edge[];
}

/**
 * Transforms actual engine ArchReport data & FileInfo map into React Flow nodes and edges.
 * Strictly uses engine data as source of truth.
 */
export function transformEngineReportToGraph(
  report: ArchReport,
  filesMap: Map<string, FileInfo>,
  archaeologyReport?: ArchaeologyReport
): GraphTransformation {
  const nodes: Node<ArchitectureNodeData>[] = [];
  const edges: Edge[] = [];

  // 1. Build dependents map (incoming dependencies for each file)
  const dependentsMap = new Map<string, string[]>();
  for (const [filePath, fileInfo] of filesMap.entries()) {
    if (!dependentsMap.has(filePath)) {
      dependentsMap.set(filePath, []);
    }
    for (const dep of fileInfo.dependencies) {
      if (!dependentsMap.has(dep)) {
        dependentsMap.set(dep, []);
      }
      dependentsMap.get(dep)!.push(filePath);
    }
  }

  // 2. Identify cycle participants
  const cycleFilesSet = new Set<string>();
  const fileToCyclesMap = new Map<string, string[]>();

  for (const cycle of report.cycles) {
    for (const file of cycle) {
      cycleFilesSet.add(file);
      if (!fileToCyclesMap.has(file)) {
        fileToCyclesMap.set(file, []);
      }
      fileToCyclesMap.get(file)!.push(cycle.join(' -> '));
    }
  }

  // 3. Identify layer violation participants
  const violationFilesSet = new Set<string>();
  const fileToViolationsMap = new Map<string, string[]>();

  for (const violation of report.violations) {
    violationFilesSet.add(violation.sourceFile);
    violationFilesSet.add(violation.targetFile);

    if (!fileToViolationsMap.has(violation.sourceFile)) {
      fileToViolationsMap.set(violation.sourceFile, []);
    }
    fileToViolationsMap.get(violation.sourceFile)!.push(violation.reason);
  }

  // 4. Organize nodes by layer for structured grid layout
  const layerGroups: Record<ArchLayer, FileInfo[]> = {
    controllers: [],
    services: [],
    repositories: [],
    unknown: [],
  };

  const fileEntries = Array.from(filesMap.values());
  for (const fileInfo of fileEntries) {
    const layer = fileInfo.layer || 'unknown';
    if (layerGroups[layer]) {
      layerGroups[layer].push(fileInfo);
    } else {
      layerGroups.unknown.push(fileInfo);
    }
  }

  const layerYPositions: Record<ArchLayer, number> = {
    controllers: 50,
    services: 260,
    repositories: 470,
    unknown: 680,
  };

  const layerXOffset: Record<ArchLayer, number> = {
    controllers: 100,
    services: 100,
    repositories: 100,
    unknown: 100,
  };

  // 5. Generate Node objects
  let nodeIndex = 0;
  for (const [layer, files] of Object.entries(layerGroups) as [ArchLayer, FileInfo[]][]) {
    files.forEach((fileInfo, idx) => {
      nodeIndex++;
      const filePath = fileInfo.filePath;
      const fileName = filePath.split(/[/\\]/).pop() || filePath;

      const archEntry = archaeologyReport?.analyzedFiles.find(
        (a) => a.filePath === filePath || filePath.endsWith(a.filePath)
      );

      const isInCycle = cycleFilesSet.has(filePath);
      const hasViolation = violationFilesSet.has(filePath);

      const nodeData: ArchitectureNodeData = {
        label: fileName,
        filePath,
        layer: fileInfo.layer,
        classes: fileInfo.classes || [],
        functions: fileInfo.functions || [],
        exports: fileInfo.exports || [],
        dependencies: fileInfo.dependencies || [],
        dependents: dependentsMap.get(filePath) || [],
        isInCycle,
        cyclePaths: fileToCyclesMap.get(filePath),
        hasViolation,
        violationReasons: fileToViolationsMap.get(filePath),
        archaeology: archEntry,
        safeToRefactor: archEntry ? archEntry.safeToRefactor : !isInCycle && !hasViolation,
        isLocked: archEntry ? archEntry.isLocked : false,
      };

      const x = layerXOffset[layer] + (idx % 3) * 320;
      const y = layerYPositions[layer] + Math.floor(idx / 3) * 160;

      nodes.push({
        id: filePath,
        type: 'customNode',
        position: { x, y },
        data: nodeData,
      });
    });
  }

  // 6. Generate Edge objects
  let edgeIdCounter = 0;
  for (const [sourcePath, fileInfo] of filesMap.entries()) {
    for (const targetPath of fileInfo.dependencies) {
      if (!filesMap.has(targetPath)) continue;

      edgeIdCounter++;
      const edgeId = `edge-${edgeIdCounter}-${sourcePath}->${targetPath}`;

      // Check if this edge is part of a cycle
      const isCycleEdge = report.cycles.some((cycle) => {
        const srcIdx = cycle.indexOf(sourcePath);
        if (srcIdx === -1) return false;
        const nextIdx = (srcIdx + 1) % cycle.length;
        return cycle[nextIdx] === targetPath;
      });

      // Check if this edge is a layer violation
      const violation = report.violations.find(
        (v) => v.sourceFile === sourcePath && v.targetFile === targetPath
      );

      let strokeColor = '#64748b'; // default slate-500
      let strokeWidth = 1.5;
      let animated = false;
      let label = '';

      if (isCycleEdge) {
        strokeColor = '#ef4444'; // red-500
        strokeWidth = 3.0;
        animated = true;
        label = 'CYCLE';
      } else if (violation) {
        strokeColor = '#f97316'; // orange-500
        strokeWidth = 2.5;
        animated = true;
        label = 'VIOLATION';
      }

      edges.push({
        id: edgeId,
        source: sourcePath,
        target: targetPath,
        animated,
        label: label || undefined,
        style: {
          stroke: strokeColor,
          strokeWidth,
        },
        labelStyle: {
          fill: strokeColor,
          fontWeight: 700,
          fontSize: 10,
        },
      });
    }
  }

  return { nodes, edges };
}
