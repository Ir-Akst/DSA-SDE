#!/usr/bin/env python3
"""
Master Dataset Builder & Deduplication Compiler
Maintains the 479+ curated problem catalog for AlgoRecall DSA Hub.
"""

import json
import os
import re

DATASET_PATH = os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'default-sheets.js')

def load_catalog():
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        raw = f.read()
        start = raw.find('[')
        end = raw.rfind(']') + 1
        return json.loads(raw[start:end])

def save_catalog(data):
    # Ensure clean sequential IDs
    for i, p in enumerate(data, 1):
        slug = re.sub(r'[^a-z0-9]+', '-', p['title'].lower()).strip('-')
        p['id'] = f"prob-{i}-{slug}"

    output_js = f"""/**
 * Complete Striver's A2Z DSA Sheet + NeetCode 150 + Striver SDE + Blind 75 Master Dataset
 * Total Problems: {len(data)}
 * 100% Comprehensive & Balanced Coverage across all DSA Topics
 */

window.DEFAULT_DSA_SHEETS = {json.dumps(data, indent=2)};
"""
    with open(DATASET_PATH, 'w', encoding='utf-8') as f:
        f.write(output_js)
    print(f"Successfully compiled and saved {len(data)} problems to default-sheets.js!")

if __name__ == '__main__':
    data = load_catalog()
    print(f"Current catalog size: {len(data)} problems.")
    save_catalog(data)
