/**
 * Component Detection - Identify shadcn-like components
 * 
 * This module implements heuristics to distinguish between shadcn-like
 * components (with CVA variants) and ordinary React components.
 * 
 * Detection is ordered by reliability:
 * 1. CVA AST patterns (most reliable)
 * 2. Import analysis (cva, cn, clsx)
 * 3. Path heuristics (components/ui/*)
 * 4. TypeScript signatures (variant union types)
 * 5. User override (manual schema assignment)
 * 
 * When a shadcn-like component is detected, we extract its schema
 * and store it in the component metadata for Inspector UI to use.
 */

import { hasCVAPattern, hasClassMergingHelper, extractComponentSchema } from './cvaExtractor';
import type { ComponentSchema } from '@/store/types';

/**
 * Detection result with confidence level
 */
export interface DetectionResult {
  isShadcnLike: boolean;
  confidence: 'high' | 'medium' | 'low';
  detectionMethod: ComponentSchema['detectionMethod'];
  reasons: string[];
}

/**
 * Detect if a component is shadcn-like based on multiple heuristics
 * 
 * @param sourceCode - The component source code
 * @param _componentName - Name of the component (unused currently)
 * @param importPath - Optional import path for path-based heuristics
 * @returns Detection result with confidence and reasons
 */
export function detectShadcnLikeComponent(
  sourceCode: string,
  _componentName: string,
  importPath?: string
): DetectionResult {
  const reasons: string[] = [];
  
  // 1. Check for CVA patterns (highest confidence)
  if (hasCVAPattern(sourceCode)) {
    reasons.push('Uses class-variance-authority (cva)');
    return {
      isShadcnLike: true,
      confidence: 'high',
      detectionMethod: 'cva-ast',
      reasons,
    };
  }
  
  // 2. Check for class merging helpers
  if (hasClassMergingHelper(sourceCode)) {
    reasons.push('Uses cn/clsx/classNames helper');
  }
  
  // 3. Check import path patterns
  if (importPath) {
    const shadcnPathPatterns = [
      /components\/ui\//,
      /@\/components\/ui\//,
      /\.\/ui\//,
      /shadcn/i,
    ];
    
    if (shadcnPathPatterns.some(pattern => pattern.test(importPath))) {
      reasons.push(`Import path matches shadcn pattern: ${importPath}`);
    }
  }
  
  // 4. Check for variant-related TypeScript patterns
  const variantPatterns = [
    /interface\s+\w+Props\s*{[\s\S]*?variant\s*\??\s*:/,
    /type\s+\w+Props\s*=\s*{[\s\S]*?variant\s*\??\s*:/,
    /variant\s*\??\s*:\s*['"`]default['"`]\s*\|\s*['"`]\w+['"`]/,
  ];
  
  if (variantPatterns.some(pattern => pattern.test(sourceCode))) {
    reasons.push('TypeScript interface includes variant prop');
  }
  
  // 5. Check for common shadcn component patterns
  const componentPatterns = [
    /buttonVariants/i,
    /cardVariants/i,
    /badgeVariants/i,
    /alertVariants/i,
    /forwardRef/,
  ];
  
  if (componentPatterns.some(pattern => pattern.test(sourceCode))) {
    reasons.push('Contains common shadcn component patterns');
  }
  
  // Determine confidence based on number of signals
  const confidence = reasons.length >= 3 ? 'high' : reasons.length >= 2 ? 'medium' : 'low';
  const isShadcnLike = reasons.length >= 2;
  
  return {
    isShadcnLike,
    confidence,
    detectionMethod: reasons.length >= 2 ? 'heuristic-multi' : 'heuristic-single',
    reasons,
  };
}

/**
 * Extract component schema if it's a shadcn-like component
 * 
 * This is the main entry point that combines detection + extraction.
 * 
 * @param sourceCode - The component source code
 * @param componentName - Name of the component
 * @param importPath - Optional import path
 * @returns ComponentSchema if detected and extracted, null otherwise
 */
export async function detectAndExtractSchema(
  sourceCode: string,
  componentName: string,
  importPath?: string
): Promise<ComponentSchema | null> {
  // First, detect if this is a shadcn-like component
  const detection = detectShadcnLikeComponent(sourceCode, componentName, importPath);
  
  // If not detected with sufficient confidence, return null
  if (!detection.isShadcnLike || detection.confidence === 'low') {
    return null;
  }
  
  // Try to extract schema using CVA parser
  const schema = extractComponentSchema(sourceCode, componentName);
  
  if (schema) {
    // Enhance schema with detection info
    return {
      ...schema,
      detectionMethod: detection.detectionMethod,
    };
  }
  
  // If extraction failed but detection was positive, return minimal schema
  // This allows Inspector UI to show a "manual schema needed" message
  if (detection.confidence === 'high') {
    return {
      name: componentName,
      variants: {},
      detectionMethod: detection.detectionMethod,
      props: {},
    };
  }
  
  return null;
}

/**
 * Check if a component path matches shadcn UI structure
 * 
 * @param path - File path or import path
 * @returns true if path suggests shadcn UI component
 */
export function isShadcnPath(path: string): boolean {
  const patterns = [
    /components\/ui\//,
    /@\/components\/ui\//,
    /src\/components\/ui\//,
    /shadcn/i,
  ];
  
  return patterns.some(pattern => pattern.test(path));
}

/**
 * Get component source from various sources
 * 
 * This is a helper that attempts to retrieve component source code
 * from the current project context.
 * 
 * @param _componentName - Name of the component to find (unused - placeholder)
 * @returns Source code if found, null otherwise
 */
export function getComponentSource(_componentName: string): string | null {
  // TODO: Implement source retrieval
  // This will need to:
  // 1. Check if component is in current project's component list
  // 2. Look for component in dependencies
  // 3. Check for component in examples
  // 
  // For now, return null - this will be implemented when integrating
  // with the component store
  return null;
}
