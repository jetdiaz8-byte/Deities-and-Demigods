#!/usr/bin/env python3
"""
Seed the DDG Entities database from the JSON file using proper Prisma-compatible schema.
"""

import json
import sqlite3
import os
from datetime import datetime, timezone

# Paths
DB_PATH = "/home/z/my-project/db/custom.db"
JSON_PATH = "/home/z/my-project/ddg_database.json"

def get_category(entity, original_category, hp, mr_str):
    """Determine the proper category based on stats"""
    mr = 0
    try:
        mr = int(mr_str) if mr_str and mr_str not in ['Std', 'Immune', 'Nil'] else 0
    except:
        pass
    
    if hp >= 300 or mr >= 80:
        return "greater_gods"
    return original_category

def seed_database():
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Drop and recreate tables
    cursor.execute('DROP TABLE IF EXISTS Entity')
    cursor.execute('DROP TABLE IF EXISTS GameSave')
    
    # Create Entity table matching Prisma schema EXACTLY
    cursor.execute('''
        CREATE TABLE Entity (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            title TEXT,
            pantheon TEXT NOT NULL,
            category TEXT NOT NULL,
            type TEXT,
            hp INTEGER NOT NULL,
            maxHp INTEGER NOT NULL,
            AC INTEGER NOT NULL,
            MR TEXT,
            move TEXT,
            attacks INTEGER,
            damage TEXT,
            specialAttacks TEXT,
            specialDefenses TEXT,
            str TEXT,
            int TEXT,
            wis TEXT,
            dex TEXT,
            con TEXT,
            cha TEXT,
            level TEXT,
            clericLevel INTEGER,
            fighterLevel INTEGER,
            magicUserLevel INTEGER,
            thiefLevel INTEGER,
            druidLevel INTEGER,
            monkLevel INTEGER,
            align TEXT NOT NULL,
            plane TEXT,
            symbol TEXT,
            worshiperAlign TEXT,
            psionic TEXT,
            abilities TEXT,
            equipment TEXT,
            spells TEXT,
            personality TEXT,
            description TEXT,
            conditions TEXT DEFAULT '',
            dead INTEGER DEFAULT 0,
            inventory TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE GameSave (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            turn INTEGER DEFAULT 0,
            act TEXT DEFAULT 'act1',
            gameState TEXT,
            partyNames TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    count = 0
    for original_category in ['heroes', 'demigods', 'lesser_gods', 'monsters']:
        if original_category not in data:
            continue
        
        for entity_id, entity in data[original_category].items():
            hp = entity.get('HP', 100)
            if isinstance(hp, str):
                try:
                    hp = int(hp)
                except:
                    hp = 100
            
            ac = entity.get('AC', 10)
            if isinstance(ac, str):
                try:
                    ac = int(ac)
                except:
                    ac = 10
            
            mr_str = str(entity.get('MR', ''))
            category = get_category(entity, original_category, hp, mr_str)
            
            abilities = json.dumps(entity.get('abilities', []))
            equipment = json.dumps(entity.get('equipment', []))
            spells = json.dumps(entity.get('spells', []))
            
            now = datetime.now(timezone.utc).isoformat()
            
            cursor.execute('''
                INSERT INTO Entity (
                    id, name, title, pantheon, category, type,
                    hp, maxHp, AC, MR, move,
                    attacks, damage, specialAttacks, specialDefenses,
                    str, int, wis, dex, con, cha,
                    level, clericLevel, fighterLevel, magicUserLevel,
                    thiefLevel, druidLevel, monkLevel,
                    align, plane, symbol, worshiperAlign, psionic,
                    abilities, equipment, spells, personality, description,
                    conditions, dead, inventory, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                entity_id,
                entity.get('name', entity_id),
                entity.get('title', ''),
                entity.get('pantheon', 'Unknown'),
                category,
                entity.get('type', ''),
                hp,
                hp,
                ac,
                mr_str,
                entity.get('MV', ''),
                entity.get('attacks', 1) if isinstance(entity.get('attacks'), int) else 1,
                entity.get('damage', ''),
                entity.get('specialAttacks', ''),
                entity.get('specialDefenses', ''),
                str(entity.get('STR', '')) if entity.get('STR') else None,
                str(entity.get('INT', '')) if entity.get('INT') else None,
                str(entity.get('WIS', '')) if entity.get('WIS') else None,
                str(entity.get('DEX', '')) if entity.get('DEX') else None,
                str(entity.get('CON', '')) if entity.get('CON') else None,
                str(entity.get('CHA', '')) if entity.get('CHA') else None,
                entity.get('level', ''),
                entity.get('clericLevel'),
                entity.get('fighterLevel'),
                entity.get('magicUserLevel'),
                entity.get('thiefLevel'),
                entity.get('druidLevel'),
                entity.get('monkLevel'),
                entity.get('align', 'Neutral'),
                entity.get('plane', ''),
                entity.get('symbol', ''),
                entity.get('worshiperAlign', ''),
                entity.get('psionic', ''),
                abilities,
                equipment,
                spells,
                entity.get('personality', ''),
                entity.get('description', ''),
                '',
                0,
                None,
                now,
                now
            ))
            count += 1
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_entity_category ON Entity(category)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_entity_pantheon ON Entity(pantheon)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_entity_name ON Entity(name)')
    
    conn.commit()
    conn.close()
    
    print(f"Seeded {count} entities to {DB_PATH}")

if __name__ == "__main__":
    seed_database()
