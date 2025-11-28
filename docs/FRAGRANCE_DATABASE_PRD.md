# Product Requirements Document: Comprehensive Fragrance Database for ScentSwap

## 1. Introduction

Creating a comprehensive fragrance database for ScentSwap involves gathering detailed perfume information and organizing it for easy filtering and discovery. This database will serve as the backbone for listing verification, AI assessment, and user discovery features.

**Key Data Points:**
- Perfume Names & Brands
- Note Pyramids (Top/Middle/Base)
- Fragrance Families
- Target Audience (Gender/Unisex)
- Launch Year & Perfumers
- Batch Codes
- Prices (AUD) & Local Retailers
- Resale/Swappability Metrics

## 2. Public Fragrance Datasets & Sources

### Open Datasets
- **Kaggle:** Existing datasets scraped from Fragrantica (approx. 50,000+ perfumes) and Parfumo can provide a solid foundation for names, notes, and basic attributes.
- **Scope:** Example datasets include ~37,000 perfumes from 2,570 brands with 2,145 distinct notes.

### Open Projects & Communities
- **Community Bases:** Parfumo (216,000+ perfumes) and Basenotes maintain extensive user-contributed data.
- **Open Source:** Projects like "Scent of Data" on Kaggle or GitHub repositories for recommendation systems can provide legal ways to obtain metadata without direct scraping.

### Official Resources
- **Brands:** Press releases and product pages for official note pyramids, perfumers, and launch years.
- **Retailers:** Myer, David Jones, Mecca, Libertine, Lore. These sources provide descriptions, ingredient notes, and Australian pricing.
- **Affiliate Feeds:** Joining retailer affiliate programs often grants legal access to product data feeds.

### Fragrance Catalog APIs
- **Fragella API:** Structured JSON on 74,000+ perfumes (notes, accords, longevity, sillage, images).
- **RapidAPI FragranceFinder:** Searchable index of thousands of perfumes.
- **Strategy:** Use these APIs to populate and update the database, ensuring terms of use are respected.

## 3. Industry Standards for Perfume Classification

To ensure discoverability and alignment with user expectations, the database will adhere to industry standards.

### Data Points & Classification
1.  **Olfactory Pyramid (Notes):**
    *   **Top:** Volatile, first impression (e.g., Bergamot, Lemon).
    *   **Heart (Middle):** Core of the fragrance (e.g., Rose, Jasmine).
    *   **Base:** Long-lasting foundation (e.g., Musk, Vetiver).
2.  **Fragrance Families:**
    *   Based on **Michael Edwards’ Fragrance Wheel**.
    *   **Major Families:** Woody, Floral, Amber (Oriental), Fresh.
    *   **Subfamilies:** Citrus, Aromatic, Soft Floral, Woody Oriental, etc.
3.  **Target Audience:** Female, Male, Unisex.
4.  **Launch Year:** Release date and discontinuation status (critical for vintage value).
5.  **Perfumers ("Noses"):** Creator of the scent (e.g., Alberto Morillas) linked via a relational table.
6.  **Accords & Performance:** Main accords (e.g., "woody spicy") and performance metrics (longevity, sillage) aggregated from user feedback.
7.  **Batch Codes:** Support for verifying age/authenticity. Integration with batch code checkers (e.g., CheckFresh) or storing format patterns.
8.  **Swappability / Resale Interest:**
    *   **Metrics:** Discontinued status, "Want" lists, secondary market activity.
    *   **Swap Score:** A calculated metric to indicate trade desirability.

## 4. Safe and Legal Data Collection

**Principle:** Prioritize legal data sourcing (open data, partnerships, user contributions) over unauthorized scraping.

### Guidelines
*   **Terms of Service:** Strict adherence to ToS of source sites (e.g., Fragrantica prohibits scraping).
*   **Copyright:** Focus on factual data (notes, years) which is generally not copyrightable, rather than proprietary descriptions or reviews.
*   **Partnerships:** Seek collaboration with data-rich platforms or use paid APIs.
*   **Ethical Scraping:** If scraping retailer pricing/stock, respect `robots.txt`, rate limits, and use robust frameworks.
*   **User Contributions:** Crowdsource data additions/edits from the community (similar to Parfumo) to build original value.

## 5. Database Schema & Structure

The database will use a normalized relational schema (PostgreSQL via Supabase) to handle complex relationships.

### Core Tables
*   **`brands`**: `id`, `name`, `country`, `website`
*   **`perfumers`**: `id`, `name`, `bio`
*   **`fragrances`**: `id`, `name`, `brand_id`, `gender`, `concentration`, `launch_year`, `is_discontinued`, `image_url`
*   **`notes`**: `id`, `name`, `family` (e.g., Citrus, Wood)
*   **`fragrance_notes`**: `fragrance_id`, `note_id`, `type` (Top/Heart/Base)
*   **`fragrance_perfumers`**: `fragrance_id`, `perfumer_id`
*   **`retail_offers`**: `fragrance_id`, `retailer_name`, `price_aud`, `url`, `last_updated`
*   **`swappability_metrics`**: `fragrance_id`, `want_count`, `own_count`, `swap_count`, `popularity_score`

### Advanced Features
*   **Search:** Full-text search (SQL trigram or external index like Typesense/Elasticsearch) for names and notes.
*   **Filtering:** Multi-facet filtering by Note, Family, Brand, Year, Gender.
*   **Similarity:** Potential for vector-based recommendation engine using note profiles.

## 6. Technical Implementation Strategy

### Data Pipeline
1.  **Initial Population:** Bootstrap with open datasets (Kaggle) and vetted APIs (Fragella).
2.  **Updates:**
    *   **Cron Jobs:** Weekly scraping of authorized retailer prices.
    *   **Feed Parsing:** RSS feeds or news sites for new releases.
    *   **User Submission:** Moderation queue for user-submitted missing fragrances.
3.  **Scalability:**
    *   Pagination and lazy loading for frontend.
    *   Caching static data (Brands, Notes) and frequent queries (Popular Perfumes).
    *   Cloud-hosted images (CDN).

### Tech Stack
*   **Database:** PostgreSQL (Supabase).
*   **Backend:** Node.js/TypeScript (Next.js API routes or Supabase Edge Functions).
*   **Scraping/Ingestion:** Python (Scrapy/BeautifulSoup) or Node.js (Crawlee).

## 7. Conclusion

Building this database requires a balanced approach of leveraging existing data resources while building a unique, legally sound asset through community engagement and specific local (Australian) market data. The result will be a robust engine empowering ScentSwap users to discover and trade with confidence.

---
*Sources:*
*   Reddit discussion on building a fragrance website (Fragrantica/Kaggle)
*   GitHub Perfume Recommender
*   Fragrantica & ScraperAPI guides on legality
*   Michael Edwards’ Fragrance Wheel
*   Fragella API & Parfumo Research stats

