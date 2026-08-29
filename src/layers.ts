import { FileInfo, LayerViolation } from './types.js';

export function detectLayerViolations(files: Map<string, FileInfo>): LayerViolation[] {
  const violations: LayerViolation[] = [];

  for (const [filePath, fileInfo] of files.entries()) {
    const srcLayer = fileInfo.layer;
    if (srcLayer === 'unknown') continue;

    for (const depPath of fileInfo.dependencies) {
      const depInfo = files.get(depPath);
      if (!depInfo) continue;

      const targetLayer = depInfo.layer;
      if (targetLayer === 'unknown') continue;

      // Controller -> Repository violation
      if (srcLayer === 'controllers' && targetLayer === 'repositories') {
        violations.push({
          sourceFile: filePath,
          sourceLayer: srcLayer,
          targetFile: depPath,
          targetLayer: targetLayer,
          reason: `Layer violation: Controller should not directly import Repository. It should go through a Service.`,
        });
      }

      // Repository -> Service violation
      if (srcLayer === 'repositories' && targetLayer === 'services') {
        violations.push({
          sourceFile: filePath,
          sourceLayer: srcLayer,
          targetFile: depPath,
          targetLayer: targetLayer,
          reason: `Layer violation: Repository should not import Service (backward dependency).`,
        });
      }

      // Repository -> Controller violation
      if (srcLayer === 'repositories' && targetLayer === 'controllers') {
        violations.push({
          sourceFile: filePath,
          sourceLayer: srcLayer,
          targetFile: depPath,
          targetLayer: targetLayer,
          reason: `Layer violation: Repository should not import Controller (backward dependency).`,
        });
      }

      // Service -> Controller violation
      if (srcLayer === 'services' && targetLayer === 'controllers') {
        violations.push({
          sourceFile: filePath,
          sourceLayer: srcLayer,
          targetFile: depPath,
          targetLayer: targetLayer,
          reason: `Layer violation: Service should not import Controller (backward dependency).`,
        });
      }
    }
  }

  return violations;
}
