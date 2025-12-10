/**
 * test-file-prompt.js
 * Uses the SYSTEM_PROMPT and designSystemSchema to send a direct prompt & image to Google GenAI,
 * then log/validate the response. Used as an integration test to validate the server prompt and
 * the normalization/validation flow locally.
 */
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { designSystemSchema, SYSTEM_PROMPT } from './lib/designSystemSchema.js';
import fs from 'fs';

dotenv.config();

(async () => {
  try {
    const imagePath = './test-image.png';
    if (!fs.existsSync(imagePath)) {
      console.error('Test image not found at', imagePath);
      return;
    }

    const buffer = fs.readFileSync(imagePath);
    const base64Data = buffer.toString('base64');
    const mimeType = 'image/png';
    const data = base64Data;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    console.log('Using API key present:', !!apiKey);
    const ai = new GoogleGenAI({ apiKey });

    // Use the project's SYSTEM_PROMPT and designSystemSchema to request a full design system
    const schemaDesc = `
    The output must be a JSON object matching the project's designSystemSchema. The root keys are: designTokens and components. Each component must include name, type ("ui"|"block"), description, code (full React component code as a string), and dependencies (array).
    `;

    const contents = [
      {
        inlineData: {
          mimeType,
          data,
        },
      },
      { text: SYSTEM_PROMPT + "\n\n" + schemaDesc + "\n\nAnalyze this UI screenshot and return ONLY valid JSON that exactly matches the schema. Do not include markdown or explanatory text. The 'code' field must contain complete React/TSX component code as a string." },
    ];

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || 'gemini-2.5-flash',
      contents,
    });

    console.log('Raw response:', JSON.stringify(response, null, 2));

    let text = null;
    if (response?.candidates && response.candidates.length) {
      text = response.candidates[0].content?.parts?.[0]?.text ?? null;
    }
    if (!text && response?.output?.[0]) text = JSON.stringify(response.output[0]);

    if (!text) throw new Error('No text output from GenAI');

    let parsed;
    try {
      parsed = JSON.parse(text.match(/\{[\s\S]*\}/m)?.[0] ?? text);
      console.log('Parsed object:', parsed);
    } catch (e) {
      console.error('Failed to parse JSON from model output', { text });
      throw e;
    }

    // Normalize the parsed object
    const normalized = normalizeDesignSystem(parsed);
    console.log('Normalized object:', normalized);

    const validated = designSystemSchema.parse(normalized);
    console.log('Validated:', validated);
  } catch (err) {
    console.error('ERROR:', err?.message ?? err);
    try { console.error('Full err:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2)); } catch (e) {}
    console.error(err?.stack);
    process.exit(1);
  }
})();

/**
 * Normalize common AI output shapes into the expected `designSystemSchema` shape.
 * - If `designTokens.colors` exists, promote it into `designTokens.cssVars.root` and
 *   also seed a simple `tailwindConfig.theme.extend.colors` mapping.
 * - Strip markdown code fences from `components[].code` if present.
 * - Map "utility" type to "ui" for components.
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

    // Normalize component code: remove ``` fences if present
    if (Array.isArray(out.components)) {
      out.components = out.components.map((c) => {
        const comp = { ...c };
        if (typeof comp.code === 'string') {
          comp.code = comp.code.replace(/^```(?:tsx|jsx|ts|js)?\n?|\n?```$/g, '').trim();
        }
        // Map "utility" to "ui"
        if (comp.type === 'utility') comp.type = 'ui';
        return comp;
      });
    }

    return out;
  } catch (e) {
    // If normalization fails, return the original raw object to let Zod produce errors
    console.warn('Normalization failed, returning raw object', { error: e?.message });
    return raw;
  }
}