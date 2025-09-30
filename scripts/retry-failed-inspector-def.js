#!/usr/bin/env node
/**
 * Retry failed Tailwind inspector generation files once and force-save outputs.
 *
 * This script finds error markers written by `generate-inspector-def.js` in
 * tmp/inspector-gen-debug-6, re-fetches the corresponding MDX docs from GitHub,
 * sends them to the same AI prompt once, and writes the raw response plus a
 * best-effort parsed JSON to disk even if validation fails. This helps
 * triage why some files were rejected by the stricter generator script.
 *
 * Usage: node scripts/retry-failed-inspector-def.js
 * Environment:
 *   - GITHUB_TOKEN (required to fetch MDX files)
 *   - GEMINI_API_KEY (required to call the Gemini API)
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is required in the environment.');
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is required in the environment.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const debugDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-6');
const GITHUB_API_BASE = 'https://api.github.com/repos/tailwindlabs/tailwindcss.com/contents';

/**
 * Extract the PROMPT_TEMPLATE from the main generator script so both scripts use
 * exactly the same prompt. If extraction fails, the script will abort.
 */
function extractPromptTemplate() {
  const genPath = path.resolve(__dirname, 'generate-inspector-def.js');
  const content = fs.readFileSync(genPath, 'utf8');
  const m = content.match(/const PROMPT_TEMPLATE = `([\s\S]*?)`;/);
  if (!m) {
    throw new Error('Unable to extract PROMPT_TEMPLATE from generate-inspector-def.js');
  }
  return m[1];
}

async function callGemini(prompt) {
  try {
    const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return String(res.text || res.outputs?.[0]?.content || '');
  } catch (err) {
    console.error('Gemini call failed:', err.message || err);
    throw err;
  }
}

async function getFileContent(repoRelativePath) {
  const url = `${GITHUB_API_BASE}/${repoRelativePath}`;
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.raw'
    }
  });
  return data;
}

// Very small rate-limiter: 10 requests per minute to match the main script
let requestCount = 0;
let lastReset = Date.now();
async function rateLimitedCall(prompt) {
  const now = Date.now();
  if (now - lastReset >= 60000) {
    requestCount = 0;
    lastReset = now;
  }
  if (requestCount >= 10) {
    const wait = 60000 - (now - lastReset);
    console.log(`Rate limit reached. Waiting ${Math.ceil(wait/1000)}s`);
    await new Promise(r => setTimeout(r, wait));
    requestCount = 0;
    lastReset = Date.now();
  }
  requestCount++;
  return await callGemini(prompt);
}

function stripCodeFences(text) {
  let t = String(text || '');
  t = t.trim();
  if (t.startsWith('```json')) t = t.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (t.startsWith('```')) t = t.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
  return t.trim();
}

async function main() {
  if (!fs.existsSync(debugDir)) {
    console.log('Debug directory does not exist:', debugDir);
    return;
  }

  // Find error marker files
  const all = fs.readdirSync(debugDir);
  const errorFiles = all.filter(f => /file-\d+-.+-error\.txt$/.test(f));
  if (errorFiles.length === 0) {
    console.log('No error marker files found in', debugDir);
    return;
  }

  console.log(`Found ${errorFiles.length} failed file(s) to retry.`);

  const promptTemplate = extractPromptTemplate();

  for (const errFile of errorFiles) {
    try {
      // Extract index and the original mdx filename from the error filename
      const m = errFile.match(/^file-(\d+)-(.+)-error\.txt$/);
      if (!m) continue;
      const idx = Number(m[1]);
      const mdxName = m[2]; // e.g. display.mdx

      console.log(`Retrying file ${idx}: ${mdxName}`);

      // Construct repo path
      const repoPath = `src/docs/${mdxName}`;
      const content = await getFileContent(repoPath);

      // Build prompt
      const prompt = promptTemplate.replace('{FILE_CONTENT}', content);

      // Single attempt only (user requested just once)
      const response = await rateLimitedCall(prompt);

      // Save raw retry attempt
      const rawFilename = `file-${idx}-${mdxName}-raw-attempt-retry.txt`;
      fs.writeFileSync(path.join(debugDir, rawFilename), String(response), 'utf8');

      const stripped = stripCodeFences(response);

      // Try to parse JSON. If it parses, write parsed JSON to a force-saved file.
      try {
        const parsed = JSON.parse(stripped);
        const outName = `file-${idx}-${mdxName}-force-parsed.json`;
        fs.writeFileSync(path.join(debugDir, outName), JSON.stringify(parsed, null, 2), 'utf8');
        console.log(`  Parsed JSON saved to ${outName}`);
      } catch (parseErr) {
        const outName = `file-${idx}-${mdxName}-force-raw.json`;
        const payload = {
          raw: String(response),
          stripped: stripped,
          parseError: String(parseErr && parseErr.message ? parseErr.message : parseErr)
        };
        fs.writeFileSync(path.join(debugDir, outName), JSON.stringify(payload, null, 2), 'utf8');
        console.log(`  Response could not be parsed, saved raw + error to ${outName}`);
      }

    } catch (err) {
      console.error('Failed while retrying', errFile, err.message || err);
      // Write a small marker so user knows this retry errored unexpectedly
      try {
        fs.writeFileSync(path.join(debugDir, `${errFile}.retry-exception.txt`), String(err.stack || err.message), 'utf8');
      } catch (e) {}
    }
  }

  console.log('Retry pass complete. Check the debug folder for force-saved outputs.');
}

main().catch(err => {
  console.error('Fatal error in retry script:', err.message || err);
  process.exit(1);
});
