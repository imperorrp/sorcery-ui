/**
 * Generate Tailwind CSS Modifiers Script
 *
 * This script fetches Tailwind CSS documentation from the official repository
 * and uses AI to generate structured JSON definitions for variants and modifiers.
 * It processes hover-focus-and-other-states.mdx and responsive-design.mdx via GitHub API.
 *
 * Prerequisites:
 * - GITHUB_TOKEN environment variable for GitHub API access
 * - GEMINI_API_KEY environment variable for AI processing
 *
 * Usage: node scripts/generate-modifiers.js
 */

// /scripts/generate-modifiers.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = new require('@google/genai');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GITHUB_API_URL = 'https://api.github.com/repos/tailwindlabs/tailwindcss.com/contents/src/docs';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const outputPath = path.resolve(__dirname, '..', 'client', 'src', 'lib', 'definitions', 'modifiers.json');

// This is the heart of the script.
const PROMPT_TEMPLATE = `
You are a specialized, hyper-attentive parser for the Tailwind CSS framework. Your sole job is to extract EVERY variant and modifier from the provided documentation and structure it into a single, clean JSON object.

You MUST extract the data into a JSON object with a single root key: "modifiers". The value of "modifiers" MUST be an array of objects.

Each object in the "modifiers" array MUST conform to this exact schema:
- "name": (string) The prefix used in the class name (e.g., "hover", "md", "dark").
- "type": (string) The category of the modifier. You MUST choose from this exact list: ["State", "Breakpoint", "Context", "Pseudo-element", "Group", "Peer", "ARIA", "Data"].
- "description": (string) A concise, human-readable explanation of what the modifier does.
- "css": (string) The CSS pseudo-class, media query, or attribute selector it generates (e.g., "&:hover", "@media (width >= 48rem)").

---
**Categorization Rulebook (Follow this strictly):**
- If it's an interactive pseudo-class like \`:hover\`, \`:focus\`, or \`:checked\`, the \`type\` is "State".
- If it's a responsive breakpoint like \`sm\`, \`md\`, or \`max-lg\`, the \`type\` is "Breakpoint".
- If it's a pseudo-element like \`::before\` or \`::placeholder\`, the \`type\` is "Pseudo-element".
- If it's a global condition like \`dark\` or \`rtl\`, the \`type\` is "Context".
- If it starts with \`group-\`, the \`type\` is "Group".
- If it starts with \`peer-\`, the \`type\` is "Peer".
- If it starts with \`aria-\`, the \`type\` is "ARIA".
- If it starts with \`data-\`, the \`type\` is "Data".
---

**Example of Perfect Output:**
\`\`\`json
{
  "modifiers": [
    {
      "name": "hover",
      "type": "State",
      "description": "Styles an element when the user hovers over it.",
      "css": "@media (hover: hover) { &:hover }"
    },
    {
      "name": "focus",
      "type": "State",
      "description": "Styles an element when it has focus.",
      "css": "&:focus"
    },
    {
      "name": "md",
      "type": "Breakpoint",
      "description": "Styles an element at medium screen sizes and above.",
      "css": "@media (width >= 48rem)"
    },
    {
      "name": "dark",
      "type": "Context",
      "description": "Styles an element when dark mode is enabled.",
      "css": "@media (prefers-color-scheme: dark)"
    },
    {
      "name": "group-hover",
      "type": "Group",
      "description": "Styles an element when a marked parent is hovered.",
      "css": ":where(.group:hover) &"
    }
  ]
}
\`\`\`

---
**Your Task:**
Your input will be the content from the Tailwind CSS documentation pages that list variants and modifiers. Your job is to extract every single one from the tables and definition lists. Ignore the introductory prose. Generate ONLY the JSON object described above.

**FILE CONTENT:**
---
{FILE_CONTENT}
---
`;

/**
 * Calls the Gemini AI API to process documentation content
 *
 * @param {string} prompt - The prompt containing file content to process
 * @returns {Promise<string>} The AI-generated response
 */
async function callGeminiAPI(prompt) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
}

/**
 * Fetches raw content of a file from GitHub repository
 *
 * @param {string} pathParam - The repository path to the file
 * @returns {Promise<string>} The raw file content
 */
async function getFileContent(pathParam) {
    // pathParam is the repository path returned by the listing (e.g. "src/docs/hover-focus-and-other-states.mdx")
    const apiUrl = `https://api.github.com/repos/tailwindlabs/tailwindcss.com/contents/${pathParam}`;
    const { data } = await axios.get(apiUrl, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            // Request raw file contents (plain text)
            'Accept': 'application/vnd.github.raw'
        }
    });
    return data; // raw text content
}

// Rate limiting: 10 requests per minute for Gemini 2.5 Flash
let requestCount = 0;
let lastResetTime = Date.now();

/**
 * Makes a rate-limited call to the Gemini API
 *
 * @param {string} prompt - The prompt to send to the API
 * @returns {Promise<string>} The API response
 */
async function rateLimitedGeminiCall(prompt) {
    const now = Date.now();
    const timeSinceReset = now - lastResetTime;

    // Reset counter every minute
    if (timeSinceReset >= 60000) {
        requestCount = 0;
        lastResetTime = now;
    }

    // Check if we've hit the rate limit
    if (requestCount >= 10) {
        const waitTime = 60000 - timeSinceReset;
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        requestCount = 0;
        lastResetTime = Date.now();
    }

    requestCount++;
    return await callGeminiAPI(prompt);
}

/**
 * Main execution function that orchestrates the generation process
 */
async function main() {
    console.log('Fetching modifier documentation files from Tailwind CSS docs...');

    // Define the specific files we need to process
    const modifierFiles = [
        'src/docs/hover-focus-and-other-states.mdx',
        'src/docs/responsive-design.mdx'
    ];

    let allModifiers = [];

    // Process each file
    for (const filePath of modifierFiles) {
        console.log(`Processing ${filePath}...`);
        try {
            const content = await getFileContent(filePath);
            const prompt = PROMPT_TEMPLATE.replace('{FILE_CONTENT}', content);

            // Retry logic for individual file: up to 3 attempts with exponential backoff
            const maxAttempts = 3;
            let attempt = 0;
            let success = false;
            while (attempt < maxAttempts && !success) {
                attempt++;
                try {
                    console.log(`  Attempt ${attempt} for ${filePath}...`);
                    const response = await rateLimitedGeminiCall(prompt);

                    // Save raw response for debugging
                    try {
                        const debugDir = path.resolve(__dirname, '..', 'tmp', 'modifiers-gen-debug');
                        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
                        fs.writeFileSync(path.join(debugDir, `${path.basename(filePath)}-raw-attempt-${attempt}.txt`), String(response), 'utf8');
                    } catch (dbgErr) {
                        console.warn('Failed to write debug file:', dbgErr.message);
                    }

                    // Clean response - remove any markdown formatting
                    let respText = String(response).trim();

                    // Remove markdown code fences if present
                    if (respText.startsWith('```json')) {
                        respText = respText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    } else if (respText.startsWith('```')) {
                        respText = respText.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
                    }

                    // Remove any leading/trailing whitespace
                    respText = respText.trim();

                    const jsonData = JSON.parse(respText.trim());

                    // Validation Step: Ensure the parsed JSON conforms to our schema
                    if (!jsonData || typeof jsonData !== 'object' || !jsonData.modifiers || !Array.isArray(jsonData.modifiers)) {
                        throw new Error('Parsed JSON is not a valid modifiers object with modifiers array');
                    }

                    // Validate each modifier in the array
                    for (const modifier of jsonData.modifiers) {
                        if (!modifier.name || !modifier.type || !modifier.description || !modifier.css) {
                            throw new Error('Modifier object missing required fields (name, type, description, css)');
                        }

                        const validTypes = ["State", "Breakpoint", "Context", "Pseudo-element", "Group", "Peer", "ARIA", "Data"];
                        if (!validTypes.includes(modifier.type)) {
                            throw new Error(`Invalid modifier type: ${modifier.type}. Must be one of: ${validTypes.join(', ')}`);
                        }
                    }

                    // Add the modifiers from this file to our collection
                    allModifiers = allModifiers.concat(jsonData.modifiers);
                    success = true;
                    console.log(`  ✅ Processed and validated ${filePath} (${jsonData.modifiers.length} modifiers)`);

                    // Write a per-file processed JSON snapshot
                    try {
                        const processedDir = path.resolve(__dirname, '..', 'tmp', 'modifiers-gen-debug');
                        if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });
                        fs.writeFileSync(path.join(processedDir, `${path.basename(filePath)}-processed.json`), JSON.stringify(jsonData, null, 2), 'utf8');
                    } catch (procErr) {
                        console.warn('Failed to write per-file processed JSON:', procErr.message);
                    }

                } catch (fileErr) {
                    console.warn(`  Attempt ${attempt} failed for ${filePath}:`, fileErr.message);
                    if (attempt >= maxAttempts) {
                        // Write an error file for later triage
                        try {
                            const errDir = path.resolve(__dirname, '..', 'tmp', 'modifiers-gen-debug');
                            fs.mkdirSync(errDir, { recursive: true });
                            fs.writeFileSync(path.join(errDir, `${path.basename(filePath)}-error.txt`), String(fileErr.stack || fileErr.message), 'utf8');
                        } catch (errWrite) {
                            console.warn('Failed to write error file:', errWrite.message);
                        }
                    } else {
                        // Backoff before retrying
                        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
                        console.log(`  Waiting ${backoffMs}ms before retrying...`);
                        await new Promise(r => setTimeout(r, backoffMs));
                    }
                }
            }

        } catch (error) {
            console.error(`Failed to process ${filePath}:`, error.message);
        }
    }

    // Remove duplicates based on name (keep the first occurrence)
    const uniqueModifiers = allModifiers.filter((modifier, index, self) =>
        index === self.findIndex(m => m.name === modifier.name)
    );

    // Sort modifiers by type, then by name
    uniqueModifiers.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
    });

    const finalOutput = {
        modifiers: uniqueModifiers
    };

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2));
    console.log(`✅ Modifiers definition generated successfully at ${outputPath}`);
    console.log(`Processed ${allModifiers.length} total modifiers, ${uniqueModifiers.length} unique modifiers after deduplication.`);
}

main();