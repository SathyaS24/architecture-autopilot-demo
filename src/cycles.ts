import { DependencyGraph } from './graph.js';

export function findCycles(graph: DependencyGraph): string[][] {
  const adjacency = graph.getAdjacencyList();
  const indexMap: Map<string, number> = new Map();
  const lowlinkMap: Map<string, number> = new Map();
  const onStack: Map<string, boolean> = new Map();
  const stack: string[] = [];
  let currentIndex = 0;
  const sccs: string[][] = [];

  function strongConnect(v: string) {
    indexMap.set(v, currentIndex);
    lowlinkMap.set(v, currentIndex);
    currentIndex++;
    stack.push(v);
    onStack.set(v, true);

    const edges = adjacency.get(v) || new Set();
    for (const w of edges) {
      if (!indexMap.has(w)) {
        strongConnect(w);
        lowlinkMap.set(v, Math.min(lowlinkMap.get(v)!, lowlinkMap.get(w)!));
      } else if (onStack.get(w)) {
        lowlinkMap.set(v, Math.min(lowlinkMap.get(v)!, indexMap.get(w)!));
      }
    }

    if (lowlinkMap.get(v) === indexMap.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.set(w, false);
        scc.push(w);
      } while (w !== v);

      // A single node is an SCC, but it's only a cycle if it has a self-loop.
      if (scc.length > 1) {
        sccs.push(scc.reverse());
      } else if (scc.length === 1) {
        const selfEdges = adjacency.get(scc[0]);
        if (selfEdges && selfEdges.has(scc[0])) {
          sccs.push(scc);
        }
      }
    }
  }

  for (const node of graph.getAllNodes()) {
    if (!indexMap.has(node)) {
      strongConnect(node);
    }
  }

  return sccs;
}
