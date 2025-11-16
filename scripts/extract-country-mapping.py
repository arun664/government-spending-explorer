#!/usr/bin/env python3
"""
Extract unique country codes and names from IMF spending data CSV
Creates a mapping for countryMapping.js
"""

import csv
import json
from pathlib import Path

def extract_country_mapping():
    """Extract unique REF_AREA and REF_AREA_LABEL pairs from CSV"""
    
    csv_file = Path('../data/48-indicators/IMF_GFSE_GE_G14.csv')
    
    if not csv_file.exists():
        print(f"Error: {csv_file} not found")
        return
    
    country_map = {}
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get('REF_AREA', '').strip()
            name = row.get('REF_AREA_LABEL', '').strip()
            
            if code and name:
                country_map[code] = name
    
    # Sort by code
    sorted_countries = sorted(country_map.items())
    
    print(f"Found {len(sorted_countries)} unique countries\n")
    print("=" * 80)
    print("COUNTRY CODE MAPPING (for countryMapping.js)")
    print("=" * 80)
    print("\n// Extracted from IMF data - REF_AREA_LABEL to REF_AREA")
    print("const IMF_COUNTRY_MAP = {")
    
    for code, name in sorted_countries:
        # Escape single quotes in names
        escaped_name = name.replace("'", "\\'")
        print(f"  '{escaped_name}': '{code}',")
    
    print("}\n")
    
    # Also create reverse mapping (code to name) for display
    print("\n// Reverse mapping (code to name) for display")
    print("const CODE_TO_NAME = {")
    for code, name in sorted_countries:
        escaped_name = name.replace("'", "\\'")
        print(f"  '{code}': '{escaped_name}',")
    print("}\n")
    
    # Save to JSON file
    output_file = Path('country-mapping.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'nameToCode': {name: code for code, name in sorted_countries},
            'codeToName': dict(sorted_countries)
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Mapping saved to {output_file}")
    print(f"✅ Total countries: {len(sorted_countries)}")

if __name__ == '__main__':
    extract_country_mapping()
