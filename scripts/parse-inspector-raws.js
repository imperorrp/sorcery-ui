// Script: scripts/parse-inspector-raws.js
// Purpose: Try to parse raw Gemini responses saved in tmp/inspector-gen-debug-6/*.txt
// For each raw file: extract a JSON block, attempt JSON.parse once, write processed JSON to file or error text.

const fs = require('fs');
const path = require('path');

const debugDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-6');
const files = fs.readdirSync(debugDir).filter(f => f.endsWith('.txt'));
console.log(`Found ${files.length} raw text files in ${debugDir}`);

for (const file of files) {
  const full = path.join(debugDir, file);
  const content = fs.readFileSync(full, 'utf8');

  // Try to extract JSON inside ```json ... ``` or ``` ... ``` or the first { ... } block
  let candidate = content;

  // Remove leading/trailing whitespace and repeated fences
  candidate = candidate.trim();

  // If starts with a code fence, strip the outermost fence
  const codeFenceMatch = candidate.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (codeFenceMatch) {
    candidate = codeFenceMatch[1].trim();
  }

  // Try to find the first JSON object substring using brace matching
  let jsonText = null;
  const firstBrace = candidate.indexOf('{');
  if (firstBrace !== -1) {
    // attempt to find matching closing brace
    let depth = 0;
    for (let i = firstBrace; i < candidate.length; i++) {
      const ch = candidate[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) {
        jsonText = candidate.slice(firstBrace, i + 1);
        break;
      }
    }
  }

  if (!jsonText) {
    // No brace-balanced JSON found - write parse-error
    fs.writeFileSync(path.join(debugDir, file + '.parse-error.txt'), `No JSON object found in file. Raw content length=${content.length}\n---\n${content}`);
    console.log(`Wrote parse-error for ${file}: no JSON block`);
    continue;
  }

  // Try JSON.parse once and write output or error
  try {
    const parsed = JSON.parse(jsonText);
    const outPath = path.join(debugDir, file.replace('.txt', '-auto-parsed.json'));
    fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8');
    console.log(`Parsed ${file} -> ${path.basename(outPath)}`);
  } catch (err) {
    // Write a detailed error file
    const errPath = path.join(debugDir, file + '.parse-error.txt');
    const errText = `JSON.parse failed: ${err.message}\n\nCandidate JSON (first 1000 chars):\n${jsonText.slice(0,1000)}\n\nFull raw content:\n${content}`;
    fs.writeFileSync(errPath, errText, 'utf8');
    console.log(`Wrote parse-error for ${file}: ${err.message}`);
  }
}
console.log('Done.');
