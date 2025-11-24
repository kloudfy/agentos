/**
 * ADR (Architecture Decision Record) Module
 * 
 * Automatically generates ADRs when interface changes are detected.
 * 
 * @module adr
 * 
 * @example
 * ```typescript
 * import { ADRDetector, ADRGenerator, ADRManager } from '@/core/adr';
 * 
 * // Detect changes
 * const detector = new ADRDetector();
 * const changes = detector.detectInterfaceChanges(oldCode, newCode);
 * 
 * // Generate ADR
 * const generator = new ADRGenerator();
 * const manager = new ADRManager();
 * const number = await manager.getNextNumber();
 * const adr = generator.generateFromChanges(changes, number);
 * 
 * // Save ADR
 * await manager.saveADR(adr);
 * ```
 */

// Export types
export type {
  ADRStatus,
  ChangeType,
  ImpactSeverity,
  Change,
  ImpactAnalysis,
  ADRData,
  ADRGenerationOptions,
} from './types';

// Export classes
export { ADRDetector } from './adr-detector';
export { ADRGenerator } from './adr-generator';
export { ADRManager } from './adr-manager';

// Export template functions
export { generateADR, generateFilename } from './adr-template';
