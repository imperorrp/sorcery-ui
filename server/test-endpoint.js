/**
 * test-endpoint.js
 * Test script that uses a generated small PNG buffer to POST to the AI endpoint.
 * Useful for validating multipart handling (file uploads) on the `/api/ai/generate-system` route.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testEndpoint() {
  const formData = new FormData();
  
  // Create a dummy image file
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const blob = new Blob([buffer], { type: 'image/png' });
  
  formData.append('image', blob, 'test.png');

  try {
    console.log('Sending request to http://localhost:3001/api/ai/generate-system...');
    const response = await fetch('http://localhost:3001/api/ai/generate-system', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
    }

    const data = await response.json();
    console.log('Success:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testEndpoint();
