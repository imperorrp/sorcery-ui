/**
 * Generate Tailwind Inspector Definitions Script
 *
 * This script fetches Tailwind CSS documentation from the official repository
 * and uses AI to generate structured JSON definitions for the visual inspector.
 * It processes MDX files, extracts utility information, and creates UI control
 * definitions for each Tailwind CSS property.
 *
 * Prerequisites:
 * - GITHUB_TOKEN environment variable for GitHub API access
 * - GEMINI_API_KEY environment variable for AI processing
 *
 * Usage: node scripts/generate-inspector-def.js
 */

// /scripts/generate-inspector-def.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GITHUB_API_URL = 'https://api.github.com/repos/tailwindlabs/tailwindcss.com/contents/src/docs';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const outputPath = path.resolve(__dirname, '..', 'client', 'src', 'lib', 'definitions', 'tailwind-inspector.json');

// Gatekeeper regex to check for ApiTable component
const apiTableRegex = /<ApiTable[\s\S]*?>/;

// This is the heart of the script.
const PROMPT_TEMPLATE = `
You are an expert UI/UX designer and a senior frontend developer, tasked with parsing Tailwind CSS documentation. Your goal is to generate a structured JSON object that will be used to create a highly intuitive and powerful visual inspector UI for that CSS property.

**Primary Objective:** Analyze the provided MDX file content. Do not just extract data; interpret the utility's purpose and design the best possible UI for a design engineer to interact with it.

**Output Schema (Strict):**
The JSON object you generate MUST have a single root key, which is the camelCase category name (e.g., "backgroundColor"). The value of this key must conform to the following schema:
- "label": (string) A human-friendly title (e.g., "Background Color").
- "description": (string) A concise, one-sentence explanation.
- "group": (string) The category group. Choose from: ["Layout", "Flexbox & Grid", "Spacing", "Sizing", "Typography", "Backgrounds", "Borders", "Effects", "Filters", "Tables", "Transitions & Animation", "Transforms", "Interactivity", "SVG", "Accessibility"].
- "control": (object) An object describing the ideal UI control.
    - "type": (string) The type of control. Choose from the Design System below.
    - [other properties]: Include other keys as needed by the control type (e.g., "options", "min", "max").
- "classes": (array of objects OR a reference object)
    - If a finite list of classes is defined, provide an array of objects, where each object has "class" (e.g., "content-center") and "value" (the CSS it produces).
    - **CRITICAL RULE:** If the utility uses the shared color palette (e.g., border-color, bg-color), you MUST use a reference object instead of listing all colors: \`{ "$ref": "colors" }\`.
- "modifiers": (array of strings) A list of available state and responsive prefixes found in examples (e.g., ["hover", "focus", "md", "lg"]).

---
**UI Control Design System (Your Toolbox):**
- **'Select'**: A dropdown menu. Best for a list of 5 or more distinct, named options (e.g., font-weight, border-style).
- **'SegmentedControl'**: A visual button group. Best for 2-4 mutually exclusive options with clear visual or iconic representation (e.g., text-align, justify-content).
- **'BoxModelEditor'**: The 4-field editor for padding and margin. Use this if the documentation shows directional classes like 'pt-4', 'pl-2'.
- **'ColorPicker'**: A rich color picker with theme swatches. Use ONLY for utilities that control color.
- **'Slider'**: For properties that represent a continuous range (e.g., opacity, blur, brightness).
- **'ShadowEditor'**: A complex, multi-field control specifically for 'box-shadow' and 'text-shadow'.
- **'Toggle'**: A simple on/off switch for a single, boolean-like class (e.g., 'italic', 'underline').
---

**Few-Shot Examples (Follow these patterns):**

**Example 1: A utility with a finite list of options.**
*INPUT:* (Content of align-content.mdx)
*OUTPUT:*
\`\`\`json
{
  "alignContent": {
    "label": "Align Content",
    "description": "Utilities for controlling how rows are positioned in multi-row flex and grid containers.",
    "group": "Flexbox & Grid",
    "control": { "type": "SegmentedControl" },
    "classes": [
      { "class": "content-center", "value": "center" },
      { "class": "content-start", "value": "flex-start" },
      { "class": "content-between", "value": "space-between" }
    ],
    "modifiers": ["responsive"]
  }
}
\`\`\`

**Example 2: A utility that uses the shared color palette.**
*INPUT:* (Content of background-color.mdx)
*OUTPUT:*
\`\`\`json
{
  "backgroundColor": {
    "label": "Background Color",
    "description": "Utilities for controlling an element's background color.",
    "group": "Backgrounds",
    "control": { "type": "ColorPicker" },
    "classes": { "$ref": "colors" },
    "modifiers": ["hover", "focus"]
  }
}
\`\`\`

---
**Your Task:**
Analyze the following file content. Adhere strictly to the schema and design system. Generate ONLY the JSON object.

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
            model: 'gemini-2.5-flash-lite',
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
    // pathParam is the repository path returned by the listing (e.g. "src/docs/accent-color.mdx")
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

// Rate limiting: 15 requests per minute for Gemini 2.5 Flash Lite
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
    if (requestCount >= 15) {
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
    console.log('Fetching file list from Tailwind CSS docs...');
    const { data: files } = await axios.get(GITHUB_API_URL, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json'
        }
    });

    // Filter for files that are likely CSS utility documentation
    const utilityFiles = files.filter(file =>
        file.name.endsWith('.mdx') && !['installation.mdx', 'upgrade-guide.mdx', 'editor-setup.mdx'].includes(file.name)
    );

    const inspectorDefinition = {};

    // Ensure output directory exists before processing so per-file snapshots can be written
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Found ${utilityFiles.length} utility files to process.`);

    // Process one file at a time. If SINGLE_FILE env var is set, only process that file index (0-based) for debugging.
    const singleFileIndex = typeof process.env.SINGLE_FILE !== 'undefined' ? parseInt(process.env.SINGLE_FILE, 10) : null;

    for (const [idx, file] of utilityFiles.entries()) {
        console.log(`Processing file ${idx + 1}/${utilityFiles.length}: ${file.name}...`);
        try {
            const content = await getFileContent(file.path);

            // Gatekeeper Step: Check for ApiTable component before processing
            if (!apiTableRegex.test(content)) {
                console.log(`  ...Skipping conceptual document (no ApiTable found).`);
                continue; // Move to the next file immediately
            }

            const prompt = PROMPT_TEMPLATE.replace('{FILE_CONTENT}', content);

            // Retry logic for individual file: up to 3 attempts with exponential backoff
            const maxAttempts = 3;
            let attempt = 0;
            let success = false;
            while (attempt < maxAttempts && !success) {
                attempt++;
                try {
                    console.log(`  Attempt ${attempt} for ${file.name}...`);
                    const response = await rateLimitedGeminiCall(prompt);

                    // Save raw response for debugging in a new folder to avoid overwriting previous iteration
                    try {
                        const debugDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-new');
                        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
                        fs.writeFileSync(path.join(debugDir, `file-${idx + 1}-${file.name}-raw-attempt-${attempt}.txt`), String(response), 'utf8');
                    } catch (dbgErr) {
                        console.warn('Failed to write debug file:', dbgErr.message);
                    }

                    // Clean fences if present
                    let respText = String(response).trim();
                    if (respText.startsWith('```json')) {
                        respText = respText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    } else if (respText.startsWith('```')) {
                        respText = respText.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
                    }

                    const jsonData = JSON.parse(respText.trim());

                    // Validation Step: Ensure the parsed JSON conforms to our schema
                    if (!jsonData || typeof jsonData !== 'object') {
                        throw new Error('Parsed JSON is not a valid object');
                    }
                    const category = Object.keys(jsonData)[0];
                    const definition = jsonData[category];
                    if (!category || !definition) {
                        throw new Error('Parsed JSON missing required category key or definition');
                    }
                    if (!definition.label || !definition.description || !definition.group || !definition.control || !definition.classes) {
                        throw new Error('Parsed JSON is missing one or more root fields (label, description, group, control, classes)');
                    }
                    if (definition.control.type === 'Select' && !Array.isArray(definition.classes)) {
                        throw new Error(`Validation failed: Control type 'Select' for category '${category}' requires a 'classes' array`);
                    }
                    // Add more validation rules here as needed

                    // If validation passes, add it to the definition
                    inspectorDefinition[category] = definition;
                    success = true;
                    console.log(`  ✅ Processed and validated ${file.name}`);

                    // Write a per-file processed JSON snapshot to the new debug folder for quick verification
                    try {
                        const processedDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-new');
                        if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });
                        fs.writeFileSync(path.join(processedDir, `file-${idx + 1}-${file.name}-processed.json`), JSON.stringify({ [category]: definition }, null, 2), 'utf8');
                    } catch (procErr) {
                        console.warn('Failed to write per-file processed JSON:', procErr.message);
                    }

                    // Attempt to write the cumulative inspector JSON immediately so we can detect any write problems early
                    try {
                        fs.writeFileSync(outputPath, JSON.stringify(inspectorDefinition, null, 2));
                        console.log(`  Saved snapshot to ${outputPath} (${Object.keys(inspectorDefinition).length} entries)`);
                    } catch (writeErr) {
                        console.error(`  Error writing snapshot to ${outputPath}:`, writeErr.message);
                        try {
                            const errDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug');
                            if (!fs.existsSync(errDir)) fs.mkdirSync(errDir, { recursive: true });
                            fs.writeFileSync(path.join(errDir, `file-${idx + 1}-${file.name}-write-error.txt`), String(writeErr.stack || writeErr.message), 'utf8');
                        } catch (errWrite2) {
                            console.warn('Failed to write write-error file:', errWrite2.message);
                        }
                    }

                } catch (fileErr) {
                    console.warn(`  Attempt ${attempt} failed for ${file.name}:`, fileErr.message);
                    if (attempt >= maxAttempts) {
                        // Write an error file for later triage
                        try {
                            const errDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug');
                            fs.writeFileSync(path.join(errDir, `file-${idx + 1}-${file.name}-error.txt`), String(fileErr.stack || fileErr.message), 'utf8');
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
            console.error(`Failed to process ${file.name}:`, error.message);
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(inspectorDefinition, null, 2));
    console.log(`✅ Inspector definition generated successfully at ${outputPath}`);
    console.log(`Processed ${Object.keys(inspectorDefinition).length} utility definitions.`);
}

main();