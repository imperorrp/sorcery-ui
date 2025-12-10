/**
 * AI Service
 *
 * Client-side API wrapper for the server's AI features. This module provides a
 * single exported function `generateDesignSystem` that accepts an image file
 * object (PNG, JPG, WebP) and returns a strongly-typed `DesignSystemResponse`.
 *
 * Implementation details:
 * - Sends the file as multipart/form-data to the server's `/api/ai/generate-system` endpoint
 * - Returns the `data` field's `DesignSystemResponse` if the server returns `success: true`
 * - Throws an Error with server-provided messages otherwise
 */
const API_BASE_URL = 'http://localhost:3000/api/ai'; // Adjust if your server port differs

export interface DesignSystemResponse {
  designTokens: {
    cssVars: {
      root: Record<string, string>;
      dark: Record<string, string>;
    };
    tailwindConfig: Record<string, unknown>;
  };
  components: Array<{
    name: string;
    type: 'ui' | 'block';
    description: string;
    code: string;
    dependencies: string[];
  }>;
}

/**
 * Sends the image file to the server AI endpoint and returns the generated
 * design system response.
 * @param imageFile - Image file for analysis (PNG/JPG/WebP)
 * @returns A DesignSystemResponse object with tokens and components
 */
/**
 * generateDesignSystem - Client wrapper that uploads a screenshot and returns
 * a `DesignSystemResponse` with tokens and components for preview/import.
 *
 * @param {File} imageFile - Screenshot file to analyze (PNG/JPG/WebP)
 * @returns {Promise<DesignSystemResponse>} The AI-generated design system
 * @throws {Error} When the server returns a non-OK response or an unexpected payload
 */
export async function generateDesignSystem(imageFile: File): Promise<DesignSystemResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_BASE_URL}/generate-system`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate design system');
  }

  const result = await response.json();
  return result.data;
}