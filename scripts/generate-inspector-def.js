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
You are a meticulous Design System Architect. Your sole task is to analyze Tailwind CSS documentation and convert it into a highly structured, precise JSON object that will be used to build a visual inspector UI. Adhere strictly to the provided schemas and data dictionary.

First, you MUST use the following **UI Control Design System** to decide which UI to specify for each utility.

--- UI CONTROL DESIGN SYSTEM (Your Toolbox) ---
- 'Select': A dropdown. Use for 5+ named options (e.g., font-weight).
- 'SegmentedControl': A visual button group. Use for 2-5 iconic, mutually exclusive options (e.g., text-align).
- 'BoxModelEditor': The 4-field editor with a "link" icon. Use ONLY for \`padding\` and \`margin\`.
- 'SizeInput': A text input with theme autocomplete. Use for \`width\`, \`height\`, \`font-size\`, \`gap\`.
- 'ColorPicker': A color picker with theme swatches. Use for ANY solid color property.
- 'GradientEditor': A specialized UI for creating gradients. Use for \`background-image\` with gradients.
- 'Slider': A slider for a numeric range. Use for properties like \`opacity\`, \`blur\`, \`brightness\`.
- 'ShadowEditor': A composite control for \`box-shadow\` and \`drop-shadow\`.
- 'TransformEditor': A composite control for \`rotate\`, \`scale\`, \`skew\`, \`translate\`.
- 'Toggle': An on/off switch. Use for single, boolean-like classes (e.g., 'italic', 'underline').
---

Next, you MUST generate a JSON object that strictly conforms to this **Data Dictionary** (UPDATED TO SUPPORT MULTIPLE STRATEGIES):

---
**Data Dictionary: Your Schema and Definitions**

*   **label**: (string) The human-friendly name for the UI section (e.g., "Border Color").
*   **description**: (string) The concise one-sentence explanation from the top of the doc file.
*   **docUrl**: (string) The full URL to the documentation page (e.g., "https://tailwindcss.com/docs/border-color").
*   **group**: (string) The accordion group this belongs to (e.g., "Borders", "Spacing", "Layout").
*   **control**: (object) Describes the UI.
        *   type: (string) The name of the UI control to use (e.g., 'ColorPicker', 'Select', 'SegmentedControl').
*   **strategies**: (array) CRITICAL. An ordered list of strategy objects. A utility may expose one or multiple strategies simultaneously (for example a fixed list AND arbitrary values). Each strategy object has a type plus fields required by that type. Supported strategy types:
    *   list: Use when there is a finite, explicit set of discrete utility classes shown in the docs. REQUIRED FIELD: classes.
    *   generative: Use when the docs clearly show programmatic construction from a theme dataset (e.g., \`Object.entries(colors)\`). Look for patterns like \`...Object.entries(colors).map(([name, value]) => [\`bg-\${name}\`, ...])\` in the ApiTable rows. REQUIRED FIELD: generative.template and generative.dataset.
    *   arbitrary: Use when the docs show arbitrary value placeholders via a row ending in \`-[]\` or \`-()\` (e.g., \`aspect-[]\`, \`w-[]\`, \`bg-[...]\`). REQUIRED FIELD: arbitrary.template.        Strategy Object Shapes:
        *   For type list:
                { "type": "list", "classes": [ { "class": "content-center", "label": "Center" }, ... ] }
        *   For type generative:
                { "type": "generative", "generative": { "template": "bg-{value}", "dataset": "colors" } }
        *   For type arbitrary:
                { "type": "arbitrary", "arbitrary": { "template": "aspect-{value}" } }

        NOTES:
        * If both a finite list and arbitrary form exist, include BOTH a list and an arbitrary strategy objects (in that order).
        * If arbitrary values ALSO share the same theme dataset pattern (rare), still model them as two strategies: one generative, one arbitrary.
        * The placeholder in any template MUST be exactly "{value}".
        * Do NOT merge fundamentally different patterns into one strategy.
*   **structuralVariants**: (array, optional) Use this ONLY if the utility has different forms for different sides or axes (e.g., border-t, border-x). Each object must have:
        *   label: (string) A human-friendly name for the UI (e.g., "Top Only", "Horizontal Axis").
        *   template: (string) The class template for this specific variant (e.g., "border-t-{value}").
*   **supportsArbitrary**: (boolean, optional) Set to true if ANY ApiTable row ends with \`-[]\` or \`-()\` (i.e., an arbitrary strategy is present). When you emit an arbitrary strategy this should be true.

---
**Example 1: Utility with a single list strategy**
*FILE CONTENT:* (Content of align-content.mdx)
*YOUR OUTPUT:*
\`\`\`json
{
    "alignContent": {
        "label": "Align Content", "description": "...", "docUrl": "...", "group": "Flexbox & Grid",
        "control": { "type": "SegmentedControl" },
        "strategies": [
            {
                "type": "list",
                "classes": [
                    { "class": "content-center", "label": "Center" },
                    { "class": "content-start", "label": "Start" }
                ]
            }
        ]
    }
}
\`\`\`

**Example 2: Utility with a single generative strategy (dataset-driven)**
*FILE CONTENT:* (Content of background-color.mdx, showing "...Object.entries(colors).map(([name, value]) => [ \`bg-\${name}\`, ... ])")
*YOUR OUTPUT:*
\`\`\`json
{
  "backgroundColor": {
    "label": "Background Color", "description": "...", "docUrl": "...", "group": "Backgrounds",
    "control": { "type": "ColorPicker" },
    "strategies": [
      {
        "type": "generative",
        "generative": { "template": "bg-{value}", "dataset": "colors" }
      }
    ]
  }
}
\`\`\`**Example 3: Utility with BOTH list and arbitrary strategies**
*INPUT:* (Content of aspect-ratio.mdx, which contains \`<ApiTable rows={[ ["aspect-square", ...], ["aspect-video", ...], ["aspect-[]", ...] ]} />\`)
*OUTPUT:*
\`\`\`json
{
    "aspectRatio": {
        "label": "Aspect Ratio",
        "description": "Utilities for controlling the aspect ratio of an element.",
        "docUrl": "https://tailwindcss.com/docs/aspect-ratio",
        "group": "Layout",
        "control": { "type": "Select" },
        "strategies": [
            {
                "type": "list",
                "classes": [
                    { "class": "aspect-square", "label": "Square" },
                    { "class": "aspect-video", "label": "Video" }
                ]
            },
            {
                "type": "arbitrary",
                "arbitrary": { "template": "aspect-{value}" }
            }
        ],
        "supportsArbitrary": true
    }
}
\`\`\`

---
**Your Task:** Analyze the following file content. Be precise. Follow the data dictionary and examples perfectly. Generate ONLY the JSON object.

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

    // Load existing definitions if the file exists
    if (fs.existsSync(outputPath)) {
        try {
            const existingData = fs.readFileSync(outputPath, 'utf8');
            Object.assign(inspectorDefinition, JSON.parse(existingData));
            console.log(`Loaded ${Object.keys(inspectorDefinition).length} existing definitions.`);
        } catch (error) {
            console.warn('Failed to load existing definitions, starting fresh:', error.message);
        }
    }

    // Ensure output directory exists before processing so per-file snapshots can be written
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Found ${utilityFiles.length} utility files to process.`);

    // Process one file at a time. If SINGLE_FILE env var is set, only process that file index (0-based) for debugging.
    const singleFileIndex = typeof process.env.SINGLE_FILE !== 'undefined' ? parseInt(process.env.SINGLE_FILE, 10) : null;
    const maxFilesToProcess = process.env.MAX_FILES ? parseInt(process.env.MAX_FILES, 10) : 1000; // Process all remaining files
    const startFromIndex = process.env.START_INDEX ? parseInt(process.env.START_INDEX, 10) : 0; // Start from beginning

    for (const [idx, file] of utilityFiles.entries()) {
        // Skip files before start index
        if (idx < startFromIndex) {
            continue;
        }
        
        // Process up to maxFilesToProcess files starting from startFromIndex
        const processedCount = idx - startFromIndex;
        if (processedCount >= maxFilesToProcess) {
            console.log(`Stopping after processing ${maxFilesToProcess} files starting from index ${startFromIndex}.`);
            break;
        }
        
        console.log(`Processing file ${idx + 1}/${utilityFiles.length} (processed: ${processedCount + 1}/${maxFilesToProcess}): ${file.name}...`);
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
                        const debugDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-5');
                        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
                        fs.writeFileSync(path.join(debugDir, `file-${idx + 1}-${file.name}-raw-attempt-${attempt}.txt`), String(response), 'utf8');
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
                    if (!jsonData || typeof jsonData !== 'object') {
                        throw new Error('Parsed JSON is not a valid object');
                    }
                    const category = Object.keys(jsonData)[0];
                    const definition = jsonData[category];
                    if (!category || !definition) {
                        throw new Error('Parsed JSON missing required category key or definition');
                    }
                    if (!definition.label || !definition.description || !definition.group || !definition.control) {
                        throw new Error('Parsed JSON is missing one or more root fields (label, description, group, control)');
                    }
                    
                    // Validate strategies array
                    if (!Array.isArray(definition.strategies) || definition.strategies.length === 0) {
                        throw new Error('Parsed JSON is missing required strategies array or it is empty');
                    }
                    
                    // Validate each strategy in the array
                    for (const strategy of definition.strategies) {
                        if (!strategy.type) {
                            throw new Error('Strategy object missing required type field');
                        }
                        
                        if (strategy.type === 'list') {
                            if (!strategy.classes || !Array.isArray(strategy.classes)) {
                                throw new Error('List strategy missing required classes array');
                            }
                        } else if (strategy.type === 'generative') {
                            if (!strategy.generative || !strategy.generative.template || !strategy.generative.dataset) {
                                throw new Error('Generative strategy missing required generative.template or generative.dataset');
                            }
                        } else if (strategy.type === 'arbitrary') {
                            if (!strategy.arbitrary || !strategy.arbitrary.template) {
                                throw new Error('Arbitrary strategy missing required arbitrary.template');
                            }
                        } else {
                            throw new Error(`Unknown strategy type: ${strategy.type}`);
                        }
                    }
                    
                    // Validate supportsArbitrary flag
                    const hasArbitraryStrategy = definition.strategies.some(s => s.type === 'arbitrary');
                    if (hasArbitraryStrategy && !definition.supportsArbitrary) {
                        throw new Error('Definition has arbitrary strategy but supportsArbitrary is not set to true');
                    }
                    if (!hasArbitraryStrategy && definition.supportsArbitrary) {
                        throw new Error('Definition has supportsArbitrary=true but no arbitrary strategy found');
                    }

                    // If validation passes, add it to the definition
                    inspectorDefinition[category] = definition;
                    success = true;
                    console.log(`  ✅ Processed and validated ${file.name}`);

                    // Write a per-file processed JSON snapshot to the new debug folder for quick verification
                    try {
                        const processedDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-5');
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
                            const errDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-5');
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
                            const errDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-5');
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