#!/usr/bin/env python3
"""sanitize_code.py - Strip ANSI codes, fix encoding, normalize line endings."""
import sys
import re

def sanitize(filepath: str):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        code = f.read()
    # Remove ANSI escape sequences
    code = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', code)
    # Normalize line endings
    code = code.replace('\r\n', '\n').replace('\r', '\n')
    # Remove trailing whitespace per line
    code = '\n'.join(line.rstrip() for line in code.split('\n'))
    # Ensure file ends with newline
    if not code.endswith('\n'):
        code += '\n'
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Sanitized: {filepath}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python sanitize_code.py <file>")
        sys.exit(1)
    sanitize(sys.argv[1])
