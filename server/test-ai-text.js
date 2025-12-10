/**
 * test-ai-text.js
 *
 * Quick script for sending a simple text request to the model to ensure
 * tokenization and textual responses are functioning as expected with your API key.
 */
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

(async () => {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    console.log('Using API key present:', !!apiKey);

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || 'gemini-2.5-flash',
      contents: 'Write a vegetarian lasagna recipe for 4 people.',
    });

    console.log('Raw response:', JSON.stringify(response, null, 2));
    if (response?.candidates) {
      console.log('Text candidates:');
      for (const c of response.candidates) {
        try {
          console.log('-', c.content?.parts?.[0]?.text ?? JSON.stringify(c.content));
        } catch (e) {
          console.log('-', JSON.stringify(c));
        }
      }
    }
  } catch (err) {
    console.error('ERROR:', err?.message ?? err);
    try { console.error('Full err:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2)); } catch (e) {}
    console.error(err?.stack);
    process.exit(1);
  }
})();