/**
 * test-ai.js
 * Simple script for sending a basic request to the `/api/ai/generate-system` endpoint.
 * Intended for quick manual integration tests; update `imageUrl` and server URL to your environment.
 */
const fs = require('fs');
const path = require('path');

async function testGenerateSystem() {
    try {
        // Use a placeholder image URL or a real one if available. 
        // For this test, we'll use a public URL of a simple UI component.
        const imageUrl = 'https://ui.shadcn.com/og.jpg'; // Example image

        console.log('Sending request to generate design system...');

        const response = await fetch('http://localhost:5000/api/ai/generate-system', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server Error:', JSON.stringify(errorData, null, 2));
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success! Received design system:');
        console.log(JSON.stringify(data, null, 2));

        // Basic validation
        if (!data.registry || !Array.isArray(data.registry)) {
            console.error('Validation Failed: Registry is missing or not an array');
        } else {
            console.log(`Validation Passed: Received ${data.registry.length} components`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testGenerateSystem();
