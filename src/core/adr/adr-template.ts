/**
 * ADR Template
 * 
 * Generates Architecture Decision Records in standard markdown format.
 */

import { ADRData } from './types';

/**
 * Generates an ADR document from data.
 * 
 * @param data - ADR data to format
 * @returns Markdown-formatted ADR document
 * 
 * @example
 * ```typescript
 * const adr = generateADR({
 *   number: 1,
 *   title: 'Use Event-Driven Architecture',
 *   date: new Date(),
 *   status: 'Accepted',
 *   context: '...',
 *   decision: '...',
 *   consequences: { positive: [...], negative: [...], neutral: [...] }
 * });
 * ```
 */
export function generateADR(data: ADRData): string {
  const sections: string[] = [];

  // Title
  sections.push(`# ADR-${formatNumber(data.number)}: ${data.title}\n`);

  // Metadata
  sections.push(`**Status:** ${data.status}\n`);
  sections.push(`**Date:** ${formatDate(data.date)}\n`);

  if (data.metadata?.author) {
    sections.push(`**Author:** ${data.metadata.author}\n`);
  }

  if (data.metadata?.tags && data.metadata.tags.length > 0) {
    sections.push(`**Tags:** ${data.metadata.tags.join(', ')}\n`);
  }

  if (data.metadata?.supersedes) {
    sections.push(`**Supersedes:** ADR-${formatNumber(data.metadata.supersedes)}\n`);
  }

  if (data.metadata?.supersededBy) {
    sections.push(`**Superseded By:** ADR-${formatNumber(data.metadata.supersededBy)}\n`);
  }

  sections.push('');

  // Context
  sections.push('## Context\n');
  sections.push(`${data.context}\n`);

  // Decision
  sections.push('## Decision\n');
  sections.push(`${data.decision}\n`);

  // Consequences
  sections.push('## Consequences\n');

  if (data.consequences.positive.length > 0) {
    sections.push('### Positive\n');
    data.consequences.positive.forEach(item => {
      sections.push(`- ${item}`);
    });
    sections.push('');
  }

  if (data.consequences.negative.length > 0) {
    sections.push('### Negative\n');
    data.consequences.negative.forEach(item => {
      sections.push(`- ${item}`);
    });
    sections.push('');
  }

  if (data.consequences.neutral.length > 0) {
    sections.push('### Neutral\n');
    data.consequences.neutral.forEach(item => {
      sections.push(`- ${item}`);
    });
    sections.push('');
  }

  // Alternatives
  if (data.alternatives && data.alternatives.length > 0) {
    sections.push('## Alternatives Considered\n');

    data.alternatives.forEach((alt, index) => {
      sections.push(`### Alternative ${index + 1}: ${alt.name}\n`);
      sections.push(`**Description:** ${alt.description}\n`);

      if (alt.pros.length > 0) {
        sections.push('**Pros:**');
        alt.pros.forEach(pro => sections.push(`- ${pro}`));
        sections.push('');
      }

      if (alt.cons.length > 0) {
        sections.push('**Cons:**');
        alt.cons.forEach(con => sections.push(`- ${con}`));
        sections.push('');
      }

      sections.push(`**Reason for rejection:** ${alt.rejectionReason}\n`);
    });
  }

  // Related Decisions
  if (data.relatedADRs && data.relatedADRs.length > 0) {
    sections.push('## Related Decisions\n');
    data.relatedADRs.forEach(num => {
      sections.push(`- ADR-${formatNumber(num)}`);
    });
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Formats ADR number with leading zeros.
 */
function formatNumber(num: number): string {
  return num.toString().padStart(4, '0');
}

/**
 * Formats date in ISO format.
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generates filename for an ADR.
 * 
 * @param data - ADR data
 * @returns Filename in format: 0001-title-slug.md
 */
export function generateFilename(data: ADRData): string {
  const number = formatNumber(data.number);
  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);

  return `${number}-${slug}.md`;
}
