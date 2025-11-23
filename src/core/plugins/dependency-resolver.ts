import { Plugin } from './plugin';
import { CircularDependencyError, MissingDependencyError } from './errors';

/**
 * Resolves plugin dependencies and determines correct load order.
 * Uses topological sorting to ensure dependencies are loaded before dependents.
 */
export class DependencyResolver {
  /**
   * Resolves dependencies for all plugins or a specific plugin.
   * Returns plugins in the order they should be loaded (dependencies first).
   * 
   * @param plugins - Map of all registered plugins
   * @param startPlugin - Optional specific plugin to resolve dependencies for
   * @returns Array of plugin names in load order
   * @throws {MissingDependencyError} If a required dependency is not registered
   * @throws {CircularDependencyError} If a circular dependency is detected
   * 
   * @example
   * ```typescript
   * const loadOrder = DependencyResolver.resolveDependencies(plugins);
   * // Returns: ['core', 'auth', 'api'] where 'api' depends on 'auth' and 'core'
   * ```
   */
  static resolveDependencies(
    plugins: Map<string, Plugin>,
    startPlugin?: string
  ): string[] {
    // Build dependency graph
    const graph = this.buildDependencyGraph(plugins);

    // Validate all dependencies exist
    for (const [pluginName, plugin] of plugins.entries()) {
      const deps = plugin.metadata.dependencies || [];
      for (const dep of deps) {
        if (!plugins.has(dep)) {
          throw new MissingDependencyError(pluginName, dep);
        }
      }
    }

    // Detect cycles
    const cycle = this.detectCycles(graph);
    if (cycle) {
      throw new CircularDependencyError(cycle);
    }

    // Perform topological sort
    return this.topologicalSort(graph, startPlugin);
  }

  /**
   * Builds a dependency graph from plugins.
   * Returns an adjacency list representation where each plugin maps to its dependencies.
   * 
   * @param plugins - Map of all registered plugins
   * @returns Dependency graph as adjacency list
   */
  private static buildDependencyGraph(
    plugins: Map<string, Plugin>
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const [name, plugin] of plugins.entries()) {
      const dependencies = plugin.metadata.dependencies || [];
      graph.set(name, dependencies);
    }

    return graph;
  }

  /**
   * Detects circular dependencies in the dependency graph using DFS.
   * 
   * @param graph - Dependency graph as adjacency list
   * @returns Array representing the cycle if found, null otherwise
   */
  private static detectCycles(graph: Map<string, string[]>): string[] | null {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (dfs(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep);
          return true;
        }
      }

      recursionStack.delete(node);
      path.pop();
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (dfs(node)) {
          // Return the cycle path
          return [...path];
        }
      }
    }

    return null;
  }

  /**
   * Performs topological sort on the dependency graph using Kahn's algorithm.
   * Returns nodes in order such that dependencies come before dependents.
   * 
   * @param graph - Dependency graph as adjacency list
   * @param startNode - Optional starting node to prioritize
   * @returns Array of plugin names in topologically sorted order
   */
  private static topologicalSort(
    graph: Map<string, string[]>,
    startNode?: string
  ): string[] {
    // Calculate in-degree for each node
    // In-degree = number of dependencies a node has
    const inDegree = new Map<string, number>();
    for (const [node, dependencies] of graph.entries()) {
      inDegree.set(node, dependencies.length);
    }

    // Find all nodes with in-degree 0 (no dependencies)
    const queue: string[] = [];
    for (const [node, degree] of inDegree.entries()) {
      if (degree === 0) {
        // Prioritize start node if specified
        if (node === startNode) {
          queue.unshift(node);
        } else {
          queue.push(node);
        }
      }
    }

    const result: string[] = [];

    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);

      // For each node that depends on the current node
      for (const [dependent, dependencies] of graph.entries()) {
        if (dependencies.includes(node)) {
          const newDegree = (inDegree.get(dependent) || 0) - 1;
          inDegree.set(dependent, newDegree);

          if (newDegree === 0) {
            queue.push(dependent);
          }
        }
      }
    }

    // If result doesn't include all nodes, there's a cycle (shouldn't happen as we check earlier)
    if (result.length !== graph.size) {
      throw new CircularDependencyError([...graph.keys()]);
    }

    // Result is already in correct order (dependencies first)
    return result;
  }
}
