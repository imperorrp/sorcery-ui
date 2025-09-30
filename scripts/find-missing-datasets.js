const fs = require('fs');
const path = require('path');

// Read the JSON files
const inspectorPath = path.join(__dirname, '../client/src/lib/definitions/tailwind-inspector.json');
const datasetsPath = path.join(__dirname, '../client/src/lib/definitions/datasets.json');

const inspectorData = JSON.parse(fs.readFileSync(inspectorPath, 'utf8'));
const datasetsData = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));

// Extract all dataset references from tailwind-inspector.json
const referencedDatasets = new Set();

function findDatasets(obj, path = '') {
  if (typeof obj === 'object' && obj !== null) {
    if (obj.dataset && typeof obj.dataset === 'string') {
      referencedDatasets.add(obj.dataset);
    }

    // Recursively search through all properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        findDatasets(obj[key], path + '.' + key);
      }
    }
  }
}

findDatasets(inspectorData);

// Get existing datasets
const existingDatasets = new Set(Object.keys(datasetsData));

// Find missing datasets
const missingDatasets = Array.from(referencedDatasets).filter(dataset => !existingDatasets.has(dataset));

console.log('Referenced datasets in tailwind-inspector.json:');
console.log(Array.from(referencedDatasets).sort());

console.log('\nExisting datasets in datasets.json:');
console.log(Array.from(existingDatasets).sort());

console.log('\nMissing datasets (referenced but not defined):');
if (missingDatasets.length === 0) {
  console.log('None! All referenced datasets are defined.');
} else {
  missingDatasets.forEach(dataset => {
    console.log(`- ${dataset}`);
  });
}