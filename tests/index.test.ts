import { expect, test, describe } from 'vitest';
import path from 'path';
import { DependencyGraph } from '../src/graph.js';
import { findCycles } from '../src/cycles.js';
import { calculateHealthScore } from '../src/report.js';
import { detectLayer, resolveImportPath } from '../src/parser.js';
import { detectLayerViolations } from '../src/layers.js';
import { analyzeProject } from '../src/analyzer.js';
import { FileInfo } from '../src/types.js';

describe('Dependency Graph Operations', () => {
  test('should construct a directed graph correctly', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');

    expect(graph.getDependencies('A')).toEqual(['B']);
    expect(graph.getDependencies('B')).toEqual(['C']);
    expect(graph.getDependencies('C')).toEqual([]);
    expect(graph.getDependencyCount()).toBe(2);
    expect(graph.getAllNodes()).toContain('A');
    expect(graph.getAllNodes()).toContain('B');
    expect(graph.getAllNodes()).toContain('C');
  });
});

describe('Cycle Detection (Tarjan SCC)', () => {
  test('should return no cycles for acyclic graphs', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');

    const cycles = findCycles(graph);
    expect(cycles).toEqual([]);
  });

  test('should detect a single cycle', () => {
    const graph = new DependencyGraph();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.addEdge('C', 'A');

    const cycles = findCycles(graph);
    expect(cycles.length).toBe(1);
    expect(cycles[0]).toContain('A');
    expect(cycles[0]).toContain('B');
    expect(cycles[0]).toContain('C');
  });

  test('should detect multiple cycles', () => {
    const graph = new DependencyGraph();
    // Cycle 1: A -> B -> A
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'A');

    // Cycle 2: C -> D -> C
    graph.addEdge('C', 'D');
    graph.addEdge('D', 'C');

    const cycles = findCycles(graph);
    expect(cycles.length).toBe(2);
  });
});

describe('Layer Detection & Violations', () => {
  test('should detect layer from path', () => {
    expect(detectLayer('src/controllers/user.controller.ts')).toBe('controllers');
    expect(detectLayer('src/services/user.service.ts')).toBe('services');
    expect(detectLayer('src/repositories/user.repository.ts')).toBe('repositories');
    expect(detectLayer('src/utils/math.ts')).toBe('unknown');
  });

  test('should identify Controller -> Repository violation', () => {
    const filesMap = new Map<string, FileInfo>();
    
    filesMap.set('src/controllers/user.controller.ts', {
      filePath: 'src/controllers/user.controller.ts',
      layer: 'controllers',
      imports: [],
      dependencies: ['src/repositories/user.repository.ts'],
      classes: [],
      functions: [],
      exports: [],
    });

    filesMap.set('src/repositories/user.repository.ts', {
      filePath: 'src/repositories/user.repository.ts',
      layer: 'repositories',
      imports: [],
      dependencies: [],
      classes: [],
      functions: [],
      exports: [],
    });

    const violations = detectLayerViolations(filesMap);
    expect(violations.length).toBe(1);
    expect(violations[0].sourceLayer).toBe('controllers');
    expect(violations[0].targetLayer).toBe('repositories');
  });

  test('should identify Repository -> Service violation', () => {
    const filesMap = new Map<string, FileInfo>();

    filesMap.set('src/repositories/user.repository.ts', {
      filePath: 'src/repositories/user.repository.ts',
      layer: 'repositories',
      imports: [],
      dependencies: ['src/services/user.service.ts'],
      classes: [],
      functions: [],
      exports: [],
    });

    filesMap.set('src/services/user.service.ts', {
      filePath: 'src/services/user.service.ts',
      layer: 'services',
      imports: [],
      dependencies: [],
      classes: [],
      functions: [],
      exports: [],
    });

    const violations = detectLayerViolations(filesMap);
    expect(violations.length).toBe(1);
    expect(violations[0].sourceLayer).toBe('repositories');
    expect(violations[0].targetLayer).toBe('services');
  });
});

describe('Health Scoring', () => {
  test('should calculate correct grade and status', () => {
    const perfect = calculateHealthScore(0, 0);
    expect(perfect.score).toBe(100);
    expect(perfect.grade).toBe('A');
    expect(perfect.status).toBe('HEALTHY');

    const warning = calculateHealthScore(1, 1);
    expect(warning.score).toBe(75);
    expect(warning.grade).toBe('B');
    expect(warning.status).toBe('HEALTHY');

    const critical = calculateHealthScore(3, 3);
    expect(critical.score).toBe(25);
    expect(critical.grade).toBe('F');
    expect(critical.status).toBe('CRITICAL');
  });
});

describe('Integration: Demo Project Analysis', () => {
  test('should analyze demo-project and extract full report correctly', () => {
    const demoDir = path.resolve(__dirname, '../demo-project');
    const { report } = analyzeProject(demoDir);

    expect(report.analyzedFileCount).toBe(7);
    expect(report.dependencyCount).toBe(7);

    // There is one cycle between order.service.ts and payment.service.ts
    expect(report.cycleCount).toBe(1);
    const cycleFileBasenames = report.cycles[0].map((f) => path.basename(f)).sort();
    expect(cycleFileBasenames).toEqual(['order.service.ts', 'payment.service.ts']);

    // There is one layer violation where UserController imports UserRepository
    expect(report.layerViolationCount).toBe(1);
    expect(path.basename(report.violations[0].sourceFile)).toBe('user.controller.ts');
    expect(path.basename(report.violations[0].targetFile)).toBe('user.repository.ts');
  });
});
