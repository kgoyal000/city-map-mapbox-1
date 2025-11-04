const fs = require('fs');
const path = require('path');

// Directory containing map styles
const stylesDir = './map-styles';

// Get all JSON files in the directory
const files = fs.readdirSync(stylesDir).filter(file => file.endsWith('.json'));

files.forEach(file => {
    const filePath = path.join(stylesDir, file);

    try {
        // Read and parse the JSON file
        const content = fs.readFileSync(filePath, 'utf8');
        const style = JSON.parse(content);

        // Update the openmaptiles source to include tileSize
        if (style.sources && style.sources.openmaptiles) {
            // Add tileSize: 512 to the source
            style.sources.openmaptiles.tileSize = 512;

            console.log(`Updating ${file}...`);
            console.log('  - Added tileSize: 512 to openmaptiles source');
        }

        // Write the updated JSON back to file
        fs.writeFileSync(filePath, JSON.stringify(style, null, 4));
        console.log(`  ✓ ${file} updated successfully\n`);

    } catch (error) {
        console.error(`Error processing ${file}:`, error.message);
    }
});

console.log('All map styles have been updated with tileSize: 512');
console.log('\nThis change will make the maps show more detail at each zoom level,');
console.log('matching the behavior of PositivePrints where their zoom 14 looks like our previous zoom 12.');