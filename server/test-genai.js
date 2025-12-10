/**
 * test-genai.js
 *
 * This script demonstrates a very small integration with Google GenAI, and
 * prints the raw response data to the console. It is suitable for quick
 * verification that your API key and network connectivity are working.
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
      model: 'gemini-2.5-flash',
      contents: 'How does AI work?',
      // optional config can be added here
    });

    console.log('Raw response:', JSON.stringify(response, null, 2));
    // print common places for text
    if (response?.candidates) {
      console.log('Text candidates:');
      for (const c of response.candidates) {
        console.log('-', c.content?.[0]?.text ?? JSON.stringify(c.content));
      }
    }
    if (response?.output?.[0]) console.log('Output[0]:', JSON.stringify(response.output[0], null, 2));

  } catch (err) {
    console.error('Error:', err?.message ?? err);
    try {
      console.error('Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } catch (e) {}
    console.error(err?.stack);
    process.exit(1);
  }
})();