/**
 * AI Routes - Design System Extraction
 *
 * Express routes that expose AI-driven endpoints for analyzing a UI screenshot
 * and returning a structured Design System JSON object with tokens and components.
 * - POST /generate-system accepts image or imageUrl and returns a validated design system
 * - GET /status provides a lightweight provider health check
 */
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { designSystemSchema, SYSTEM_PROMPT } from '../lib/designSystemSchema.js';
import logger from '../lib/logger.js';

const router = express.Router();

// Setup Multer for memory storage (we pass buffer directly to AI)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Initialize Google Gen AI (default). For per-request overrides, we will
// instantiate a client inside the handler using a provided API key.
const defaultApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: defaultApiKey });

/**
 * POST /api/ai/generate-system
 * Accepts: multipart/form-data with 'image' file OR JSON with 'imageUrl'
 */
/**
 * POST /api/ai/generate-system
 *
 * Accepts multipart/form-data with a file (image) or JSON body with `imageUrl`.
 * The server sends the image inline to the AI model with the project SYSTEM_PROMPT
 * and expects a strict JSON object matching the `designSystemSchema`. The server
 * performs defensive normalization and returns the parsed/validated object in the `data` field.
 */
router.post('/generate-system', upload.single('image'), async (req, res) => {
  try {
    // Allow per-request API key override via multipart field `apiKey` or header `x-ai-api-key`
    const providedKey = (req.body && req.body.apiKey) || req.headers['x-ai-api-key'];
    const effectiveApiKey = typeof providedKey === 'string' && providedKey.trim().length > 0 ? providedKey.trim() : defaultApiKey;
    const aiClient = new GoogleGenAI({ apiKey: effectiveApiKey });

    let imagePart;

      // Handle file upload (multipart/form-data)
    if (req.file) {
      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        }
      };
    }
    // Handle URL
    else if (req.body.imageUrl) {
      try {
        const imageResponse = await fetch(req.body.imageUrl);
        if (!imageResponse.ok) throw new Error('Failed to fetch image');
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        imagePart = {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimeType,
          }
        };
      } catch (fetchError) {
        logger.error('Failed to fetch image from URL', { error: fetchError.message });
        return res.status(400).json({ error: 'Failed to fetch image from URL' });
      }
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Determine model (env override). The model can be overridden with
    // the `AI_MODEL` environment variable for testing or fallback.
    const modelId = process.env.AI_MODEL || 'gemini-2.5-flash';
    logger.info('AI model selected', { modelId });

    // Construct the prompt. We combine the system prompt with a minimal schema
    // description so that the model understands the exact JSON structure we
    // expect. This keeps the model's output as machine-readable JSON where
    // possible and reduces post-processing.
    // We need to describe the JSON schema since we are not using generateObject
    const schemaDescription = `
    The output must be a JSON object with the following structure:
    {
      "designTokens": {
        "cssVars": {
          "root": { "variableName": "value" },
          "dark": { "variableName": "value" }
        },
        "tailwindConfig": {
          "theme": { "extend": { ... } }
        }
      },
      "components": [
        {
          "name": "ComponentName",
          "type": "ui" | "block",
          "description": "...",
          "code": "...",
          "dependencies": ["..."]
        }
      ]
    }
    `;

    const result = await aiClient.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT + "\n\n" + schemaDescription + "\n\nAnalyze this UI and extract a design system and component code following the specified architecture." },
            imagePart
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    // Extract text from the response (Google GenAI structure)
    let responseText = null;
    if (result?.candidates && result.candidates.length) {
      const cand = result.candidates[0];
      if (cand.content && Array.isArray(cand.content.parts) && cand.content.parts[0]?.text) {
        responseText = cand.content.parts[0].text;
      }
    }
    if (!responseText) {
      logger.error("No text found in AI response", { result });
      throw new Error("No text response from AI");
    }

    // Clean the response text to strip Markdown fences. While the model is
    // instructed to return JSON only, models sometimes wrap outputs in
    // markdown blocks. Normalizing this input eliminates one class of parse
    // error. We also guard against trailing/leading artifacts.
    let cleanResponseText = responseText.trim();
    if (cleanResponseText.startsWith('```json')) {
      cleanResponseText = cleanResponseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponseText.startsWith('```')) {
      cleanResponseText = cleanResponseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let data;
    try {
      data = JSON.parse(cleanResponseText);
    } catch (e) {
      logger.error("Failed to parse JSON response", { 
        responseText: cleanResponseText.substring(0, 500), // Log first 500 chars
        error: e.message 
      });
      throw new Error("Invalid JSON response from AI");
    }

    // Validate generated component code syntax. We're protective here since
    // the AI can produce code with wrappers or other constructs that will
    // fail downstream when invoked in the renderer. We apply a few
    // normalization heuristics (strip surrounding parentheses, IIFE wrappers,
    // and 'export default' wrappers). We then check syntax using `@babel/standalone`
    // and drop components that still fail syntax checking.
    for (const comp of data.components || []) {
      if (comp.code) {
        // Normalize component code: remove common wrappers
        let normalizedCode = comp.code.trim();
        
        // Remove wrapping parentheses if present
        if (normalizedCode.startsWith('(') && normalizedCode.endsWith(')')) {
          normalizedCode = normalizedCode.slice(1, -1).trim();
        }
        
        // Remove function wrappers like (function() { ... })()
        if (normalizedCode.startsWith('(function()') && normalizedCode.endsWith('})()')) {
          normalizedCode = normalizedCode.slice(11, -4).trim();
        }
        
        // Remove export default wrapper if it's just wrapping the component
        normalizedCode = normalizedCode.replace(/^export default\s*\(\s*/, '').replace(/\s*\);?\s*$/, '');
        
        comp.code = normalizedCode;

        try {
          // Quick syntax check by attempting to parse with Babel
          const Babel = await import('@babel/standalone');
          Babel.transform(comp.code, {
            presets: ['react', 'typescript'],
            filename: `${comp.name}.tsx`,
          });
        } catch (syntaxError) {
          logger.warn(`Component ${comp.name} has syntax errors, will be skipped`, { 
            error: syntaxError.message,
            code: comp.code.substring(0, 200) 
          });
          // Remove the component with syntax errors
          data.components = data.components.filter(c => c !== comp);
        }
      }
    }

    // The AI sometimes returns slightly different shapes (e.g., `designTokens.colors`).
    // We try to map popular variants into the expected shape to improve
    // import success rate. For missing tokens or poorly-shaped data we
    // attempt best-effort normalization before final schema validation.
    // Normalize common variants into the expected schema shape before validation.
    const normalized = normalizeDesignSystem(data);
    const validatedData = designSystemSchema.parse(normalized);

    res.json({
      success: true,
      data: validatedData,
    });

  } catch (error) {
    // Capture extra details when available (sanitized)
    const extra = extractErrorDetails(error || {});
    logger.error('AI Generation Error:', { message: (error && error.message) ?? String(error), details: extra });
    res.status(500).json({
      success: false,
      error: (error && error.message) ?? 'Failed to generate design system',
      details: extra
    });
  }
});

/**
 * extractErrorDetails - Safely extract useful fields from potentially unknown
 * error shapes. This is used to make structured debugging logs and JSON
 * responses more informative across various provider/client error shapes.
 *
 * @param {unknown} err - The error object to extract details from
 * @returns {Record<string, unknown>} A shallow object with common error fields
 */
function extractErrorDetails(err) {
  const out = { message: err?.message ?? String(err), name: err?.name ?? null };
  try {
    // copy known shallow properties
    ['code', 'status', 'statusCode'].forEach((k) => {
      if (err && Object.prototype.hasOwnProperty.call(err, k)) out[k] = err[k];
    });

    // Attempt to serialize response-like objects
    if (err && err.response) {
      try { out.response = JSON.parse(JSON.stringify(err.response)); } catch (e) { out.response = String(err.response); }
    }
    if (err && err.body) {
      try { out.body = JSON.parse(JSON.stringify(err.body)); } catch (e) { out.body = String(err.body); }
    }
    if (err && err.cause) {
      out.cause = extractErrorDetails(err.cause);
    }
  } catch (e) {
    out._extractError = 'failed to fully extract';
  }
  return out;
}

/**
 * GET /api/ai/status
 * Lightweight provider health check. Attempts a minimal text generation
 * and returns provider response metadata (headers/body) for debugging.
 */
router.get('/status', async (req, res) => {
  try {
    const modelId = process.env.AI_MODEL || 'gemini-2.5-flash';
    logger.info('AI status check using model', { modelId });

    // Use the Google GenAI client instantiated above
    const result = await ai.models.generateContent({
      model: modelId,
      contents: 'Health check: say OK',
    });

    // Extract text similarly to POST handler
    let textOutput = null;
    if (result?.candidates && result.candidates.length) {
      const cand = result.candidates[0];
      if (cand.content && Array.isArray(cand.content.parts) && cand.content.parts[0]?.text) {
        textOutput = cand.content.parts[0].text;
      }
    }
    if (!textOutput && result?.output && result.output[0]) {
      try { textOutput = JSON.stringify(result.output[0]); } catch (e) { textOutput = String(result.output[0]); }
    }

    const responseMeta = {
      status: 'ok',
      modelId,
      response: result?.sdkHttpResponse ? {
        headers: result.sdkHttpResponse.headers || null,
      } : null,
      text: textOutput ?? null,
    };

    res.json(responseMeta);
  } catch (error) {
    const extra = extractErrorDetails(error || {});

    logger.error('AI status check failed', { message: error?.message, stack: error?.stack, details: extra });
    res.status(500).json({
      status: 'error',
      error: error?.message ?? 'Unknown error',
      details: extra,
    });
  }
});

export default router;

/**
 * normalizeDesignSystem - Convert variant shapes returned by different AI responses
 * into a normalized structure that fits our Zod schema. Common normalizations:
 * - Promote `designTokens.colors` to `designTokens.cssVars.root` and seed `tailwindConfig.theme.extend.colors` when absent
 * - Ensure `cssVars.root` and `cssVars.dark` are present as objects
 * - Strip Markdown code fences from `components[].code` and remove common wrapper artifacts
 * - Normalize `fontFamily` entries to arrays of strings
 *
 * @param {any} raw - Raw object returned by AI
 * @returns {any} Normalized object matching expected shape where possible
 */
function normalizeDesignSystem(raw) {
  try {
    const out = JSON.parse(JSON.stringify(raw)); // shallow clone

    if (!out.designTokens) out.designTokens = {};

    // If model returned `colors` under designTokens, map them into cssVars.root
    if (out.designTokens.colors && !out.designTokens.cssVars) {
      const colors = out.designTokens.colors;
      out.designTokens.cssVars = { root: {}, dark: {} };

      // colors may be nested (e.g., primary: { DEFAULT: '...' }) or flat
      for (const [k, v] of Object.entries(colors)) {
        if (v && typeof v === 'object') {
          // prefer DEFAULT, fallback to v.value or stringified object
          const val = v.DEFAULT ?? v.value ?? (typeof v === 'string' ? v : JSON.stringify(v));
          out.designTokens.cssVars.root[`--${k}`] = String(val);
        } else {
          out.designTokens.cssVars.root[`--${k}`] = String(v);
        }
      }

      // seed a tailwindConfig if missing
      if (!out.designTokens.tailwindConfig) {
        out.designTokens.tailwindConfig = { theme: { extend: { colors: {} } } };
        for (const [k, v] of Object.entries(colors)) {
          if (v && typeof v === 'object') {
            out.designTokens.tailwindConfig.theme.extend.colors[k] = v.DEFAULT ?? v.value ?? v;
          } else {
            out.designTokens.tailwindConfig.theme.extend.colors[k] = v;
          }
        }
      }
    }

    // Ensure cssVars has root/dark objects
    if (!out.designTokens.cssVars) out.designTokens.cssVars = { root: {}, dark: {} };
    out.designTokens.cssVars.root = out.designTokens.cssVars.root ?? {};
    out.designTokens.cssVars.dark = out.designTokens.cssVars.dark ?? {};

    // Normalize fontFamily: ensure values are arrays
    if (out.designTokens.tailwindConfig?.theme?.extend?.fontFamily) {
      const fontFamily = out.designTokens.tailwindConfig.theme.extend.fontFamily;
      for (const [key, value] of Object.entries(fontFamily)) {
        if (typeof value === 'string') {
          // Split on commas and trim whitespace
          fontFamily[key] = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else if (!Array.isArray(value)) {
          fontFamily[key] = [String(value)];
        }
      }
    }

    // Normalize component code: remove ``` fences if present
    if (Array.isArray(out.components)) {
      out.components = out.components.map((c) => {
        const comp = { ...c };
        if (typeof comp.code === 'string') {
          comp.code = comp.code.replace(/^```(?:tsx|jsx|ts|js)?\n?|\n?```$/g, '').trim();
        }
        return comp;
      });
    }

    return out;
  } catch (e) {
    // If normalization fails, return the original raw object to let Zod produce errors
    logger.warn('Normalization failed, returning raw object', { error: e?.message });
    return raw;
  }
}
