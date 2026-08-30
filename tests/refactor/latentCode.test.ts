import { expect, test, describe } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { analyzeProject } from '../../src/analyzer.js';
import { generateStrategy } from '../../src/refactor/latentCode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase 1 Strategy Generation Tests', () => {
  test('should generate compliant strategy JSON with no locked files and valid paths', () => {
    const demoDir = path.resolve(__dirname, '../../demo-project');
    const { report } = analyzeProject(demoDir);

    const strategy = generateStrategy(demoDir, report);

    // Validate strategy shape
    expect(strategy).toBeDefined();
    expect(typeof strategy.refactoring_strategy).toBe('string');
    expect(Array.isArray(strategy.extracted_interfaces)).toBe(true);
    expect(Array.isArray(strategy.modified_files)).toBe(true);

    // Check files constraints
    strategy.modified_files.forEach(step => {
      expect(typeof step.file).toBe('string');
      expect(['create_interface', 'inject_dependency', 'reroute_reference', 'remove_import']).toContain(step.action);
      expect(typeof step.detail).toBe('string');
      expect(step.detail.length).toBeGreaterThan(0);

      if (step.action !== 'create_interface') {
        const fullPath = path.resolve(demoDir, step.file);
        expect(fs.existsSync(fullPath)).toBe(true);
      }
    });

    // Check extracted interface paths are valid
    strategy.extracted_interfaces.forEach(filePath => {
      expect(filePath.endsWith('.interface.ts')).toBe(true);
    });

    // Ensure the output matches correct architecture insights
    expect(strategy.extracted_interfaces).toContain('services/payment.interface.ts');
  });
});
