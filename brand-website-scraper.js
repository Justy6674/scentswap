#!/usr/bin/env node

/**
 * MULTI-BRAND WEBSITE SCRAPER
 *
 * Purpose: Scrape fragrance data from official brand websites
 * Strategy: Brand-specific parsers with common interface
 *
 * Features:
 * - Support for multiple luxury brand websites
 * - Intelligent product detection
 * - Data standardization and enhancement
 * - Automatic duplicate prevention via fragrance_master
 * - Rate limiting and respectful crawling
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, continue without it
}

// Supabase configuration - Load from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Track scraping statistics
let stats = {
  total_scraped: 0,
  successful_saves: 0,
  duplicates_skipped: 0,
  errors: 0,
  brands_processed: new Set()
};

// Brand-specific scraper configurations
const BRAND_CONFIGS = {
  'creed': {
    baseUrl: 'https://www.creedboutique.com',
    productListUrl: 'https://www.creedboutique.com/en/fragrances',
    productSelector: '.product-item',
    nameSelector: '.product-name',
    priceSelector: '.price',
    imageSelector: '.product-image img',
    linkSelector: 'a[href*="/fragrances/"]',
    detailSelectors: {
      description: '.product-description, .fragrance-notes',
      notes: '.notes-list, .fragrance-pyramid',
      concentration: '.concentration, .perfume-type',
      family: '.fragrance-family, .scent-family'
    },
    waitForSelector: '.product-grid, .products-list',
    rateLimit: 2000 // 2 seconds between requests
  },

  'tom-ford': {
    baseUrl: 'https://www.tomford.com',
    productListUrl: 'https://www.tomford.com/beauty/fragrance/',
    productSelector: '.product-tile',
    nameSelector: '.product-name, .pdp-product-name',
    priceSelector: '.price-current, .product-price',
    imageSelector: '.product-image img',
    linkSelector: 'a[href*="/fragrance/"]',
    detailSelectors: {
      description: '.product-description, .pdp-description',
      notes: '.fragrance-notes, .notes-accordion',
      concentration: '.concentration-info',
      family: '.fragrance-family'
    },
    waitForSelector: '.product-grid',
    rateLimit: 3000
  },

  'byredo': {
    baseUrl: 'https://byredo.com',
    productListUrl: 'https://byredo.com/en-au/perfumes',
    productSelector: '.product-card, .product-item',
    nameSelector: '.product-title, .product-name',
    priceSelector: '.price, .product-price',
    imageSelector: '.product-image img',
    linkSelector: 'a[href*="/perfumes/"]',
    detailSelectors: {
      description: '.product-description, .perfume-description',
      notes: '.fragrance-notes, .scent-notes',
      concentration: '.perfume-type',
      family: '.scent-family'
    },
    waitForSelector: '.products-grid',
    rateLimit: 2500
  },

  'diptyque': {
    baseUrl: 'https://www.diptyqueparis.com',
    productListUrl: 'https://www.diptyqueparis.com/en_au/fragrances/personal-fragrances.html',
    productSelector: '.product-item-info',
    nameSelector: '.product-item-link',
    priceSelector: '.price',
    imageSelector: '.product-image-main img',
    linkSelector: 'a.product-item-link',
    detailSelectors: {
      description: '.product-description',
      notes: '.fragrance-notes',
      concentration: '.product-attributes .concentration',
      family: '.product-attributes .family'
    },
    waitForSelector: '.products.list.items',
    rateLimit: 3000
  },

  'maison-margiela': {
    baseUrl: 'https://www.maisonmargiela.com',
    productListUrl: 'https://www.maisonmargiela.com/au/maison-margiela/fragrance/replica',
    productSelector: '.product-tile',
    nameSelector: '.product-name',
    priceSelector: '.product-price',
    imageSelector: '.product-image img',
    linkSelector: 'a[href*="/fragrance/"]',
    detailSelectors: {
      description: '.product-long-description',
      notes: '.fragrance-composition',
      concentration: '.product-type',
      family: '.olfactory-family'
    },
    waitForSelector: '.products-container',
    rateLimit: 4000
  }
};

class BrandScraper {
  constructor(brandName, config) {
    this.brandName = brandName;
    this.config = config;
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();

    // Set user agent to avoid bot detection
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
  }

  async scrapeProductList() {
    try {
      console.log(`🔍 Scraping ${this.brandName} product list...`);
      await this.page.goto(this.config.productListUrl, { waitUntil: 'networkidle2' });

      // Wait for products to load
      await this.page.waitForSelector(this.config.waitForSelector, { timeout: 10000 });

      // Extract product URLs
      const productUrls = await this.page.evaluate((selector, baseUrl) => {
        const links = document.querySelectorAll(selector);
        return Array.from(links).map(link => {
          const href = link.getAttribute('href');
          return href.startsWith('http') ? href : baseUrl + href;
        }).filter(url => url && url.includes('fragrance') || url.includes('perfume'));
      }, this.config.linkSelector, this.config.baseUrl);

      console.log(`📋 Found ${productUrls.length} products for ${this.brandName}`);
      return productUrls;

    } catch (error) {
      console.error(`❌ Error scraping ${this.brandName} product list:`, error.message);
      return [];
    }
  }

  async scrapeProductDetails(productUrl) {
    try {
      await this.page.goto(productUrl, { waitUntil: 'networkidle2' });

      // Extract product details
      const productData = await this.page.evaluate((selectors, brandName, productUrl) => {
        const getText = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : null;
        };

        const getImage = (selector) => {
          const img = document.querySelector(selector);
          return img ? img.src : null;
        };

        const extractNotes = (notesText) => {
          if (!notesText) return [];
          return notesText
            .replace(/notes?:?/gi, '')
            .split(/[,•·\n]/)
            .map(note => note.trim())
            .filter(note => note && note.length > 1);
        };

        // Extract data using selectors
        const name = getText(selectors.name);
        const description = getText(selectors.detailSelectors.description);
        const notesText = getText(selectors.detailSelectors.notes);
        const concentration = getText(selectors.detailSelectors.concentration);
        const family = getText(selectors.detailSelectors.family);
        const imageUrl = getImage(selectors.image);

        // Extract price (with currency handling)
        const priceElement = document.querySelector(selectors.price);
        let price = null;
        if (priceElement) {
          const priceText = priceElement.textContent;
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0].replace(',', ''));
          }
        }

        const notes = extractNotes(notesText);

        return {
          name,
          brand: brandName,
          description,
          notes: notes.length > 0 ? notes : null,
          concentration,
          family,
          image_url: imageUrl,
          average_price_aud: price,
          source_url: productUrl,
          country: brandName === 'creed' ? 'UK' :
                  brandName === 'tom-ford' ? 'USA' :
                  brandName === 'byredo' ? 'Sweden' :
                  brandName === 'diptyque' ? 'France' :
                  brandName === 'maison-margiela' ? 'France' : null,
          gender: 'unisex', // Most luxury brands are unisex
          market_tier: 'luxury'
        };
      }, this.config, this.brandName, productUrl);

      // Skip if missing essential data
      if (!productData.name) {
        console.log(`⚠️  Skipping product with no name: ${productUrl}`);
        return null;
      }

      return productData;

    } catch (error) {
      console.error(`❌ Error scraping product ${productUrl}:`, error.message);
      stats.errors++;
      return null;
    }
  }

  async saveToDatabase(productData) {
    try {
      // Generate a synthetic Fragrantica-style URL for uniqueness
      const syntheticUrl = `https://www.fragrantica.com/perfume/${productData.brand.toLowerCase().replace(/\s+/g, '-')}/${productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-scraped.html`;

      const { data, error } = await supabase.rpc('enrich_fragrance_master', {
        p_fragrantica_url: syntheticUrl,
        p_name: productData.name,
        p_brand: productData.brand,
        p_concentration: productData.concentration,
        p_family: productData.family,
        p_country: productData.country,
        p_gender: productData.gender,
        p_top_notes: productData.notes,
        p_middle_notes: null,
        p_base_notes: null,
        p_image_url: productData.image_url,
        p_average_price_aud: productData.average_price_aud,
        p_market_tier: productData.market_tier,
        p_description: productData.description,
        p_source_type: 'brand_website_scraper'
      });

      if (error) throw error;

      const result = data[0];
      stats.total_scraped++;

      if (result.action_taken === 'CREATED') {
        stats.successful_saves++;
        console.log(`✨ CREATED: ${productData.name} (${productData.brand})`);
      } else if (result.action_taken === 'ENHANCED') {
        stats.successful_saves++;
        console.log(`🔧 ENHANCED: ${productData.name} - Fields: ${result.updated_fields.join(', ')}`);
      } else {
        stats.duplicates_skipped++;
        console.log(`✅ VERIFIED: ${productData.name} (no updates needed)`);
      }

      return true;

    } catch (error) {
      console.error(`❌ Error saving ${productData.name}:`, error.message);
      stats.errors++;
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function scrapeBrand(brandName) {
  const config = BRAND_CONFIGS[brandName];
  if (!config) {
    console.error(`❌ No configuration found for brand: ${brandName}`);
    return;
  }

  const scraper = new BrandScraper(brandName, config);

  try {
    await scraper.init();
    stats.brands_processed.add(brandName);

    // Get product URLs
    const productUrls = await scraper.scrapeProductList();

    // Limit for testing (remove in production)
    const limitedUrls = productUrls.slice(0, 5);

    for (const url of limitedUrls) {
      console.log(`🔍 Scraping: ${url}`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, config.rateLimit));

      const productData = await scraper.scrapeProductDetails(url);

      if (productData) {
        await scraper.saveToDatabase(productData);
      }
    }

  } catch (error) {
    console.error(`❌ Error scraping brand ${brandName}:`, error.message);
  } finally {
    await scraper.cleanup();
  }
}

async function scrapeAllBrands() {
  console.log('🚀 Starting Multi-Brand Website Scraper...');
  console.log('🎯 Target Brands:', Object.keys(BRAND_CONFIGS).join(', '));
  console.log('');

  for (const brandName of Object.keys(BRAND_CONFIGS)) {
    console.log(`\n🏢 Scraping ${brandName.toUpperCase()}...`);
    console.log('═'.repeat(50));

    await scrapeBrand(brandName);

    // Pause between brands
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Print final statistics
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📊 MULTI-BRAND SCRAPING COMPLETE');
  console.log('═'.repeat(70));
  console.log(`🏢 Brands Processed: ${Array.from(stats.brands_processed).join(', ')}`);
  console.log(`📈 Total Scraped: ${stats.total_scraped}`);
  console.log(`✨ Successfully Saved: ${stats.successful_saves}`);
  console.log(`🔄 Duplicates Skipped: ${stats.duplicates_skipped}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log('');
  console.log('✅ All brands processed! Data enhanced in fragrance_master table.');
  console.log('═'.repeat(70));
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node brand-website-scraper.js all');
    console.log('  node brand-website-scraper.js creed');
    console.log('  node brand-website-scraper.js tom-ford');
    console.log('  node brand-website-scraper.js byredo');
    console.log('  node brand-website-scraper.js diptyque');
    console.log('  node brand-website-scraper.js maison-margiela');
    process.exit(1);
  }

  if (args[0] === 'all') {
    scrapeAllBrands().catch(error => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
  } else {
    scrapeBrand(args[0]).catch(error => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { scrapeBrand, scrapeAllBrands, BRAND_CONFIGS };