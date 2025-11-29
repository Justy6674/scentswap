#!/usr/bin/env node

/**
 * NEW DATASET CONVERTER FOR ADMIN IMPORT
 *
 * Purpose: Convert the new fragrance dataset to admin-compatible format
 * Input: brand,perfume,type,category,target_audience,longevity
 * Output: semicolon-separated format for admin bulk import
 *
 * This script transforms your new dataset so it can be imported
 * through the admin page CSV import functionality.
 */

const fs = require('fs');

// Field mappings for data standardization
const CONCENTRATION_MAPPING = {
  'edp': 'Eau de Parfum',
  'edt': 'Eau de Toilette',
  'parfum': 'Parfum',
  'extrait': 'Extrait de Parfum',
  'edc': 'Eau de Cologne',
  'eau de parfum': 'Eau de Parfum',
  'eau de toilette': 'Eau de Toilette'
};

const FAMILY_MAPPING = {
  'fresh scent': 'Fresh',
  'woody spicy': 'Woody Spicy',
  'oriental spicy': 'Oriental Spicy',
  'woody aromatic': 'Woody Aromatic',
  'citrus aromatic': 'Citrus Aromatic',
  'fresh spicy': 'Fresh Spicy',
  'oriental': 'Oriental',
  'woody': 'Woody',
  'fresh': 'Fresh',
  'floral': 'Floral',
  'fruity': 'Fruity',
  'spicy': 'Spicy',
  'aquatic': 'Aquatic'
};

const GENDER_MAPPING = {
  'male': 'male',
  'female': 'female',
  'unisex': 'unisex',
  'men': 'male',
  'women': 'female'
};

const LONGEVITY_MAPPING = {
  'strong': '4.5',
  'medium': '3.5',
  'light': '2.5',
  'very strong': '5.0',
  'weak': '2.0'
};

function cleanBrand(brand) {
  if (!brand) return '';

  // Clean and standardize brand names
  return brand
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\s+/g, ' ');
}

function cleanFragranceName(name) {
  if (!name) return '';

  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ');
}

function mapConcentration(type) {
  if (!type) return 'Eau de Parfum'; // Default

  const cleaned = type.toLowerCase().trim();
  return CONCENTRATION_MAPPING[cleaned] || type;
}

function mapFamily(category) {
  if (!category) return '';

  const cleaned = category.toLowerCase().trim();
  return FAMILY_MAPPING[cleaned] || category;
}

function mapGender(targetAudience) {
  if (!targetAudience) return 'unisex';

  const cleaned = targetAudience.toLowerCase().trim();
  return GENDER_MAPPING[cleaned] || 'unisex';
}

function mapLongevity(longevity) {
  if (!longevity) return '';

  const cleaned = longevity.toLowerCase().trim();
  return LONGEVITY_MAPPING[cleaned] || '';
}

function generateSyntheticUrl(brand, perfume) {
  // Generate a synthetic Fragrantica-style URL for uniqueness
  const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const perfumeSlug = perfume.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return `https://www.fragrantica.com/perfume/${brandSlug}/${perfumeSlug}-imported.html`;
}

function convertDataset(inputFile, outputFile) {
  console.log('🔄 Converting new dataset for admin import...');
  console.log(`📂 Input: ${inputFile}`);
  console.log(`💾 Output: ${outputFile}`);
  console.log('');

  try {
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('Input file is empty');
    }

    // Skip header line and process data
    const dataLines = lines.slice(1);
    console.log(`📊 Found ${dataLines.length} fragrance records`);

    // Convert to admin format
    const convertedLines = ['fragrantica_url;name;brand;country;gender;rating_value;rating_count;year_released;top_notes;middle_notes;base_notes;perfumer1;perfumer2;accord1;accord2;accord3;accord4;accord5;concentration;family'];

    let processedCount = 0;
    let skippedCount = 0;

    for (const line of dataLines) {
      if (!line.trim()) continue;

      const parts = line.split(',').map(part => part.trim().replace(/^["']|["']$/g, ''));

      // Validate required fields
      if (parts.length < 6 || !parts[0] || !parts[1]) {
        console.log(`⚠️  Skipping invalid line: ${line.substring(0, 50)}...`);
        skippedCount++;
        continue;
      }

      const [brand, perfume, type, category, targetAudience, longevity] = parts;

      // Clean and map data
      const cleanedBrand = cleanBrand(brand);
      const cleanedPerfume = cleanFragranceName(perfume);
      const mappedConcentration = mapConcentration(type);
      const mappedFamily = mapFamily(category);
      const mappedGender = mapGender(targetAudience);
      const mappedLongevityRating = mapLongevity(longevity);
      const syntheticUrl = generateSyntheticUrl(cleanedBrand, cleanedPerfume);

      // Build admin-compatible line
      const adminLine = [
        syntheticUrl,                    // fragrantica_url
        cleanedPerfume,                  // name
        cleanedBrand,                    // brand
        '',                              // country (blank)
        mappedGender,                    // gender
        mappedLongevityRating,           // rating_value (use longevity as rating)
        '',                              // rating_count (blank)
        '',                              // year_released (blank)
        '',                              // top_notes (blank)
        '',                              // middle_notes (blank)
        '',                              // base_notes (blank)
        '',                              // perfumer1 (blank)
        '',                              // perfumer2 (blank)
        '',                              // accord1 (blank)
        '',                              // accord2 (blank)
        '',                              // accord3 (blank)
        '',                              // accord4 (blank)
        '',                              // accord5 (blank)
        mappedConcentration,             // concentration
        mappedFamily                     // family
      ].join(';');

      convertedLines.push(adminLine);
      processedCount++;

      if (processedCount % 100 === 0) {
        console.log(`✅ Processed ${processedCount} records...`);
      }
    }

    // Write converted data
    fs.writeFileSync(outputFile, convertedLines.join('\n'), 'utf8');

    console.log('');
    console.log('═'.repeat(60));
    console.log('🎉 CONVERSION COMPLETE');
    console.log('═'.repeat(60));
    console.log(`✅ Processed: ${processedCount} fragrances`);
    console.log(`⚠️  Skipped: ${skippedCount} invalid lines`);
    console.log(`💾 Output: ${outputFile}`);
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Open ScentSwap admin page');
    console.log('2. Go to Database tab → Import section');
    console.log('3. Load the converted CSV file');
    console.log('4. Click "Process CSV" to import');
    console.log('');
    console.log('🔧 DATA MAPPINGS APPLIED:');
    console.log('- brand → Brand (cleaned and title-cased)');
    console.log('- perfume → Name (cleaned and title-cased)');
    console.log('- type → Concentration (mapped to full names)');
    console.log('- category → Family (standardized)');
    console.log('- target_audience → Gender (male/female/unisex)');
    console.log('- longevity → Rating Value (Strong=4.5, Medium=3.5, etc.)');
    console.log('- Generated synthetic Fragrantica URLs for uniqueness');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

function showUsage() {
  console.log('Usage:');
  console.log('  node convert-new-dataset.js <input.csv> [output.csv]');
  console.log('');
  console.log('Example:');
  console.log('  node convert-new-dataset.js new-fragrance-data.csv admin-import.csv');
  console.log('');
  console.log('Input format expected:');
  console.log('  brand,perfume,type,category,target_audience,longevity');
  console.log('');
  console.log('Output format (admin-compatible):');
  console.log('  url;name;brand;country;gender;rating_value;...(semicolon-separated)');
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const inputFile = args[0];
  const outputFile = args[1] || 'admin-import-ready.csv';

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  convertDataset(inputFile, outputFile);
}

module.exports = { convertDataset };