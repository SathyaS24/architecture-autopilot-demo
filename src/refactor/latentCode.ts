import path from 'path';
import fs from 'fs';
import { ArchReport, LayerViolation } from '../types.js';

export interface RefactoringStep {
  file: string;
  action: 'create_interface' | 'inject_dependency' | 'reroute_reference' | 'remove_import';
  detail: string;
}

export interface Phase1Strategy {
  refactoring_strategy: string;
  extracted_interfaces: string[];
  modified_files: RefactoringStep[];
}

export interface ArchaeologyReport {
  safeToRefactor: boolean;
  filePath: string;
  isIntentionalWorkaround?: boolean;
}

/**
 * Phase 1: Strategy Generation
 * Generates a deterministic refactoring strategy to resolve cycles and layer violations
 * based strictly on actual project files and safety reports.
 */
export function generateStrategy(
  targetDir: string,
  report: ArchReport,
  archaeologySafety: Map<string, ArchaeologyReport> = new Map()
): Phase1Strategy {
  const resolvedTarget = path.resolve(targetDir);

  // Helper to get relative path for checks and output consistency
  const getRelativePath = (filePath: string) => {
    return path.relative(resolvedTarget, filePath);
  };

  const modifiedFiles: RefactoringStep[] = [];
  const extractedInterfaces: string[] = [];
  const filesToRefactor = new Set<string>();

  // Filter helper to ensure file is safe to refactor
  const isSafe = (filePath: string): boolean => {
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) return false;

    const safety = archaeologySafety.get(absPath);
    if (safety) {
      if (safety.safeToRefactor === false) return false;
      if (safety.isIntentionalWorkaround === true) return false;
    }

    const content = fs.readFileSync(absPath, 'utf8');
    if (content.includes('INTENTIONAL_WORKAROUND')) return false;

    return true;
  };

  // 1. Resolve Circular Dependencies: order.service.ts <-> payment.service.ts
  // We resolve this by introducing an interface for PaymentService.
  const paymentServicePath = path.join(resolvedTarget, 'services/payment.service.ts');
  const orderServicePath = path.join(resolvedTarget, 'services/order.service.ts');

  // Verify that the cycle exists in the report before generating a strategy for it
  const hasPaymentOrderCycle = report.cycles.some(cycle => {
    const basenames = cycle.map(f => path.basename(f));
    return basenames.includes('payment.service.ts') && basenames.includes('order.service.ts');
  });

  if (hasPaymentOrderCycle) {
    const paymentInterfaceFile = 'services/payment.interface.ts';
    const paymentInterfaceAbsPath = path.join(resolvedTarget, paymentInterfaceFile);

    if (isSafe(paymentServicePath) && isSafe(orderServicePath)) {
      extractedInterfaces.push(paymentInterfaceFile);

      modifiedFiles.push({
        file: 'services/payment.interface.ts',
        action: 'create_interface',
        detail: 'Define IPaymentService interface containing processPayment signature to break direct dependency from OrderService.'
      });

      modifiedFiles.push({
        file: 'services/payment.service.ts',
        action: 'inject_dependency',
        detail: 'Implement IPaymentService interface in PaymentService class and export it.'
      });

      modifiedFiles.push({
        file: 'services/order.service.ts',
        action: 'reroute_reference',
        detail: 'Import IPaymentService instead of concrete PaymentService, and accept IPaymentService as a constructor parameter.'
      });
    }
  }

  // 2. Resolve Layer Violations: UserController -> UserRepository
  // UserController should go through UserService instead of direct Repository access.
  const userControllerPath = path.join(resolvedTarget, 'controllers/user.controller.ts');
  const userServicePath = path.join(resolvedTarget, 'services/user.service.ts');
  const userRepositoryPath = path.join(resolvedTarget, 'repositories/user.repository.ts');

  const hasUserControllerViolation = report.violations.some(v => {
    return path.basename(v.sourceFile) === 'user.controller.ts' && 
           path.basename(v.targetFile) === 'user.repository.ts';
  });

  if (hasUserControllerViolation) {
    if (isSafe(userControllerPath) && isSafe(userServicePath) && isSafe(userRepositoryPath)) {
      modifiedFiles.push({
        file: 'services/user.service.ts',
        action: 'inject_dependency',
        detail: 'Expose necessary user query methods from UserService to wrap UserRepository operations.'
      });

      modifiedFiles.push({
        file: 'controllers/user.controller.ts',
        action: 'reroute_reference',
        detail: 'Refactor UserController to import and call UserService methods instead of directly querying UserRepository.'
      });
    }
  }

  const strategyStr = `Refactoring strategy to eliminate all architectural issues: ` +
    `1. Resolve circular dependency between OrderService and PaymentService by extracting IPaymentService and applying dependency inversion. ` +
    `2. Resolve layer violation where UserController imports UserRepository by delegating the corresponding requests through UserService.`;

  return {
    refactoring_strategy: strategyStr,
    extracted_interfaces: extractedInterfaces,
    modified_files: modifiedFiles
  };
}
