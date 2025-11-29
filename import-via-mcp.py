#!/usr/bin/env python3

import csv
import json
import requests
import os
from urllib.parse import quote

# Supabase configuration
SUPABASE_URL = 'https://vdcgbaxjfllprhknwwyd.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkY2diYXhqZmxscHJoa253d3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTk0OTAsImV4cCI6MjA3OTY5NTQ5MH0.CawIFYm5abxyLqeoQwSLRYZRAOdlGHfjDHqjNOvHoVk'

def execute_sql(sql):
    """Execute SQL via REST API"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }

    # Use direct SQL execution endpoint
    url = f"{SUPABASE_URL}/rest/v1/rpc/sql"
    data = {'query': sql}

    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error executing SQL: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Exception executing SQL: {e}")
        return None

def load_csv_data():
    """Load and parse CSV data"""
    brands = set()
    notes = set()
    fragrances = []

    try:
        encodings = ['utf-8', 'latin-1', 'cp1252']
        for encoding in encodings:
            try:
                with open('fra_cleaned.csv', 'r', encoding=encoding) as f:
                    reader = csv.reader(f, delimiter=';')
                    header = next(reader)  # Skip header

                    for i, row in enumerate(reader):
                        if len(row) < 11:
                            continue

                        # Extract data
                        url = row[0]
                        name = row[1]
                        brand = row[2].replace('-', ' ').title().replace(' ', '-')
                        country = row[3]
                        gender = row[4].lower()
                        if gender == 'women': gender = 'female'
                        if gender == 'men': gender = 'male'

                        try:
                            rating = float(row[5].replace(',', '.')) if row[5] else None
                        except:
                            rating = None

                        try:
                            year = int(row[7]) if row[7] else None
                        except:
                            year = None

                        top_notes = [n.strip() for n in row[8].split(',') if n.strip() and n.strip().lower() != 'unknown']
                        middle_notes = [n.strip() for n in row[9].split(',') if n.strip() and n.strip().lower() != 'unknown']
                        base_notes = [n.strip() for n in row[10].split(',') if n.strip() and n.strip().lower() != 'unknown']

                        # Add to sets
                        brands.add(brand)
                        notes.update(top_notes + middle_notes + base_notes)

                        fragrances.append({
                            'url': url,
                            'name': name,
                            'brand': brand,
                            'country': country,
                            'gender': gender,
                            'rating': rating,
                            'year': year,
                            'top_notes': top_notes,
                            'middle_notes': middle_notes,
                            'base_notes': base_notes
                        })

                        if i % 1000 == 0:
                            print(f"Processed {i} rows...")

                break  # Success with this encoding

            except UnicodeDecodeError:
                continue

    except Exception as e:
        print(f"Error loading CSV: {e}")
        return None, None, None

    return list(brands), list(notes), fragrances

def create_brands_batch(brands_batch):
    """Create a batch of brands"""
    if not brands_batch:
        return True

    # Escape quotes in brand names
    escaped_brands = [brand.replace("'", "''") for brand in brands_batch]
    sql_values = [f"('{brand}')" for brand in escaped_brands]
    sql = f"""
    INSERT INTO brands (name) VALUES
    {','.join(sql_values)}
    ON CONFLICT (name) DO NOTHING;
    """

    result = execute_sql(sql)
    return result is not None

def create_notes_batch(notes_batch):
    """Create a batch of notes"""
    if not notes_batch:
        return True

    # Escape quotes in note names
    escaped_notes = [note.replace("'", "''") for note in notes_batch]
    sql_values = [f"('{note}')" for note in escaped_notes]
    sql = f"""
    INSERT INTO notes (name) VALUES
    {','.join(sql_values)}
    ON CONFLICT (name) DO NOTHING;
    """

    result = execute_sql(sql)
    return result is not None

def main():
    print("🚀 Starting MCP-based CSV import...")

    # Load data
    print("📄 Loading CSV data...")
    brands, notes, fragrances = load_csv_data()

    if not brands:
        print("❌ Failed to load data")
        return

    print(f"✅ Loaded {len(brands)} brands, {len(notes)} notes, {len(fragrances)} fragrances")

    # Create brands in batches
    print(f"\n🏢 Creating {len(brands)} brands...")
    batch_size = 50
    for i in range(0, len(brands), batch_size):
        batch = brands[i:i+batch_size]
        print(f"Creating brands batch {i//batch_size + 1}/{(len(brands) + batch_size - 1)//batch_size}")
        if not create_brands_batch(batch):
            print(f"Failed to create brands batch {i//batch_size + 1}")

    print("✅ Brands creation completed")

    # Create notes in batches
    print(f"\n🌸 Creating {len(notes)} notes...")
    for i in range(0, len(notes), batch_size):
        batch = notes[i:i+batch_size]
        print(f"Creating notes batch {i//batch_size + 1}/{(len(notes) + batch_size - 1)//batch_size}")
        if not create_notes_batch(batch):
            print(f"Failed to create notes batch {i//batch_size + 1}")

    print("✅ Notes creation completed")

    print("🎉 Import completed! Check Supabase to verify the data.")

if __name__ == "__main__":
    main()