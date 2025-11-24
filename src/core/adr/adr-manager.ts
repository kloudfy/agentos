/**
 * ADR Manager
 * 
 * Manages ADR files - saving, loading, numbering, and status updates.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ADRData, ADRStatus } from './types';
import { generateADR, generateFilename } from './adr-template';

/**
 * Manages Architecture Decision Records.
 */
export class ADRManager {
  private readonly adrDir: string;

  /**
   * Creates a new ADRManager.
   * 
   * @param adrDir - Directory to store ADRs (default: docs/adr)
   */
  constructor(adrDir: string = 'docs/adr') {
    this.adrDir = adrDir;
  }

  /**
   * Gets the next ADR number (sequential).
   * 
   * @returns Next available ADR number
   */
  async getNextNumber(): Promise<number> {
    await this.ensureAdrDir();

    const files = await fs.readdir(this.adrDir);
    const adrFiles = files.filter(f => f.match(/^\d{4}-.*\.md$/));

    if (adrFiles.length === 0) {
      return 1;
    }

    // Extract numbers and find max
    const numbers = adrFiles.map(f => {
      const match = f.match(/^(\d{4})-/);
      return match ? parseInt(match[1], 10) : 0;
    });

    return Math.max(...numbers) + 1;
  }

  /**
   * Saves an ADR to disk.
   * 
   * @param adr - ADR data to save
   * @param customDir - Optional custom directory
   * @returns Path to saved file
   */
  async saveADR(adr: ADRData, customDir?: string): Promise<string> {
    const dir = customDir || this.adrDir;
    await this.ensureAdrDir(dir);

    const filename = generateFilename(adr);
    const filepath = path.join(dir, filename);
    const content = generateADR(adr);

    await fs.writeFile(filepath, content, 'utf-8');

    return filepath;
  }

  /**
   * Loads an ADR from disk.
   * 
   * @param filepath - Path to ADR file
   * @returns Parsed ADR data
   */
  async loadADR(filepath: string): Promise<ADRData> {
    const content = await fs.readFile(filepath, 'utf-8');
    return this.parseADR(content, filepath);
  }

  /**
   * Lists all ADRs in directory.
   * 
   * @param customDir - Optional custom directory
   * @returns Array of ADR data
   */
  async listADRs(customDir?: string): Promise<ADRData[]> {
    const dir = customDir || this.adrDir;

    try {
      await this.ensureAdrDir(dir);
      const files = await fs.readdir(dir);
      const adrFiles = files
        .filter(f => f.match(/^\d{4}-.*\.md$/))
        .sort();

      const adrs: ADRData[] = [];

      for (const file of adrFiles) {
        const filepath = path.join(dir, file);
        try {
          const adr = await this.loadADR(filepath);
          adrs.push(adr);
        } catch (error) {
          // Skip files that can't be parsed
          console.warn(`Failed to parse ADR: ${file}`, error);
        }
      }

      return adrs;
    } catch (error) {
      return [];
    }
  }

  /**
   * Updates the status of an ADR.
   * 
   * @param adrNumber - ADR number to update
   * @param status - New status
   * @param customDir - Optional custom directory
   */
  async updateStatus(
    adrNumber: number,
    status: ADRStatus,
    customDir?: string
  ): Promise<void> {
    const dir = customDir || this.adrDir;
    
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch (error) {
      throw new Error(`ADR ${adrNumber} not found`);
    }
    
    const numberStr = adrNumber.toString().padStart(4, '0');
    const adrFile = files.find(f => f.startsWith(numberStr));

    if (!adrFile) {
      throw new Error(`ADR ${adrNumber} not found`);
    }

    const filepath = path.join(dir, adrFile);
    const content = await fs.readFile(filepath, 'utf-8');

    // Replace status line
    const updated = content.replace(
      /\*\*Status:\*\* \w+/,
      `**Status:** ${status}`
    );

    await fs.writeFile(filepath, updated, 'utf-8');
  }

  /**
   * Ensures ADR directory exists.
   */
  private async ensureAdrDir(dir?: string): Promise<void> {
    const targetDir = dir || this.adrDir;

    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Parses ADR content into data structure.
   */
  private parseADR(content: string, filepath: string): ADRData {
    // Extract number from filename
    const filename = path.basename(filepath);
    const numberMatch = filename.match(/^(\d{4})-/);
    const number = numberMatch ? parseInt(numberMatch[1], 10) : 0;

    // Extract title
    const titleMatch = content.match(/^# ADR-\d+: (.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown';

    // Extract status
    const statusMatch = content.match(/\*\*Status:\*\* (\w+)/);
    const status = (statusMatch ? statusMatch[1] : 'Proposed') as ADRStatus;

    // Extract date
    const dateMatch = content.match(/\*\*Date:\*\* ([\d-]+)/);
    const date = dateMatch ? new Date(dateMatch[1]) : new Date();

    // Extract context
    const contextMatch = content.match(/## Context\n\n([\s\S]+?)\n\n## Decision/);
    const context = contextMatch ? contextMatch[1].trim() : '';

    // Extract decision
    const decisionMatch = content.match(/## Decision\n\n([\s\S]+?)\n\n## Consequences/);
    const decision = decisionMatch ? decisionMatch[1].trim() : '';

    // Extract consequences (simplified)
    const consequences = {
      positive: this.extractListItems(content, '### Positive'),
      negative: this.extractListItems(content, '### Negative'),
      neutral: this.extractListItems(content, '### Neutral'),
    };

    return {
      number,
      title,
      date,
      status,
      context,
      decision,
      consequences,
    };
  }

  /**
   * Extracts list items from a section.
   */
  private extractListItems(content: string, sectionHeader: string): string[] {
    const regex = new RegExp(`${sectionHeader}\\n\\n([\\s\\S]+?)(?=\\n\\n###|\\n\\n##|$)`);
    const match = content.match(regex);

    if (!match) {
      return [];
    }

    return match[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2));
  }
}
