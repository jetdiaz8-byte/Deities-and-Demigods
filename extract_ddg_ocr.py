#!/usr/bin/env python3
"""
Extract Deities & Demigods entity data from scanned PDF files using OCR.
This script processes the TSR Deities & Demigods (1980) PDFs and extracts
all entity statistics into a structured JSON format.
"""

import subprocess
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

# Temp directory for images
TEMP_DIR = "/home/z/my-project/ddg_images"

# Known pantheon markers
PANTHEON_MARKERS = {
    'GREEK MYTHOS': 'Greek',
    'NORSE MYTHOS': 'Norse',
    'EGYPTIAN MYTHOS': 'Egyptian',
    'CELTIC MYTHOS': 'Celtic',
    'FINNISH MYTHOS': 'Finnish',
    'BABYLONIAN MYTHOS': 'Babylonian',
    'INDIAN MYTHOS': 'Indian',
    'JAPANESE MYTHOS': 'Japanese',
    'CHINESE MYTHOS': 'Chinese',
    'AMERICAN INDIAN MYTHOS': 'American Indian',
    'AZTEC MYTHOS': 'Aztec',
    'MAYAN MYTHOS': 'Mayan',
    'LOVECRAFTIAN': 'Cthulhu',
    'NONHUMAN DEITIES': 'Nonhuman',
    'ARTHURIAN HEROES': 'Arthurian',
    'MELNIBONEAN': 'Melnibonean',
    'NEHWON': 'Nehwon',
    "FIAHDLING'S REALM": 'Fiahdling',
}

# Entity type markers
ENTITY_TYPES = [
    'Greater god',
    'Lesser god', 
    'Intermediate god',
    'Demigod',
    'Hero-deity',
    'Hero',
    'Deity',
    'Monster',
    'Demipower',
]

def ensure_dir():
    """Ensure temp directory exists"""
    os.makedirs(TEMP_DIR, exist_ok=True)

def pdf_to_images(pdf_path, start_page, end_page):
    """Convert PDF pages to images"""
    output_prefix = os.path.join(TEMP_DIR, "page")
    cmd = [
        "pdftoppm", "-png", "-r", "300",
        "-f", str(start_page),
        "-l", str(end_page),
        pdf_path, output_prefix
    ]
    subprocess.run(cmd, capture_output=True)
    
    # Return list of generated images
    images = []
    for i in range(start_page, end_page + 1):
        img_path = f"{output_prefix}-{i:03d}.png"
        if os.path.exists(img_path):
            images.append(img_path)
    return images

def ocr_image(image_path):
    """Run tesseract OCR on an image"""
    try:
        result = subprocess.run(
            ["tesseract", image_path, "stdout"],
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.stdout
    except Exception as e:
        print(f"OCR error on {image_path}: {e}")
        return ""

def parse_stat_block(text, current_pantheon="Unknown"):
    """Parse a stat block from OCR'd text"""
    lines = text.split('\n')
    lines = [l.strip() for l in lines if l.strip()]
    
    if not lines:
        return None
    
    entity = {
        "id": "",
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
        "entity_type": "",
        "attacks": "",
        "damage": "",
        "special_attacks": "",
        "special_defenses": "",
        "size": "",
        "symbol": "",
        "plane": "",
        "worshiper_align": "",
        "str": 18,
        "int": 18,
        "wis": 18,
        "dex": 18,
        "con": 18,
        "cha": 18,
        "cleric_level": 0,
        "fighter_level": 0,
        "magic_user_level": 0,
        "thief_level": 0,
        "monk_level": 0,
        "druid_level": 0,
        "psionic": "",
        "description": "",
        "raw_text": text[:2000]
    }
    
    full_text = text
    
    # Extract name - usually first line or before entity type
    for i, line in enumerate(lines[:10]):
        # Check if this line is an entity type (skip it)
        is_type = any(et.lower() in line.lower() for et in ENTITY_TYPES)
        if is_type:
            entity["entity_type"] = line.strip()
            # Name should be the previous line or in parens
            if i > 0:
                name_line = lines[i-1]
                # Extract name and title
                match = re.match(r'^([A-Z][A-Za-z\s\']+?)(?:\s*\((.+?)\))?', name_line)
                if match:
                    entity["name"] = match.group(1).strip()
                    entity["title"] = match.group(2) or ""
            break
    
    # If no name found yet, try first line
    if not entity["name"] and lines:
        first_line = lines[0]
        # Skip if it's a pantheon header
        if not any(m.lower() in first_line.lower() for m in PANTHEON_MARKERS.keys()):
            match = re.match(r'^([A-Z][A-Za-z\s\']+?)(?:\s*\((.+?)\))?', first_line)
            if match:
                entity["name"] = match.group(1).strip()
                entity["title"] = match.group(2) or ""
    
    # Extract ARMOR CLASS
    ac_match = re.search(r'ARMOR\s*CLASS[:\s]*(-?\d+)', full_text, re.IGNORECASE)
    if ac_match:
        entity["AC"] = int(ac_match.group(1))
    
    # Extract HIT POINTS
    hp_match = re.search(r'HIT\s*POINTS[:\s]*(\d+)', full_text, re.IGNORECASE)
    if hp_match:
        entity["hp"] = int(hp_match.group(1))
        entity["maxHp"] = entity["hp"]
    
    # Extract MAGIC RESISTANCE
    mr_match = re.search(r'MAGIC\s*RESISTANCE[:\s]*(\d+)%?', full_text, re.IGNORECASE)
    if mr_match:
        entity["MR"] = int(mr_match.group(1))
    
    # Extract MOVE
    move_match = re.search(r'MOVE[:\s]*([^\n]+?)(?=\n[A-Z]|$)', full_text, re.IGNORECASE)
    if move_match:
        entity["Move"] = move_match.group(1).strip()[:50]
    
    # Extract ALIGNMENT
    align_patterns = [
        'Lawful Good', 'Chaotic Good', 'Neutral Good',
        'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Neutral',
        'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
    ]
    for align in align_patterns:
        if align.lower() in full_text.lower():
            entity["align"] = align
            break
    
    # Extract WORSHIPER'S ALIGN
    worship_match = re.search(r"WORSHIPER'?S?\s*ALIGN[:\s]*([^\n]+)", full_text, re.IGNORECASE)
    if worship_match:
        entity["worshiper_align"] = worship_match.group(1).strip()
    
    # Extract SIZE
    size_match = re.search(r'SIZE[:\s]*([SLMG]\s*\([^)]+\)|[SLMG])', full_text, re.IGNORECASE)
    if size_match:
        entity["size"] = size_match.group(1).strip()
    
    # Extract SYMBOL
    symbol_match = re.search(r'SYMBOL[:\s]*([^\n]+)', full_text, re.IGNORECASE)
    if symbol_match:
        entity["symbol"] = symbol_match.group(1).strip()
    
    # Extract PLANE
    plane_match = re.search(r'PLANE[:\s]*([^\n]+)', full_text, re.IGNORECASE)
    if plane_match:
        entity["plane"] = plane_match.group(1).strip()
    
    # Extract NO. OF ATTACKS
    attacks_match = re.search(r'NO\.?\s*OF\s*ATTACKS[:\s]*(\d+)', full_text, re.IGNORECASE)
    if attacks_match:
        entity["attacks"] = attacks_match.group(1)
    
    # Extract DAMAGE/ATTACK
    damage_match = re.search(r'DAMAGE/ATTACK[:\s]*([^\n]+)', full_text, re.IGNORECASE)
    if damage_match:
        entity["damage"] = damage_match.group(1).strip()
    
    # Extract SPECIAL ATTACKS
    special_att_match = re.search(r'SPECIAL\s*ATTACKS[:\s]*([^\n]+)', full_text, re.IGNORECASE)
    if special_att_match:
        entity["special_attacks"] = special_att_match.group(1).strip()
    
    # Extract SPECIAL DEFENSES
    special_def_match = re.search(r'SPECIAL\s*DEFENSES[:\s]*([^\n]+)', full_text, re.IGNORECASE)
    if special_def_match:
        entity["special_defenses"] = special_def_match.group(1).strip()
    
    # Extract stats (S I W D C CH format)
    stats_match = re.search(r'[SDWC]H?[:\s]*(\d+)', full_text)
    if stats_match:
        # Try the standard format: S:xx I:xx W:xx D:xx C:xx CH:xx
        stat_pattern = r'S[:\s]*(\d+).*?I[:\s]*(\d+).*?W[:\s]*(\d+).*?D[:\s]*(\d+).*?C[:\s]*(\d+).*?CH[:\s]*(\d+)'
        stat_match = re.search(stat_pattern, full_text, re.IGNORECASE)
        if stat_match:
            entity["str"] = int(stat_match.group(1))
            entity["int"] = int(stat_match.group(2))
            entity["wis"] = int(stat_match.group(3))
            entity["dex"] = int(stat_match.group(4))
            entity["con"] = int(stat_match.group(5))
            entity["cha"] = int(stat_match.group(6))
    
    # Extract class levels
    cleric_match = re.search(r'CLERIC/DRUID[:\s]*(\d+)', full_text, re.IGNORECASE)
    if cleric_match:
        entity["cleric_level"] = int(cleric_match.group(1))
    
    fighter_match = re.search(r'FIGHTER[:\s]*(\d+)', full_text, re.IGNORECASE)
    if fighter_match:
        entity["fighter_level"] = int(fighter_match.group(1))
    
    mu_match = re.search(r'MAGIC-USER/ILLUSIONIST[:\s]*(\d+)', full_text, re.IGNORECASE)
    if mu_match:
        entity["magic_user_level"] = int(mu_match.group(1))
    
    thief_match = re.search(r'THIEF/ASSASSIN[:\s]*(\d+)', full_text, re.IGNORECASE)
    if thief_match:
        entity["thief_level"] = int(thief_match.group(1))
    
    monk_match = re.search(r'MONK/BARD[:\s]*(\d+)', full_text, re.IGNORECASE)
    if monk_match:
        entity["monk_level"] = int(monk_match.group(1))
    
    # Extract PSIONIC
    psionic_match = re.search(r'PSIONIC\s*ABILITY[:\s]*([^\n]+)', full_text, re.IGNORECASE)
    if psionic_match:
        entity["psionic"] = psionic_match.group(1).strip()
    
    # Extract description (text after stats)
    # Usually starts with the entity's name or appears after all the stat lines
    desc_lines = []
    in_desc = False
    for line in lines:
        # Skip stat lines
        if any(keyword in line.upper() for keyword in 
               ['ARMOR CLASS', 'MOVE:', 'HIT POINTS', 'NO. OF ATTACKS', 
                'DAMAGE/ATTACK', 'SPECIAL ATTACKS', 'SPECIAL DEFENSES',
                'MAGIC RESISTANCE', 'SIZE:', 'ALIGNMENT', 'WORSHIPER',
                'SYMBOL:', 'PLANE:', 'CLERIC/', 'FIGHTER:', 'MAGIC-USER',
                'THIEF/', 'MONK/', 'PSIONIC', 'GREATER GOD', 'LESSER GOD',
                'DEMICGOD', 'HERO', 'DEITY']):
            continue
        # Description usually starts with entity name or after stats
        if entity["name"] and entity["name"].lower() in line.lower():
            in_desc = True
        if in_desc and len(line) > 30:
            desc_lines.append(line)
    
    if desc_lines:
        entity["description"] = " ".join(desc_lines[:5])  # Limit description
    
    # Determine category based on entity type and stats
    entity_type_lower = entity["entity_type"].lower()
    if 'greater' in entity_type_lower:
        entity["category"] = "greater_gods"
    elif 'lesser' in entity_type_lower or 'intermediate' in entity_type_lower:
        entity["category"] = "lesser_gods"
    elif 'demi' in entity_type_lower:
        entity["category"] = "demigods"
    elif 'hero' in entity_type_lower:
        entity["category"] = "heroes"
    elif entity["hp"] >= 300 or entity["MR"] >= 90:
        entity["category"] = "greater_gods"
    elif entity["hp"] >= 150 or entity["MR"] >= 50:
        entity["category"] = "lesser_gods"
    elif entity["hp"] >= 100:
        entity["category"] = "demigods"
    else:
        entity["category"] = "heroes"
    
    # Generate ID
    if entity["name"]:
        entity["id"] = entity["name"].lower().replace(" ", "_").replace("'", "").replace("-", "_")
        # Clean up ID
        entity["id"] = re.sub(r'[^a-z0-9_]', '', entity["id"])
    
    # Only return if we have a valid name
    if entity["name"] and len(entity["name"]) > 2:
        return entity
    return None

def split_text_into_blocks(text):
    """Split OCR text into individual entity stat blocks"""
    blocks = []
    current_block = []
    current_pantheon = "Unknown"
    
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check for pantheon headers
        for marker, pantheon in PANTHEON_MARKERS.items():
            if marker.lower() in line.lower():
                current_pantheon = pantheon
                # Save current block if any
                if current_block:
                    blocks.append(('\n'.join(current_block), current_pantheon))
                    current_block = []
                break
        
        # Check for new entity (name followed by entity type)
        is_new_entity = False
        for et in ENTITY_TYPES:
            if et.lower() in line.lower():
                is_new_entity = True
                break
        
        if is_new_entity and current_block:
            # Check if previous line is a name (mostly caps, short)
            if current_block and len(current_block[-1]) < 50:
                # Save previous block
                blocks.append(('\n'.join(current_block), current_pantheon))
                current_block = []
        
        current_block.append(line)
    
    # Don't forget the last block
    if current_block:
        blocks.append(('\n'.join(current_block), current_pantheon))
    
    return blocks

def get_total_pages(pdf_path):
    """Get total pages in a PDF"""
    result = subprocess.run(
        ["pdfinfo", pdf_path],
        capture_output=True,
        text=True
    )
    for line in result.stdout.split('\n'):
        if 'Pages:' in line:
            return int(line.split(':')[1].strip())
    return 0

def main():
    ensure_dir()
    all_entities = {}
    
    for pdf_path in PDF_FILES:
        if not os.path.exists(pdf_path):
            print(f"File not found: {pdf_path}")
            continue
        
        total_pages = get_total_pages(pdf_path)
        print(f"\nProcessing: {pdf_path}")
        print(f"Total pages: {total_pages}")
        
        # Process in batches of 5 pages to manage memory
        batch_size = 5
        for start in range(1, total_pages + 1, batch_size):
            end = min(start + batch_size - 1, total_pages)
            print(f"  Pages {start}-{end}...")
            
            # Convert pages to images
            images = pdf_to_images(pdf_path, start, end)
            
            # OCR each image
            for img_path in images:
                text = ocr_image(img_path)
                
                if not text or len(text) < 100:
                    continue
                
                # Split into stat blocks and parse
                blocks = split_text_into_blocks(text)
                
                for block_text, pantheon in blocks:
                    entity = parse_stat_block(block_text, pantheon)
                    
                    if entity and entity["id"]:
                        if entity["id"] not in all_entities:
                            all_entities[entity["id"]] = entity
                        else:
                            # Merge data if entity exists
                            existing = all_entities[entity["id"]]
                            # Update with more complete data
                            for key, value in entity.items():
                                if value and not existing.get(key):
                                    existing[key] = value
                
                # Clean up image file
                try:
                    os.remove(img_path)
                except:
                    pass
    
    print(f"\n\nTotal unique entities found: {len(all_entities)}")
    
    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_entities, f, indent=2, ensure_ascii=False)
    
    print(f"Saved to: {OUTPUT_FILE}")
    
    # Print summary by category
    categories = {}
    pantheons = {}
    for entity in all_entities.values():
        cat = entity.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
        pan = entity.get("pantheon", "Unknown")
        pantheons[pan] = pantheons.get(pan, 0) + 1
    
    print("\nEntities by category:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")
    
    print("\nEntities by pantheon:")
    for pan, count in sorted(pantheons.items()):
        print(f"  {pan}: {count}")
    
    # Print sample entities
    print("\nSample entities:")
    for i, (eid, entity) in enumerate(list(all_entities.items())[:5]):
        print(f"\n  {entity['name']} ({entity.get('title', '')})")
        print(f"    HP: {entity['hp']}, AC: {entity['AC']}, MR: {entity['MR']}%")
        print(f"    Category: {entity['category']}, Pantheon: {entity['pantheon']}")

if __name__ == "__main__":
    main()
