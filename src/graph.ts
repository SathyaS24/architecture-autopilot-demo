export class DependencyGraph {
  private adjacencyList: Map<string, Set<string>> = new Map();

  addNode(node: string): void {
    if (!this.adjacencyList.has(node)) {
      this.adjacencyList.set(node, new Set());
    }
  }

  addEdge(from: string, to: string): void {
    this.addNode(from);
    this.addNode(to);
    this.adjacencyList.get(from)!.add(to);
  }

  getDependencies(node: string): string[] {
    const deps = this.adjacencyList.get(node);
    return deps ? Array.from(deps) : [];
  }

  getAllNodes(): string[] {
    return Array.from(this.adjacencyList.keys());
  }

  getAdjacencyList(): Map<string, Set<string>> {
    return this.adjacencyList;
  }

  hasNode(node: string): boolean {
    return this.adjacencyList.has(node);
  }

  getDependencyCount(): number {
    let count = 0;
    for (const [_, deps] of this.adjacencyList.entries()) {
      count += deps.size;
    }
    return count;
  }
}
