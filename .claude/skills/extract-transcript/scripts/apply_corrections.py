#!/usr/bin/env python3
"""
Apply correction map to transcript file.

Usage:
  python3 apply_corrections.py <transcript_file> <corrections_json_file>

corrections_json_file format:
  {"corrections": [{"wrong": "...", "right": "..."}, ...]}

Output (JSON to stdout):
  {"success": true, "corrections_applied": 12}
"""

import sys
import json
import re


def main():
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: apply_corrections.py <transcript_file> <corrections_json_file>',
        }))
        sys.exit(1)

    transcript_file = sys.argv[1]
    corrections_file = sys.argv[2]

    with open(transcript_file, 'r', encoding='utf-8') as f:
        text = f.read()

    with open(corrections_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    corrections = data.get('corrections', [])
    total_applied = 0

    for item in corrections:
        wrong = item.get('wrong', '')
        right = item.get('right', '')
        if not wrong or wrong == right:
            continue

        count = len(re.findall(re.escape(wrong), text, re.IGNORECASE))
        if count > 0:
            text = re.sub(re.escape(wrong), right, text, flags=re.IGNORECASE)
            total_applied += count

    with open(transcript_file, 'w', encoding='utf-8') as f:
        f.write(text)

    print(json.dumps({'success': True, 'corrections_applied': total_applied}))


if __name__ == '__main__':
    main()
