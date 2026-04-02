import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './public/portraits';

// Ensure directories exist
const categories = ['heroes', 'demigods', 'lesser-gods', 'greater-gods', 'monsters'];
categories.forEach(cat => {
  const dir = path.join(OUTPUT_DIR, cat);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Krynn Heroes to generate
const KRYNN_HEROES = [
  {
    id: 'tanis_half_elven',
    prompt: 'Fantasy portrait of Tanis Half-Elven from Dragonlance, a rugged half-elf warrior with a beard, copper skin, wavy brown hair, melancholic green eyes, wearing leather armor and an elven cloak, fantasy art style, detailed, dramatic lighting, dark background, oil painting style'
  },
  {
    id: 'sturm_brightblade',
    prompt: 'Fantasy portrait of Sturm Brightblade from Dragonlance, a noble knight in gleaming silver plate armor with a thick mustache, wavy brown hair, honorable expression, wearing the rose symbol of Solamnia on his chest, holding a shining sword, classic knight, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'raistlin_majere_hero',
    prompt: 'Fantasy portrait of Raistlin Majere from Dragonlance, a frail mage with golden metallic skin, hourglass-shaped pupils in his haunting eyes, white hair, wearing deep red robes, holding the Staff of Magius, gaunt face, mysterious and sinister expression, coughing, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'caramon_majere',
    prompt: 'Fantasy portrait of Caramon Majere from Dragonlance, a massive muscular warrior with friendly brown eyes, wavy brown hair, warm smile, wearing plate armor, huge muscles, protective stance, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'goldmoon',
    prompt: 'Fantasy portrait of Goldmoon from Dragonlance, a beautiful barbarian princess with flowing silver-gold hair, wearing deerskin ceremonial robes, holding a glowing blue crystal staff, wise and compassionate expression, Native American inspired, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'riverwind',
    prompt: 'Fantasy portrait of Riverwind from Dragonlance, a tall plainsman warrior with weathered bronzed skin, long dark hair in braids, intense dark eyes, wearing leather armor and feathers, holding a longbow, stoic expression, Native American inspired, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'laurana',
    prompt: 'Fantasy portrait of Laurana from Dragonlance, a breathtakingly beautiful elven princess with flowing golden hair, bright green eyes, wearing silver elven chain mail, holding a dragonlance, determined expression, golden general, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'kitiara_uth_matar',
    prompt: 'Fantasy portrait of Kitiara Uth Matar from Dragonlance, a fierce female warrior with short dark curly hair, sharp amber eyes, wicked smile, wearing blue dragon armor, commanding presence, dangerous beauty, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'flint_fireforge',
    prompt: 'Fantasy portrait of Flint Fireforge from Dragonlance, an elderly dwarf with graying brown hair and braided beard, weathered face, wearing dwarven plate armor, holding a battle axe, grumpy but kind expression, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'tasslehoff_burrfoot',
    prompt: 'Fantasy portrait of Tasslehoff Burrfoot from Dragonlance, a young kender with a topknot, bright curious eyes, mischievous grin, wearing colorful pouches and a hoopak staff, innocent and reckless expression, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'tika_waylan',
    prompt: 'Fantasy portrait of Tika Waylan from Dragonlance, a young woman with curly red hair, freckles, bright green eyes, wearing chain mail armor, holding a cast iron skillet, brave determined expression, former barmaid warrior, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'gilthanas',
    prompt: 'Fantasy portrait of Gilthanas from Dragonlance, an elven prince with silver-blonde hair, noble features, haughty expression, wearing fine elven chain, holding an elven bow, conflicted emotions, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'derek_crownguard',
    prompt: 'Fantasy portrait of Derek Crownguard from Dragonlance, a proud Solamnic knight with stern features, short brown hair, cold ambitious eyes, wearing rose-crested plate armor, rigid posture, fantasy art style, detailed, dramatic lighting, oil painting style'
  }
];

// Krynn Demigods
const KRYNN_DEMIGODS = [
  {
    id: 'fizban',
    prompt: 'Fantasy portrait of Fizban the Fabulous from Dragonlance, an elderly wizard with a long white beard, pointed hat, forgetful expression, kind eyes behind spectacles, wearing colorful mismatched robes, holding a walking staff, seemingly doddering but secretly powerful, fantasy art style, detailed, oil painting style'
  },
  {
    id: 'cyan_bloodbane',
    prompt: 'Fantasy portrait of Cyan Bloodbane from Dragonlance, a massive green dragon with intelligent malevolent yellow eyes, emerald scales, poison-green breath, ancient and cunning, coiled in shadows, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'lord_soth',
    prompt: 'Fantasy portrait of Lord Soth from Dragonlance, a terrifying death knight in black armor with a rose emblem, empty eye sockets glowing with unholy orange fire, skeletal face visible through visor, surrounded by ghostly flames, tragic and horrifying, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'huma_dragonbane',
    prompt: 'Fantasy portrait of Huma Dragonbane from Dragonlance, a legendary knight in shining silver armor, noble face, determined eyes, holding the original Dragonlance, riding a silver dragon in background, heroic and selfless, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'fistandantilus',
    prompt: 'Fantasy portrait of Fistandantilus from Dragonlance, an ancient evil archmage with withered features, dark ancient eyes, wearing black robes, holding a bloodstone, aura of dark power and immortality, sinister and calculating, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'raistlin_majere_demigod',
    prompt: 'Fantasy portrait of Raistlin Majere as a demigod from Dragonlance, powerful dark archmage with golden skin, hourglass eyes glowing with power, black robes flowing, aura of dark magic, having absorbed Fistandantilus, terrifying and tragic, fantasy art style, detailed, dramatic lighting, oil painting style'
  }
];

// Krynn Greater Gods
const KRYNN_GREATER_GODS = [
  {
    id: 'takhisis',
    prompt: 'Fantasy portrait of Takhisis the Dark Queen from Dragonlance, a dark goddess with five dragon heads, each a different color, beautiful and terrible, wearing a crown of darkness, seductive and evil, dark goddess of chromatic dragons, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'paladine',
    prompt: 'Fantasy portrait of Paladine the Platinum Dragon from Dragonlance, a radiant good god appearing as a platinum dragon or wise old man, kind noble face, silver-white features, aura of divine goodness, god of good dragons, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'sargonnas',
    prompt: 'Fantasy portrait of Sargonnas the Condor God from Dragonlance, a dark god appearing as a minotaur or giant condor, red eyes, vengeful expression, god of vengeance and minotaurs, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'nuitari',
    prompt: 'Fantasy portrait of Nuitari the Black Moon from Dragonlance, a mysterious god of black magic, dark robes, the unseen moon, surrounded by shadows and forbidden knowledge, evil magic god, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'lunitari',
    prompt: 'Fantasy portrait of Lunitari the Red Moon from Dragonlance, a neutral goddess of red magic, red robes, balanced expression, holding a wand, the red moon in background, neutral magic goddess, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'solinari',
    prompt: 'Fantasy portrait of Solinari the White Moon from Dragonlance, a good god of white magic, white robes, pure expression, surrounded by holy light, the white moon in background, good magic god, fantasy art style, detailed, dramatic lighting, oil painting style'
  }
];

// Krynn Lesser Gods
const KRYNN_LESSER_GODS = [
  {
    id: 'mishakal',
    prompt: 'Fantasy portrait of Mishakal from Dragonlance, goddess of healing, beautiful woman with blue robes, holding a blue crystal staff, motherly compassionate expression, infinite symbol, healing light, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'reorx',
    prompt: 'Fantasy portrait of Reorx from Dragonlance, god of the forge, a powerful dwarf-like smith with hammer and anvil, muscular arms, firelight illuminating his face, creative and stubborn, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'gilean',
    prompt: 'Fantasy portrait of Gilean from Dragonlance, god of neutrality and knowledge, a scholar with a massive book, balanced scales, neutral expression, the Tobril book of all knowledge, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'branchala',
    prompt: 'Fantasy portrait of Branchala the Bard King from Dragonlance, a joyful god with a harp, musical notes floating around him, elven features, bringing joy and life through song, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'chemosh',
    prompt: 'Fantasy portrait of Chemosh from Dragonlance, god of undeath, a skeletal figure in dark robes, skull-like face, offering false immortality, lord of bones, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'zeboim',
    prompt: 'Fantasy portrait of Zeboim from Dragonlance, goddess of the sea and storms, a fierce sea witch with wild dark hair, trident, storm clouds behind her, tempestuous and angry, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'hiddukel',
    prompt: 'Fantasy portrait of Hiddukel from Dragonlance, god of lies and corruption, a suave merchant with a sly smile, holding coins and contracts, every deal is a trap, prince of lies, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'sirrion',
    prompt: 'Fantasy portrait of Sirrion from Dragonlance, god of fire and change, a being of living flame, constantly transforming, passionate and unpredictable, the flowing flame, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'habbakuk',
    prompt: 'Fantasy portrait of Habbakuk from Dragonlance, god of nature and animals, a gentle figure surrounded by forest creatures, fish and birds, the fisher king, nature god, fantasy art style, detailed, dramatic lighting, oil painting style'
  }
];

// Krynn Monsters
const KRYNN_MONSTERS = [
  {
    id: 'khellendros',
    prompt: 'Fantasy portrait of Khellendros Skie from Dragonlance, a massive blue dragon, crackling lightning, storm clouds, intelligent ancient eyes, the storm over Krynn, magnificent and deadly, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'beryllinthranox',
    prompt: 'Fantasy portrait of Beryllinthranox from Dragonlance, a massive green dragon overlord, poison green scales, forest canopy, cruel intelligence, the great green, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'malystryx',
    prompt: 'Fantasy portrait of Malystryx from Dragonlance, a colossal red dragon overlord, volcanic fire, largest dragon on Krynn, burning destruction, the red overlord, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'draconians',
    prompt: 'Fantasy portrait of Draconians from Dragonlance, reptilian humanoid soldiers, scaled skin, wings folded, military formation, corrupted from good dragon eggs, various types, fantasy art style, detailed, dramatic lighting, oil painting style'
  },
  {
    id: 'shadow_wights',
    prompt: 'Fantasy portrait of Shadow Wights from Dragonlance, ghostly knights in tattered armor, shadowy forms, level-draining touch, servants of Lord Soth, undead warriors, fantasy art style, detailed, dramatic lighting, oil painting style'
  }
];

async function generateImage(zai: any, prompt: string, outputPath: string): Promise<boolean> {
  try {
    const response = await zai.images.generations.create({
      prompt: prompt,
      size: '1024x1024'
    });

    const imageBase64 = response.data[0].base64;
    const buffer = Buffer.from(imageBase64, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Failed: ${error}`);
    return false;
  }
}

async function main() {
  console.log('🐉 Generating Krynn (Dragonlance) Portraits...\n');
  
  const zai = await ZAI.create();
  
  let total = 0;
  let success = 0;
  
  // Generate Heroes
  console.log('📊 Generating Heroes...');
  for (const hero of KRYNN_HEROES) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'heroes', `${hero.id}.png`);
    console.log(`  Generating ${hero.id}...`);
    if (await generateImage(zai, hero.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${hero.id}`);
    } else {
      console.log(`  ✗ ${hero.id}`);
    }
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Generate Demigods
  console.log('\n📊 Generating Demigods...');
  for (const demigod of KRYNN_DEMIGODS) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'demigods', `${demigod.id}.png`);
    console.log(`  Generating ${demigod.id}...`);
    if (await generateImage(zai, demigod.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${demigod.id}`);
    } else {
      console.log(`  ✗ ${demigod.id}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Generate Lesser Gods
  console.log('\n📊 Generating Lesser Gods...');
  for (const god of KRYNN_LESSER_GODS) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'lesser-gods', `${god.id}.png`);
    console.log(`  Generating ${god.id}...`);
    if (await generateImage(zai, god.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${god.id}`);
    } else {
      console.log(`  ✗ ${god.id}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Generate Greater Gods
  console.log('\n📊 Generating Greater Gods...');
  for (const god of KRYNN_GREATER_GODS) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'greater-gods', `${god.id}.png`);
    console.log(`  Generating ${god.id}...`);
    if (await generateImage(zai, god.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${god.id}`);
    } else {
      console.log(`  ✗ ${god.id}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Generate Monsters
  console.log('\n📊 Generating Monsters...');
  for (const monster of KRYNN_MONSTERS) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'monsters', `${monster.id}.png`);
    console.log(`  Generating ${monster.id}...`);
    if (await generateImage(zai, monster.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${monster.id}`);
    } else {
      console.log(`  ✗ ${monster.id}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n✨ Complete! Generated ${success}/${total} portraits.`);
}

main().catch(console.error);
