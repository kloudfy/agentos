import { promises as fs } from 'fs';
import path from 'path';
import { ADRManager } from '../adr-manager';
import { ADRData } from '../types';

describe('ADRManager', () => {
  const testDir = path.join(__dirname, '.test-adrs');
  let manager: ADRManager;

  beforeEach(async () => {
    manager = new ADRManager(testDir);
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore
    }
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore
    }
  });

  describe('getNextNumber', () => {
    it('should return 1 for empty directory', async () => {
      const number = await manager.getNextNumber();

      expect(number).toBe(1);
    });

    it('should return next sequential number', async () => {
      const adr1: ADRData = {
        number: 1,
        title: 'First ADR',
        date: new Date(),
        status: 'Accepted',
        context: 'Context',
        decision: 'Decision',
        consequences: { positive: [], negative: [], neutral: [] },
      };

      await manager.saveADR(adr1);

      const number = await manager.getNextNumber();

      expect(number).toBe(2);
    });
  });

  describe('saveADR', () => {
    it('should save ADR to disk', async () => {
      const adr: ADRData = {
        number: 1,
        title: 'Test ADR',
        date: new Date(),
        status: 'Proposed',
        context: 'Test context',
        decision: 'Test decision',
        consequences: { positive: ['Pro'], negative: ['Con'], neutral: [] },
      };

      const filepath = await manager.saveADR(adr);

      expect(filepath).toContain('0001-test-adr.md');

      const exists = await fs.stat(filepath);
      expect(exists.isFile()).toBe(true);
    });

    it('should create directory if not exists', async () => {
      const adr: ADRData = {
        number: 1,
        title: 'Test',
        date: new Date(),
        status: 'Proposed',
        context: 'Context',
        decision: 'Decision',
        consequences: { positive: [], negative: [], neutral: [] },
      };

      await manager.saveADR(adr);

      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('loadADR', () => {
    it('should load saved ADR', async () => {
      const original: ADRData = {
        number: 1,
        title: 'Test ADR',
        date: new Date('2024-01-15'),
        status: 'Accepted',
        context: 'Test context',
        decision: 'Test decision',
        consequences: { positive: ['Pro'], negative: ['Con'], neutral: [] },
      };

      const filepath = await manager.saveADR(original);
      const loaded = await manager.loadADR(filepath);

      expect(loaded.number).toBe(1);
      expect(loaded.title).toBe('Test ADR');
      expect(loaded.status).toBe('Accepted');
    });
  });

  describe('listADRs', () => {
    it('should list all ADRs', async () => {
      const adr1: ADRData = {
        number: 1,
        title: 'First',
        date: new Date(),
        status: 'Accepted',
        context: 'C',
        decision: 'D',
        consequences: { positive: [], negative: [], neutral: [] },
      };

      const adr2: ADRData = {
        number: 2,
        title: 'Second',
        date: new Date(),
        status: 'Proposed',
        context: 'C',
        decision: 'D',
        consequences: { positive: [], negative: [], neutral: [] },
      };

      await manager.saveADR(adr1);
      await manager.saveADR(adr2);

      const adrs = await manager.listADRs();

      expect(adrs).toHaveLength(2);
      expect(adrs[0].number).toBe(1);
      expect(adrs[1].number).toBe(2);
    });

    it('should return empty array for non-existent directory', async () => {
      const adrs = await manager.listADRs('non-existent');

      expect(adrs).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update ADR status', async () => {
      const adr: ADRData = {
        number: 1,
        title: 'Test',
        date: new Date(),
        status: 'Proposed',
        context: 'C',
        decision: 'D',
        consequences: { positive: [], negative: [], neutral: [] },
      };

      const filepath = await manager.saveADR(adr);
      await manager.updateStatus(1, 'Accepted');

      const updated = await manager.loadADR(filepath);

      expect(updated.status).toBe('Accepted');
    });

    it('should throw for non-existent ADR', async () => {
      await expect(manager.updateStatus(999, 'Accepted')).rejects.toThrow('not found');
    });
  });
});
