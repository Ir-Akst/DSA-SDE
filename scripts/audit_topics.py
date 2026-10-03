#!/usr/bin/env python3
"""
Dataset Quality & Topic Balance Auditor
"""

import json
import os
from collections import Counter

DATASET_PATH = os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'default-sheets.js')

def audit():
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        raw = f.read()
        start = raw.find('[')
        end = raw.rfind(']') + 1
        data = json.loads(raw[start:end])

    print(f"Total problems in dataset: {len(data)}")

    print("\n" + "="*30 + " TOPIC BREAKDOWN " + "="*30)
    topic_counts = Counter(p['topic'] for p in data)
    for t, c in sorted(topic_counts.items(), key=lambda x: -x[1]):
        print(f"  {t:35s} : {c:3d} problems")

    print("\n" + "="*30 + " SHEET BREAKDOWN " + "="*30)
    sheet_counts = Counter()
    for p in data:
        for s in p.get('sheets', []):
            sheet_counts[s] += 1
    for s, c in sorted(sheet_counts.items(), key=lambda x: -x[1]):
        print(f"  {s:35s} : {c:3d} problems")

    print("\n" + "="*30 + " COMPANY BREAKDOWN (TOP 10) " + "="*30)
    comp_counts = Counter()
    for p in data:
        for comp in p.get('companies', []):
            comp_counts[comp] += 1
    for comp, c in comp_counts.most_common(10):
        print(f"  {comp:35s} : {c:3d} problems")

if __name__ == '__main__':
    audit()
