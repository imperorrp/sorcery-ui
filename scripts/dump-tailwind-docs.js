#!/usr/bin/env node
/**
 * Dump Tailwind CSS Docs Script
 *
 * This script walks the Tailwind CSS documentation repository, downloads every
 * MDX file under `src/docs`, and appends its raw contents to an aggregated text
 * file. It also extracts every `<ApiTable>` usage and appends only those
 * snippets to a second aggregated file. No LLMs are used in this process.
 *
 * Both cumulative files are rewritten on each run to avoid duplicate entries
 * while still keeping a full record within a single execution.
 *
 * GitHub API requests are rate limited to 50 requests per minute to avoid
 * exceeding the default unauthenticated limit. Provide a `GITHUB_TOKEN` in your
 * environment for higher per-hour quotas and to reduce throttling risk.
 *
 * Usage: node scripts/dump-tailwind-docs.js
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const OWNER = 'tailwindlabs';
const REPO = 'tailwindcss.com';
const DOCS_ROOT = 'src/docs';
const BASE_CONTENTS_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents`;

const OUTPUT_DIR = path.resolve(__dirname, '..', 'tmp', 'doc-dump');
const ALL_DOCS_OUTPUT = path.join(OUTPUT_DIR, 'tailwind-docs.txt');
const API_TABLE_OUTPUT = path.join(OUTPUT_DIR, 'tailwind-apitables.txt');

const MAX_REQUESTS_PER_MINUTE = 50;
let requestCount = 0;
let windowStart = Date.now();

const axiosJSON = axios.create({
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
  },
});

const axiosRaw = axios.create({
  headers: {
    Accept: 'application/vnd.github.raw',
    ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
  },
  responseType: 'text',
});

async function rateLimit() {
  const now = Date.now();
  if (now - windowStart >= 60_000) {
    windowStart = now;
    requestCount = 0;
  }

  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = 60_000 - (now - windowStart);
    const waitSeconds = Math.ceil(waitTime / 1_000);
    console.log(`Rate limit reached (${MAX_REQUESTS_PER_MINUTE}/min). Waiting ${waitSeconds}s...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    windowStart = Date.now();
    requestCount = 0;
  }

  requestCount += 1;
}

async function fetchDirectory(relativePath) {
  const url = `${BASE_CONTENTS_URL}/${relativePath}`;
  await rateLimit();
  const { data } = await axiosJSON.get(url);
  return data;
}

async function fetchFile(relativePath) {
  const url = `${BASE_CONTENTS_URL}/${relativePath}`;
  await rateLimit();
  const { data } = await axiosRaw.get(url);
  return typeof data === 'string' ? data : String(data);
}

function extractApiTables(content) {
  const matches = [];
  const apiTableRegex = /<ApiTable\b[\s\S]*?(?:\/>|<\/ApiTable\s*>)/g;
  let match;
  while ((match = apiTableRegex.exec(content)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

function ensureOutputFiles() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(ALL_DOCS_OUTPUT, '', 'utf8');
  fs.writeFileSync(API_TABLE_OUTPUT, '', 'utf8');
}

function appendDocContent(filePath, content) {
  const header = `\n\n===== ${filePath} =====\n\n`;
  fs.appendFileSync(ALL_DOCS_OUTPUT, header + content, 'utf8');
}

function appendApiTables(filePath, apiTables) {
  const header = `\n\n===== ${filePath} (ApiTables) =====\n\n`;
  const body = apiTables.join('\n\n');
  fs.appendFileSync(API_TABLE_OUTPUT, header + body, 'utf8');
}

async function walkDocs(relativePath) {
  const entries = await fetchDirectory(relativePath);
  // Process directories in a deterministic order
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (entry.type === 'dir') {
      await walkDocs(entry.path);
      continue;
    }

    if (entry.type === 'file' && entry.name.endsWith('.mdx')) {
      await processFile(entry);
    }
  }
}

async function processFile(entry) {
  console.log(`Processing ${entry.path}...`);
  try {
    const content = await fetchFile(entry.path);
    appendDocContent(entry.path, content);

    const apiTables = extractApiTables(content);
    if (apiTables.length > 0) {
      appendApiTables(entry.path, apiTables);
    }
  } catch (error) {
    console.error(`Failed to process ${entry.path}:`, error.message);
  }
}

async function main() {
  ensureOutputFiles();
  console.log('Starting Tailwind docs dump...');
  await walkDocs(DOCS_ROOT);
  console.log('✅ Finished dumping Tailwind docs.');
  console.log(`  Full docs written to: ${ALL_DOCS_OUTPUT}`);
  console.log(`  ApiTable snippets written to: ${API_TABLE_OUTPUT}`);
}

main().catch((error) => {
  console.error('Unexpected error:', error.message);
  process.exitCode = 1;
});
