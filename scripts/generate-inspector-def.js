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
You are a deterministic, hyper-prescriptive code-to-schema transpiler. Your sole task is to analyze the MDX source code for Tailwind CSS documentation, specifically the JavaScript logic that generates the \`<ApiTable>\` component's \`rows\` prop, and convert it into a highly structured JSON object. You must follow these rules without deviation or interpretation.

---
### **Data Source Primer**

Before you begin, understand that you are generating a schema that will be used in conjunction with a static file named \`suggestions.json\`. This file contains the default value scales that Tailwind CSS provides. Your schema will *reference* these scales by name.

**Known Suggestion Sources in \`suggestions.json\`:**
- \`spacing\`: The default numeric spacing scale (0, 0.5, 1, ..., 96).
- \`fractions\`: Common fractional values (1/2, 1/3, 2/3, etc.).
- \`zIndex\`: Z-index values (0, 10, 20, ..., auto).
- \`order\`: Flex order values (1, 2, 3, ..., first, last, none).
- \`gridColumnSpan\`: Grid column span values (1, 2, 3, ..., full).
- \`gridColumnStart\`: Grid column start positions (1, 2, 3, ..., auto).
- \`gridColumnEnd\`: Grid column end positions (1, 2, 3, ..., auto).
- \`gridRowSpan\`: Grid row span values (1, 2, 3, ..., full).
- \`gridRowStart\`: Grid row start positions (1, 2, 3, ..., auto).
- \`gridRowEnd\`: Grid row end positions (1, 2, 3, ..., auto).
- \`lineClamp\`: Line clamp values (1, 2, 3, ..., none).
- \`columns\`: Column count values (1, 2, 3, ..., auto, 3xs, 2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl).
- \`scale\`: Scale values (0, 50, 75, 90, 95, 100, 105, 110, 125, 150).
- \`rotate\`: Rotation angles (0, 1, 2, 3, 6, 12, 45, 90, 180).
- \`skew\`: Skew angles (0, 1, 2, 3, 6, 12).
- \`transitionDelay\`: Transition delay values (0, 75, 100, 150, 200, 300, 500, 700, 1000).
- \`transitionDuration\`: Transition duration values (0, 75, 100, 150, 200, 300, 500, 700, 1000, initial).
- \`brightness\`: Brightness filter values (0, 50, 75, 90, 95, 100, 105, 110, 125, 150, 200).
- \`contrast\`: Contrast filter values (0, 50, 75, 100, 125, 150, 200).
- \`grayscale\`: Grayscale filter values (0, 25, 50, 75, 100).
- \`hueRotate\`: Hue rotation filter values (0, 15, 30, 60, 90, 180).
- \`invert\`: Invert filter values (0, 25, 50, 75, 100).
- \`saturate\`: Saturation filter values (0, 50, 100, 150, 200).
- \`sepia\`: Sepia filter values (0, 50, 100).
- \`opacity\`: Opacity values (0, 5, 10, ..., 100).
- \`ringWidth\`: Ring width values (0, 1, 2, 4, 8).
- \`ringOffsetWidth\`: Ring offset width values (0, 1, 2, 4, 8).
- \`outlineWidth\`: Outline width values (0, 1, 2, 4, 8).
- \`outlineOffset\`: Outline offset values (0, 1, 2, 4, 8).
- \`textUnderlineOffset\`: Text underline offset values (0, 1, 2, 4, 8, auto).
- \`textDecorationThickness\`: Text decoration thickness values (0, 1, 2, 4, 8, auto, from-font).
- \`colors\`: The entire default Tailwind color palette.


---
### **UI Control Selection Rules**

You MUST select a \`control.type\` based on the following hierarchy:

1.  **\`ColorPicker\`**: Use ONLY for utilities whose primary purpose is to apply a solid color from the theme (i.e., those that map over the \`colors\` object).
2.  **\`ComboBoxWithSlider\`**: This is the **default and most important** control. Use it for ANY utility that combines a set of suggested values (from a scale) with an option for arbitrary user input. This applies to almost all size, position, and numeric utilities like \`width\`, \`height\`, \`blur\`, \`rotate\`, etc.
3.  **\`Select\`**: Use ONLY for utilities that have a small, finite list of keyword options and **NO** numeric scale or arbitrary value support. Example: \`text-align\`.
4.  **\`Toggle\`**: Use ONLY for utilities with a single on/off class. Example: \`italic\`.
5.  **Specialized Controls**: Use \`BoxModelEditor\`, \`ShadowEditor\`, \`GradientEditor\` for their specific, designated utilities.
    'BoxModelEditor': Use ONLY for \`padding\` and \`margin\`.
    'ShadowEditor': Use for \`box-shadow\` and \`drop-shadow\`.
    'GradientEditor': Use for \`background-image\` when it involves gradients.
6. **\`SegmentedControl\`**: Use ONLY for utilities with 2-5 iconic, mutually exclusive options (e.g., \`text-align\`, \`place-items\`).
7. **\`Toggle\`**: Use ONLY for single, boolean-like classes (e.g., \`italic\`, \`underline\`).
8. **\`Slider\`**: Use ONLY for utilities that map over a numeric scale and do NOT support arbitrary values (e.g., \`opacity\`, \`blur\`).

---
### **The Definitive Schema and Parsing Rulebook**

You MUST generate a JSON object where each key is the utility's camelCase name. Each utility object MUST conform to this schema:


*   **label**: (string) The human-friendly name for the UI section (e.g., "Border Color").
*   **description**: (string) The concise one-sentence explanation from the top of the doc file.
*   **docUrl**: (string) The full URL to the documentation page (e.g., "https://tailwindcss.com/docs/border-color").
*   **group**: (string) The accordion group this belongs to. You MUST use one of these EXACT group names:
    - "Layout" (aspect-ratio, columns, break-after, break-before, break-inside, box-decoration-break, box-sizing, display, float, clear, isolation, object-fit, object-position, overflow, overscroll-behavior, position, top/right/bottom/left, visibility, z-index)
    - "Flexbox & Grid" (flex-basis, flex-direction, flex-wrap, flex, flex-grow, flex-shrink, order, grid-template-columns, grid-column, grid-template-rows, grid-row, grid-auto-flow, grid-auto-columns, grid-auto-rows, gap, justify-content, justify-items, justify-self, align-content, align-items, align-self, place-content, place-items, place-self)
    - "Spacing" (padding, margin)
    - "Sizing" (width, min-width, max-width, height, min-height, max-height)
    - "Typography" (font-family, font-size, font-smoothing, font-style, font-weight, font-stretch, font-variant-numeric, letter-spacing, line-clamp, line-height, list-style-image, list-style-position, list-style-type, text-align, color, text-decoration-line, text-decoration-color, text-decoration-style, text-decoration-thickness, text-underline-offset, text-transform, text-overflow, text-wrap, text-indent, vertical-align, white-space, word-break, overflow-wrap, hyphens, content)
    - "Backgrounds" (background-attachment, background-clip, background-color, background-image, background-origin, background-position, background-repeat, background-size)
    - "Borders" (border-radius, border-width, border-color, border-style, outline-width, outline-color, outline-style, outline-offset)
    - "Effects" (box-shadow, text-shadow, opacity, mix-blend-mode, background-blend-mode, mask-clip, mask-composite, mask-image, mask-mode, mask-origin, mask-position, mask-repeat, mask-size, mask-type)
    - "Filters" (filter, blur, brightness, contrast, drop-shadow, grayscale, hue-rotate, invert, saturate, sepia, backdrop-filter)
    - "Tables" (border-collapse, border-spacing, table-layout, caption-side)
    - "Transitions & Animation" (transition-property, transition-behavior, transition-duration, transition-timing-function, transition-delay, animation)
    - "Transforms" (backface-visibility, perspective, perspective-origin, rotate, scale, skew, transform, transform-origin, transform-style, translate)
    - "Interactivity" (accent-color, appearance, caret-color, color-scheme, cursor, field-sizing, pointer-events, resize, scroll-behavior, scroll-margin, scroll-padding, scroll-snap-align, scroll-snap-stop, scroll-snap-type, touch-action, user-select, will-change)
    - "SVG" (fill, stroke, stroke-width)
    - "Accessibility" (forced-color-adjust) 
    

*   **\`notes\`**: (string) Concise, helpful tips and notes extracted from the documentation prose.
*   **\`control\`**: (object) A UI hint containing only one key:
    *  **\`type\`**: (string) The name of the UI control selected from the rules above.
*   **\`variants\`**: (array) This array represents the **prefixes** of a utility, derived from a \`.flatMap(...)\`. If there's no \`flatMap\`, or no multiple prefixes/variants, you will create a single variant. Each object in this array MUST have:
    *   **\`label\`**: (string) The human-friendly name (e.g., "All Sides", "Top Only").
    *   **\`prefix\`**: (string) The class prefix (e.g., \`m-\`, \`mt-\`).
    *   **\`template\`**: (string) The class template for this specific variant (e.g., "border-t-{value}").
    *   **\`supportsNegative\`**: (boolean) Set to \`true\` if the MDX code shows a negative version of the prefix.
*   **\`valueSets\`**: (array) This array describes the valid **suffixes** for the class. Each object in the array defines a category of valid values and MUST have a \`type\`.

    *   **\`{ "type": "list", "options": [...] }\`**: For a finite list of keyword options (e.g., \`auto\`, \`full\`). The \`options\` array contains objects like \`{ "class": "auto", "label": "auto" }, { "class": "content-center", "label": "Center" }\`.

    *   **\`{ "type": "suggestions", "source": "...", "examples": "[...]" }\`**: This is for values that come from a default scale. The \`source\` string **MUST** be one of the known keys from \`suggestions.json\` (e.g., \`"spacing"\`, \`"fractions"\`, \`"rotate"\`). You will determine the correct source by analyzing the MDX code. For example, if you see \`calc(var(--spacing) * <number>)\` or a list of spacing numbers, the source is \`"spacing"\`. If you see a list of rotation degrees, the source is \`"rotate"\`. Add the examples mentioned in the MDX doc file in "examples" array. 

    *   **\`{ "type": "arbitrary", "typeHint": "...", "placeholder":"..." }\`**: For arbitrary \`-[<value>]\` or \`-(<custom-property>)\` values (e.g., \`aspect-[]\`, \`w-[]\`, \`bg-[...]\`). The \`typeHint\` should be inferred from the MDX file context. The placeholder should be a concise, helpful example/examples of valid arbitrary value/s, derived from the documentation's examples or context (e.g., "1.5rem", "16/9", "15deg").

---
Example 1: Utility with a single list strategy
FILE CONTENT: (Content of align-content.mdx)
YOUR OUTPUT:
code
JSON
{
  "alignContent": {
    "label": "Align Content",
    "description": "Utilities for controlling how rows are positioned in multi-row flex and grid containers.",
    "docUrl": "https://tailwindcss.com/docs/align-content",
    "group": "Flexbox & Grid",
    "notes": "This utility controls the spacing between and around content items along the cross-axis of a container. It only has an effect on multi-row or multi-column flex/grid containers. For single-line alignment, use 'Align Items' instead.",
    "control": {
      "type": "Select"
    },
    "variants": [
      {
        "label": "Content",
        "prefix": "content-",
        "template": "{value}",
        "supportsNegative": false
      }
    ],
    "valueSets": [
      {
        "type": "list",
        "options": [
          { "class": "normal", "label": "Normal" },
          { "class": "center", "label": "Center" },
          { "class": "start", "label": "Start" },
          { "class": "end", "label": "End" },
          { "class": "between", "label": "Between" },
          { "class": "around", "label": "Around" },
          { "class": "evenly", "label": "Evenly" },
          { "class": "baseline", "label": "Baseline" },
          { "class": "stretch", "label": "Stretch" }
        ]
      }
    ]
  }
}

Example 2: Utility with a color theme strategy
FILE CONTENT: (Content of background-color.mdx, showing "...Object.entries(colors).map(([name, value]) => ...
YOUR OUTPUT:
code
JSON
{
  "backgroundColor": {
    "label": "Background Color",
    "description": "Utilities for controlling an element's background color.",
    "docUrl": "https://tailwindcss.com/docs/background-color",
    "group": "Backgrounds",
    "notes": "Background color utilities are generated from your theme's \`colors\` object. You can add an opacity modifier to any background color by adding a forward slash followed by a percentage value (0-100). For example, \`bg-red-500/50\` applies a 50% opacity to the red-500 color.",
    "control": {
      "type": "ColorPicker",
    },
    "variants": [
      {
        "label": "Default",
        "prefix": "bg-",
        "template": "bg-{value}",
        "supportsNegative": false
      }
    ],
    "valueSets": [
      {
        "type": "list",
        "options": [
          { "class": "inherit", "label": "Inherit" },
          { "class": "current", "label": "Current" },
          { "class": "transparent", "label": "Transparent" }
        ]
      },
      {
        "type": "suggestions",
        "source": "colors",
        "examples": ["red-500", "blue-500", "slate-800/50"]
      },
      {
        "type": "arbitrary",
        "typeHint": "color",
        "placeholder": "#bada55"
      }
    ]
  }
}

Example 3: Utility with list, suggestions, and arbitrary strategies
INPUT: (Content of aspect-ratio.mdx, which contains <ApiTable rows={[ ["aspect-square", ...], ["aspect-video", ...], ["aspect-auto", ...], ["aspect-[<value>]", ...] ]} />)
OUTPUT:
code
JSON
{
  "aspectRatio": {
    "label": "Aspect Ratio",
    "description": "Utilities for controlling the aspect ratio of an element.",
    "docUrl": "https://tailwindcss.com/docs/aspect-ratio",
    "group": "Layout",
    "notes": "Sets the preferred aspect ratio for an element. This is useful for sizing videos or images. \n- Use keywords like \`square\` (1/1) and \`video\` (16/9). \n- For arbitrary ratios, use the format \`width/height\` inside the brackets, for example \`[4/3]\`.",
    "control": {
      "type": "ComboBoxWithSlider",
    },
    "variants": [
      {
        "label": "Default",
        "prefix": "aspect-",
        "template": "aspect-{value}",
        "supportsNegative": false
      }
    ],
    "valueSets": [
      {
        "type": "list",
        "options": [
          { "class": "auto", "label": "Auto" },
          { "class": "square", "label": "Square (1/1)" },
          { "class": "video", "label": "Video (16/9)" }
        ]
      },
       {
        "type": "suggestions",
        "source": "ratios",
        "examples": ["3/2"]
      },
      {
        "type": "arbitrary",
        "typeHint": "ratio",
        "placeholder": "3/2"
      }
    ]
  }
}

Example 4: Utility with multiple variants and a numeric suggestion scale
INPUT: (Content of rotate.mdx, which contains multiple .flatMap calls for 2D and 3D rotations)
OUTPUT:
code
JSON
{
  "rotate": {
    "label": "Rotate",
    "description": "Utilities for rotating elements.",
    "docUrl": "https://tailwindcss.com/docs/rotate",
    "group": "Transforms",
    "notes": "Rotates an element in 2D or 3D space. Key points:\n- Default unit is degrees (\`deg\`).\n- Use negative values for counter-clockwise rotation (e.g., \`-rotate-45\`).\n- Use the X, Y, or Z variants (\`rotate-x-\`, \`rotate-y-\`) to rotate around a specific axis in 3D space.\n- Arbitrary values can use other units like \`rad\`, \`grad\`, or \`turn\`.",
    "control": {
      "type": "ComboBoxWithSlider",
    },
    "variants": [
      {
        "label": "Rotate (2D)",
        "prefix": "rotate-",
        "template": "rotate-{value}",
        "supportsNegative": true
      },
      {
        "label": "Rotate X",
        "prefix": "rotate-x-",
        "template": "rotate-x-{value}",
        "supportsNegative": true
      },
      {
        "label": "Rotate Y",
        "prefix": "rotate-y-",
        "template": "rotate-y-{value}",
        "supportsNegative": true
      },
      {
        "label": "Rotate Z",
        "prefix": "rotate-z-",
        "template": "rotate-z-{value}",
        "supportsNegative": true
      }
    ],
    "valueSets": [
      {
        "type": "list",
        "options": [
          { "class": "none", "label": "None" }
        ]
      },
      {
        "type": "suggestions",
        "source": "rotate",
        "examples": ["45", "90", "-90", "210"]
      },
      {
        "type": "arbitrary",
        "typeHint": "angle",
        "placeholder": "15deg"
      }
    ]
  }
}

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
                        const debugDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-6');
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
                    if (!definition.label || !definition.description || !definition.group || !definition.control || !definition.variants || !definition.valueSets) {
                        throw new Error('Parsed JSON is missing one or more root fields (label, description, group, control, variants, valueSets)');
                    }
                    
                    // Validate variants array
                    if (!Array.isArray(definition.variants) || definition.variants.length === 0) {
                        throw new Error('Parsed JSON is missing required variants array or it is empty');
                    }
                    
          // Validate each variant in the array
          for (const variant of definition.variants) {
            // prefix may be an empty string for utilities where the class is the value (e.g. "block", "flex").
            // require that prefix is present and is a string (can be empty), template is a string, label is non-empty,
            // and supportsNegative is a boolean.
            if (!variant.label || typeof variant.prefix !== 'string' || typeof variant.template !== 'string' || typeof variant.supportsNegative !== 'boolean') {
              throw new Error('Variant object missing required fields (label, prefix, template, supportsNegative)');
            }
          }
                    
                    // Validate valueSets array
                    if (!Array.isArray(definition.valueSets) || definition.valueSets.length === 0) {
                        throw new Error('Parsed JSON is missing required valueSets array or it is empty');
                    }
                    
                    // Validate each valueSet in the array
                    for (const valueSet of definition.valueSets) {
                        if (!valueSet.type) {
                            throw new Error('ValueSet object missing required type field');
                        }
                        
                        if (valueSet.type === 'list') {
                            if (!valueSet.options || !Array.isArray(valueSet.options)) {
                                throw new Error('List valueSet missing required options array');
                            }
                        } else if (valueSet.type === 'suggestions') {
                            if (!valueSet.source || !valueSet.examples || !Array.isArray(valueSet.examples)) {
                                throw new Error('Suggestions valueSet missing required source or examples array');
                            }
                        } else if (valueSet.type === 'arbitrary') {
                            if (!valueSet.typeHint || !valueSet.placeholder) {
                                throw new Error('Arbitrary valueSet missing required typeHint or placeholder');
                            }
                        } else {
                            throw new Error(`Unknown valueSet type: ${valueSet.type}`);
                        }
                    }

                    // If validation passes, add it to the definition
                    inspectorDefinition[category] = definition;
                    success = true;
                    console.log(`  ✅ Processed and validated ${file.name}`);

                    // Write a per-file processed JSON snapshot to the new debug folder for quick verification
                    try {
                        const processedDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-6');
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
                            const errDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-6');
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
                            const errDir = path.resolve(__dirname, '..', 'tmp', 'inspector-gen-debug-6');
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