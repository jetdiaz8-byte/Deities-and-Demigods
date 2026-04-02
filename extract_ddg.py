#!/usr/bin/env python3
"""
Extract Deities & Demigods entity data from PDF files.
This script parses the TSR Deities & Demigods (1980) PDFs and extracts
all entity statistics into a structured JSON format.
"""

import pdfplumber
import json
import re
import os
from pathlib import Path

# Output file
OUTPUT_FILE = "/home/z/my-project/ddg_entities.json"

# Input PDFs
PDF_FILES = [
    "/home/z/my-project/upload/tsr02013 - Deities And Demigods.pdf",
    "/home/z/my-project/upload/tsr02013 - Deities And Demigods 1.pdf",
    "/home/z/my-project/upload/tsr02013 - Deities And Demigods 2.pdf",
]

def clean_text(text):
    """Clean extracted text"""
    if not text:
        return ""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove weird characters
    text = text.replace('\x00', '')
    return text.strip()

def extract_number(text, default=0):
    """Extract a number from text"""
    if not text:
        return default
    match = re.search(r'-?\d+', str(text))
    return int(match.group()) if match else default

def parse_stat_block(lines, current_pantheon="Unknown"):
    """Parse a stat block for an entity"""
    entity = {
        "name": "",
        "title": "",
        "pantheon": current_pantheon,
        "align": "Neutral",
        "hp": 100,
        "maxHp": 100,
        "AC": 0,
        "MR": 0,
        "Move": "",
        "abilities": [],
        "personality": "",
        "category": "lesser_gods",
        "attacks": "",
        "damage": "",
        "special": [],
        "spells": [],
        "psionics": "",
        "worshipers": "",
        "symbol": "",
        "plane": "",
        "cleric_spells": "",
        "description": ""
    }
    
    full_text = " ".join(lines)
    
    # Try to find name (usually first capitalized words)
    for line in lines[:5]:
        line = line.strip()
        if line and len(line) > 2:
            # Check if it looks like a name (capitalized, not a stat)
            if re.match(r'^[A-Z][a-z]+(\s+[A-Z][a-z]+)*', line):
                entity["name"] = line.split('(')[0].strip()
                break
    
    # Extract AC (look for "AC" followed by number or "Armor Class")
    ac_match = re.search(r'AC\s*(-?\d+)', full_text, re.IGNORECASE)
    if ac_match:
        entity["AC"] = int(ac_match.group(1))
    else:
        ac_match = re.search(r'Armor\s*Class\s*(-?\d+)', full_text, re.IGNORECASE)
        if ac_match:
            entity["AC"] = int(ac_match.group(1))
    
    # Extract HP (look for "HP" or "Hit Points" or "Hit Dice")
    hp_match = re.search(r'HP[:\s]*(\d+)', full_text, re.IGNORECASE)
    if hp_match:
        entity["hp"] = int(hp_match.group(1))
        entity["maxHp"] = entity["hp"]
    else:
        hd_match = re.search(r'(\d+)\s*d\d+', full_text)
        if hd_match:
            entity["hp"] = int(hd_match.group(1)) * 8
            entity["maxHp"] = entity["hp"]
    
    # Extract Magic Resistance (MR)
    mr_match = re.search(r'MR[:\s]*(\d+)%?', full_text, re.IGNORECASE)
    if mr_match:
        entity["MR"] = int(mr_match.group(1))
    else:
        mr_match = re.search(r'Magic\s*Resistance[:\s]*(\d+)%?', full_text, re.IGNORECASE)
        if mr_match:
            entity["MR"] = int(mr_match.group(1))
    
    # Extract alignment
    align_patterns = [
        (r'(Lawful\s*Good|Chaotic\s*Good|Neutral\s*Good|Lawful\s*Neutral|True\s*Neutral|Chaotic\s*Neutral|Lawful\s*Evil|Neutral\s*Evil|Chaotic\s*Evil|Neutral)', 'align'),
    ]
    for pattern, field in align_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            entity[field] = match.group(1).title()
            break
    
    # Extract Movement
    move_match = re.search(r'Move[:\s]*([^\n,\.]+)', full_text, re.IGNORECASE)
    if move_match:
        entity["Move"] = move_match.group(1).strip()[:50]
    
    # Extract abilities/powers
    ability_keywords = ['can', 'able to', 'power', 'ability', 'spell', 'cast', 'summon', 'create']
    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in ability_keywords):
            if len(line) > 20 and len(line) < 500:
                entity["abilities"].append(line.strip())
    
    # Limit abilities to most important
    entity["abilities"] = entity["abilities"][:5]
    
    # Determine category based on stats
    if entity["hp"] >= 300 or entity["MR"] >= 90:
        entity["category"] = "greater_gods"
    elif entity["hp"] >= 150 or entity["MR"] >= 50:
        entity["category"] = "lesser_gods"
    elif entity["hp"] >= 100:
        entity["category"] = "demigods"
    else:
        entity["category"] = "heroes"
    
    return entity

def extract_entities_from_page(page):
    """Extract entities from a single page"""
    entities = []
    text = page.extract_text()
    
    if not text or len(text) < 100:
        return entities
    
    lines = text.split('\n')
    lines = [clean_text(l) for l in lines if clean_text(l)]
    
    # Look for stat block patterns
    # DDG stat blocks usually have: NAME, AC, HP, Move, etc.
    
    # Check for deity names (usually ALL CAPS or Title Case at start of blocks)
    current_pantheon = "Unknown"
    
    # Detect pantheon from context
    pantheon_keywords = {
        'greek': ['olympian', 'greek', 'athens', 'sparta', 'zeus', 'hera', 'apollo', 'athena', 'poseidon', 'hades'],
        'norse': ['norse', 'asgard', 'valhalla', 'odin', 'thor', 'loki', 'freya', 'balder', 'tyr'],
        'egyptian': ['egyptian', 'nile', 'ra', 'isis', 'osiris', 'anubis', 'set', 'horus', 'thoth'],
        'celtic': ['celtic', 'druid', 'dagda', 'lugh', 'morrigan', 'brigit'],
        'finnish': ['finnish', 'kalevala', 'vainamoinen', 'ilmarinen', 'ukko'],
        'babylonian': ['babylonian', 'marduk', 'ishtar', 'tiamat'],
        'indian': ['indian', 'vishnu', 'shiva', 'brahma', 'indra', 'kali'],
        'japanese': ['japanese', 'amaterasu', 'susano', 'izanagi'],
        'chinese': ['chinese', 'jade emperor', 'kuan ti'],
        'american': ['american', 'native', 'coyote', 'raven', 'thunderbird'],
        'aztec': ['aztec', 'quetzalcoatl', 'tezcatlipoca', 'huitzilopochtli'],
        'lovecraftian': ['cthulhu', 'nyarlathotep', 'azathoth', 'shub-niggurath', 'mi-go', 'byakhee'],
        'arthurian': ['arthur', 'lancelot', 'gawaine', 'merlin', 'galahad', 'camelot'],
        'melnibonean': ['elric', 'arioch', 'stormbringer', 'melnibone'],
        'nehwon': ['fafhrd', 'gray mouser', 'lankhmar'],
    }
    
    text_lower = text.lower()
    for pantheon, keywords in pantheon_keywords.items():
        if any(kw in text_lower for kw in keywords):
            current_pantheon = pantheon.title()
            break
    
    # Try to extract tables
    tables = page.extract_tables()
    for table in tables:
        if table and len(table) > 1:
            # Tables might contain stat blocks
            for row in table:
                if row and len(row) >= 3:
                    row_text = " ".join([str(c) for c in row if c])
                    if 'AC' in row_text or 'HP' in row_text or 'MR' in row_text:
                        entity = parse_stat_block([row_text], current_pantheon)
                        if entity["name"]:
                            entities.append(entity)
    
    # Try to find individual stat blocks in text
    # Look for patterns like "ZEUS" followed by stats
    stat_pattern = re.compile(
        r'([A-Z][A-Za-z\s]+?)(?:\(|$).*?'
        r'(?:AC|Armor\s*Class)[:\s]*(-?\d+).*?'
        r'(?:HP|Hit\s*Points|Hit\s*Dice)[:\s]*(\d+)',
        re.IGNORECASE | re.DOTALL
    )
    
    for match in stat_pattern.finditer(text):
        name = match.group(1).strip()
        ac = int(match.group(2))
        hp = int(match.group(3))
        
        if name and len(name) > 2 and len(name) < 50:
            entity = {
                "name": name,
                "title": "",
                "pantheon": current_pantheon,
                "align": "Neutral",
                "hp": hp,
                "maxHp": hp,
                "AC": ac,
                "MR": 0,
                "abilities": [],
                "category": "lesser_gods",
                "description": ""
            }
            
            if hp >= 300:
                entity["category"] = "greater_gods"
            elif hp >= 150:
                entity["category"] = "lesser_gods"
            elif hp >= 100:
                entity["category"] = "demigods"
            else:
                entity["category"] = "heroes"
            
            entities.append(entity)
    
    return entities

def main():
    all_entities = {}
    
    for pdf_path in PDF_FILES:
        if not os.path.exists(pdf_path):
            print(f"File not found: {pdf_path}")
            continue
        
        print(f"Processing: {pdf_path}")
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                print(f"  Total pages: {total_pages}")
                
                for i, page in enumerate(pdf.pages):
                    if i % 20 == 0:
                        print(f"  Processing page {i+1}/{total_pages}...")
                    
                    try:
                        entities = extract_entities_from_page(page)
                        for entity in entities:
                            name = entity["name"].lower().replace(" ", "_").replace("'", "")
                            if name and name not in all_entities:
                                all_entities[name] = entity
                    except Exception as e:
                        print(f"    Error on page {i+1}: {e}")
        
        except Exception as e:
            print(f"Error opening {pdf_path}: {e}")
    
    print(f"\nTotal unique entities found: {len(all_entities)}")
    
    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_entities, f, indent=2, ensure_ascii=False)
    
    print(f"Saved to: {OUTPUT_FILE}")
    
    # Print summary by category
    categories = {}
    for entity in all_entities.values():
        cat = entity.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\nEntities by category:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")

if __name__ == "__main__":
    main()
