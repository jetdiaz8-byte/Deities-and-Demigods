import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface EntityData {
  id: string;
  name: string;
  pantheon: string;
  type?: string;
  AC: number | string;
  HP: number | string;
  MV?: string;
  attacks?: number;
  damage?: string;
  MR?: string;
  align?: string;
  STR?: number | string;
  INT?: number | string;
  WIS?: number | string;
  DEX?: number | string;
  CON?: number | string;
  CHA?: number | string;
  level?: string;
  abilities?: string[];
  equipment?: string[];
  spells?: string[];
  personality?: string;
  title?: string;
  plane?: string;
  symbol?: string;
  specialAttacks?: string;
  specialDefenses?: string;
}

function getCategory(originalCategory: string, hp: number, mrStr: string): string {
  let mr = 0;
  try {
    mr = parseInt(mrStr) || 0;
  } catch {
    mr = 0;
  }
  
  if (hp >= 300 || mr >= 80) {
    return "greater-gods";  // must match public/portraits/greater-gods/ directory name
  }
  // Normalize underscore → hyphen to match portrait directory names
  return originalCategory.replace(/_/g, '-');
}

async function main() {
  console.log('Starting seed...');
  
  const data = JSON.parse(fs.readFileSync('/home/z/my-project/master_database.json', 'utf-8'));
  
  // Clear existing data
  await prisma.entity.deleteMany({});
  console.log('Cleared existing entities');
  
  let count = 0;
  const categories = ['heroes', 'demigods', 'lesser_gods', 'greater_gods', 'monsters'];
  
  for (const originalCategory of categories) {
    if (!data[originalCategory]) continue;
    
    for (const [entityId, entity] of Object.entries(data[originalCategory] as Record<string, EntityData>)) {
      const hp = typeof entity.HP === 'string' ? parseInt(entity.HP) || 100 : entity.HP || 100;
      const ac = typeof entity.AC === 'string' ? parseInt(entity.AC) || 10 : entity.AC || 10;
      const mrStr = entity.MR || '';
      const category = getCategory(originalCategory, hp, mrStr);
      
      await prisma.entity.create({
        data: {
          id: entityId,
          name: entity.name || entityId,
          title: entity.title || null,
          pantheon: entity.pantheon || 'Unknown',
          category: category,
          type: entity.type || null,
          hp: hp,
          maxHp: hp,
          AC: ac,
          MR: mrStr ? String(mrStr) : null,
          move: entity.MV || null,
          attacks: entity.attacks || null,
          damage: entity.damage || null,
          specialAttacks: entity.specialAttacks || null,
          specialDefenses: entity.specialDefenses || null,
          str: entity.STR ? String(entity.STR) : null,
          int: entity.INT ? String(entity.INT) : null,
          wis: entity.WIS ? String(entity.WIS) : null,
          dex: entity.DEX ? String(entity.DEX) : null,
          con: entity.CON ? String(entity.CON) : null,
          cha: entity.CHA ? String(entity.CHA) : null,
          level: entity.level || null,
          align: entity.align || 'Neutral',
          plane: entity.plane || null,
          symbol: entity.symbol || null,
          abilities: entity.abilities ? JSON.stringify(entity.abilities) : null,
          equipment: entity.equipment ? JSON.stringify(entity.equipment) : null,
          spells: entity.spells ? JSON.stringify(entity.spells) : null,
          personality: entity.personality || null,
          conditions: '',
          dead: false,
        }
      });
      count++;
      
      if (count % 20 === 0) {
        console.log(`Seeded ${count} entities...`);
      }
    }
  }
  
  console.log(`✅ Successfully seeded ${count} entities!`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
