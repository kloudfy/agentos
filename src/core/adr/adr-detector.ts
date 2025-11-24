/**
 * ADR Detector
 * 
 * Detects interface changes and breaking changes in TypeScript code.
 */

import { Change, ChangeType, ImpactAnalysis, ImpactSeverity } from './types';

/**
 * Detects changes in TypeScript interfaces.
 */
export class ADRDetector {
  /**
   * Detects interface changes between old and new code.
   * 
   * @param oldCode - Previous version of code
   * @param newCode - New version of code
   * @param filename - Optional filename for context
   * @returns Array of detected changes
   */
  detectInterfaceChanges(
    oldCode: string,
    newCode: string,
    filename?: string
  ): Change[] {
    const changes: Change[] = [];

    // Extract interfaces from both versions
    const oldInterfaces = this.extractInterfaces(oldCode);
    const newInterfaces = this.extractInterfaces(newCode);

    // Detect added interfaces
    for (const [name, def] of newInterfaces) {
      if (!oldInterfaces.has(name)) {
        changes.push({
          type: 'interface-added',
          target: name,
          description: `Interface '${name}' was added`,
          breaking: false,
          after: def,
          file: filename,
        });
      }
    }

    // Detect removed interfaces
    for (const [name, def] of oldInterfaces) {
      if (!newInterfaces.has(name)) {
        changes.push({
          type: 'interface-removed',
          target: name,
          description: `Interface '${name}' was removed`,
          breaking: true,
          before: def,
          file: filename,
        });
      }
    }

    // Detect modified interfaces
    for (const [name, oldDef] of oldInterfaces) {
      const newDef = newInterfaces.get(name);
      if (newDef && oldDef !== newDef) {
        const propertyChanges = this.detectPropertyChanges(name, oldDef, newDef);
        changes.push(...propertyChanges.map(c => ({ ...c, file: filename })));
      }
    }

    return changes;
  }

  /**
   * Filters changes to only breaking changes.
   */
  detectBreakingChanges(changes: Change[]): Change[] {
    return changes.filter(c => c.breaking);
  }

  /**
   * Analyzes the impact of changes.
   */
  analyzeImpact(changes: Change[]): ImpactAnalysis {
    const breakingChanges = this.detectBreakingChanges(changes);
    const breakingCount = breakingChanges.length;

    // Determine severity
    let severity: ImpactSeverity;
    if (breakingCount === 0) {
      severity = 'low';
    } else if (breakingCount <= 2) {
      severity = 'medium';
    } else if (breakingCount <= 5) {
      severity = 'high';
    } else {
      severity = 'critical';
    }

    // Identify affected systems
    const affectedSystems = this.identifyAffectedSystems(changes);

    // Generate recommendations
    const recommendations = this.generateRecommendations(changes, breakingCount);

    // Estimate migration effort
    let migrationEffort: 'trivial' | 'low' | 'medium' | 'high';
    if (breakingCount === 0) {
      migrationEffort = 'trivial';
    } else if (breakingCount <= 2) {
      migrationEffort = 'low';
    } else if (breakingCount <= 5) {
      migrationEffort = 'medium';
    } else {
      migrationEffort = 'high';
    }

    return {
      severity,
      affectedSystems,
      recommendations,
      migrationEffort,
      breakingChangesCount: breakingCount,
    };
  }

  /**
   * Extracts interfaces from code.
   */
  private extractInterfaces(code: string): Map<string, string> {
    const interfaces = new Map<string, string>();
    
    // Simple regex to match interface declarations
    // This is a simplified version - a real implementation would use a proper parser
    const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(code)) !== null) {
      const name = match[1];
      const body = match[2].trim();
      interfaces.set(name, body);
    }

    return interfaces;
  }

  /**
   * Detects property changes within an interface.
   */
  private detectPropertyChanges(
    interfaceName: string,
    oldDef: string,
    newDef: string
  ): Change[] {
    const changes: Change[] = [];

    const oldProps = this.extractProperties(oldDef);
    const newProps = this.extractProperties(newDef);

    // Detect added properties
    for (const [name, type] of newProps) {
      if (!oldProps.has(name)) {
        changes.push({
          type: 'property-added',
          target: `${interfaceName}.${name}`,
          description: `Property '${name}' added to ${interfaceName}`,
          breaking: !type.includes('?'), // Required property is breaking
          after: type,
        });
      }
    }

    // Detect removed properties
    for (const [name, type] of oldProps) {
      if (!newProps.has(name)) {
        changes.push({
          type: 'property-removed',
          target: `${interfaceName}.${name}`,
          description: `Property '${name}' removed from ${interfaceName}`,
          breaking: true,
          before: type,
        });
      }
    }

    // Detect modified properties
    for (const [name, oldType] of oldProps) {
      const newType = newProps.get(name);
      if (newType && oldType !== newType) {
        changes.push({
          type: 'property-modified',
          target: `${interfaceName}.${name}`,
          description: `Property '${name}' type changed in ${interfaceName}`,
          breaking: true,
          before: oldType,
          after: newType,
        });
      }
    }

    return changes;
  }

  /**
   * Extracts properties from interface body.
   */
  private extractProperties(body: string): Map<string, string> {
    const properties = new Map<string, string>();
    
    // Split by lines and parse each property
    const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (const line of lines) {
      // Skip comments
      if (line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }

      // Simple property parsing: name: type or name?: type
      const match = line.match(/^(readonly\s+)?(\w+)(\?)?:\s*(.+?);?$/);
      if (match) {
        const name = match[2];
        const optional = match[3] || '';
        const type = match[4];
        properties.set(name, `${optional}${type}`);
      }
    }

    return properties;
  }

  /**
   * Identifies systems affected by changes.
   */
  private identifyAffectedSystems(changes: Change[]): string[] {
    const systems = new Set<string>();

    for (const change of changes) {
      // Extract system name from target (e.g., "Plugin.name" -> "Plugin")
      const parts = change.target.split('.');
      if (parts.length > 0) {
        systems.add(parts[0]);
      }

      // Add file-based system identification
      if (change.file) {
        if (change.file.includes('plugin')) systems.add('Plugin System');
        if (change.file.includes('event')) systems.add('Event System');
        if (change.file.includes('state')) systems.add('State Management');
        if (change.file.includes('personality')) systems.add('Personality System');
      }
    }

    return Array.from(systems);
  }

  /**
   * Generates recommendations based on changes.
   */
  private generateRecommendations(changes: Change[], breakingCount: number): string[] {
    const recommendations: string[] = [];

    if (breakingCount > 0) {
      recommendations.push('Update all code that uses the modified interfaces');
      recommendations.push('Increment major version number (breaking changes)');
      recommendations.push('Document migration path in CHANGELOG');
    } else {
      recommendations.push('Increment minor version number (non-breaking changes)');
    }

    // Specific recommendations based on change types
    const hasRemovals = changes.some(c => c.type.includes('removed'));
    if (hasRemovals) {
      recommendations.push('Consider deprecation period before removal');
      recommendations.push('Provide migration guide for removed features');
    }

    const hasAdditions = changes.some(c => c.type.includes('added'));
    if (hasAdditions) {
      recommendations.push('Update documentation with new features');
      recommendations.push('Add examples for new interfaces/properties');
    }

    return recommendations;
  }
}
