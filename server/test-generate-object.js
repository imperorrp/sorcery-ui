/**
 * test-generate-object.js
 *
 * Validates the AI model's ability to generate machine-readable JSON by
 * providing a small inline schema and asserting the shape using `zod`.
 * Useful for validating the prompt/response flow for structured outputs.
 */
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

dotenv.config();

(async () => {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    console.log('Using API key present:', !!apiKey);
    const ai = new GoogleGenAI({ apiKey });

    const schemaDescription = JSON.stringify({ greeting: 'string' }, null, 2);
    const prompt = `Generate a JSON object matching this schema:\n${schemaDescription}\nReturn only the JSON.`;

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
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

    // Basic validation using zod
    const schema = z.object({ greeting: z.string() });
    const validated = schema.parse(parsed);
    console.log('Validated:', validated);
  } catch (err) {
    console.error('ERROR:', err?.message ?? err);
    try { console.error('Full err:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2)); } catch (e) {}
    console.error(err?.stack);
    process.exit(1);
  }
})();