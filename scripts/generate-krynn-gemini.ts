import fs from 'fs';
import path from 'path';
import https from 'https';

const GEMINI_API_KEY = 'AIzaSyCQRG_gNAPLSc26DFIWfoL8H0IMpx1S514';

const OUTPUT_DIR = './public/portraits';

// Ensure directories exist
const categories = ['heroes', 'demigods', 'lesser-gods', 'greater-gods', 'monsters'];
categories.forEach(cat => {
  const dir = path.join(OUTPUT_DIR, cat);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Download image from URL
function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location!, filepath).then(resolve).catch(reject);
        return;
      }
      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

// Generate image using Gemini Imagen API
async function generateImageGemini(prompt: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`;
  
  const body = JSON.stringify({
    instances: [
      {
        prompt: prompt
      }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1'
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.error(`API Error ${res.statusCode}: ${data}`);
            resolve(null);
            return;
          }
          const json = JSON.parse(data);
          // Imagen returns base64 encoded image
          if (json.predictions && json.predictions[0] && json.predictions[0].bytesBase64Encoded) {
            resolve(json.predictions[0].bytesBase64Encoded);
          } else if (json.predictions && json.predictions[0] && json.predictions[0].image) {
            resolve(json.predictions[0].image);
          } else {
            console.error('Unexpected response structure:', JSON.stringify(json, null, 2).slice(0, 500));
            resolve(null);
          }
        } catch (e) {
          console.error('Parse error:', e);
          resolve(null);
        }
      });
    });
    req.on('error', (e) => {
      console.error('Request error:', e);
      resolve(null);
    });
    req.write(body);
    req.end();
  });
}

// Save base64 image to file
function saveBase64Image(base64: string, filepath: string): void {
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(filepath, buffer);
}

// Krynn Heroes
const KRYNN_HEROES = [
  { id: 'tanis_half_elven', prompt: 'Fantasy portrait painting of Tanis Half-Elven from Dragonlance, a rugged half-elf warrior with a beard, copper skin, wavy brown hair, melancholic green eyes, wearing leather armor and an elven cloak, dramatic lighting, dark background, oil painting style, detailed fantasy art' },
  { id: 'sturm_brightblade', prompt: 'Fantasy portrait painting of Sturm Brightblade from Dragonlance, a noble knight in gleaming silver plate armor with a thick mustache, wavy brown hair, honorable expression, wearing the rose symbol of Solamnia on his chest, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'raistlin_majere_hero', prompt: 'Fantasy portrait painting of Raistlin Majere from Dragonlance, a frail mage with golden metallic skin, hourglass-shaped pupils in his haunting eyes, white hair, wearing deep red robes, holding the Staff of Magius, gaunt face, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'caramon_majere', prompt: 'Fantasy portrait painting of Caramon Majere from Dragonlance, a massive muscular warrior with friendly brown eyes, wavy brown hair, warm smile, wearing plate armor, huge muscles, protective stance, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'goldmoon', prompt: 'Fantasy portrait painting of Goldmoon from Dragonlance, a beautiful barbarian princess with flowing silver-gold hair, wearing deerskin ceremonial robes, holding a glowing blue crystal staff, wise compassionate expression, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'riverwind', prompt: 'Fantasy portrait painting of Riverwind from Dragonlance, a tall plainsman warrior with weathered bronzed skin, long dark hair in braids, intense dark eyes, wearing leather armor and feathers, holding a longbow, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'laurana', prompt: 'Fantasy portrait painting of Laurana from Dragonlance, a breathtakingly beautiful elven princess with flowing golden hair, bright green eyes, wearing silver elven chain mail, holding a dragonlance, determined expression, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'kitiara_uth_matar', prompt: 'Fantasy portrait painting of Kitiara Uth Matar from Dragonlance, a fierce female warrior with short dark curly hair, sharp amber eyes, wicked smile, wearing blue dragon armor, commanding presence, dangerous beauty, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'flint_fireforge', prompt: 'Fantasy portrait painting of Flint Fireforge from Dragonlance, an elderly dwarf with graying brown hair and braided beard, weathered face, wearing dwarven plate armor, holding a battle axe, grumpy but kind expression, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'tasslehoff_burrfoot', prompt: 'Fantasy portrait painting of Tasslehoff Burrfoot from Dragonlance, a young kender with a topknot, bright curious eyes, mischievous grin, wearing colorful pouches and a hoopak staff, innocent reckless expression, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'tika_waylan', prompt: 'Fantasy portrait painting of Tika Waylan from Dragonlance, a young woman with curly red hair, freckles, bright green eyes, wearing chain mail armor, holding a cast iron skillet, brave determined expression, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'gilthanas', prompt: 'Fantasy portrait painting of Gilthanas from Dragonlance, an elven prince with silver-blonde hair, noble features, haughty expression, wearing fine elven chain, holding an elven bow, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'derek_crownguard', prompt: 'Fantasy portrait painting of Derek Crownguard from Dragonlance, a proud Solamnic knight with stern features, short brown hair, cold ambitious eyes, wearing rose-crested plate armor, rigid posture, dramatic lighting, oil painting style, detailed fantasy art' }
];

// Krynn Demigods
const KRYNN_DEMIGODS = [
  { id: 'fizban', prompt: 'Fantasy portrait painting of Fizban the Fabulous from Dragonlance, an elderly wizard with a long white beard, pointed hat, forgetful expression, kind eyes, wearing colorful mismatched robes, holding a walking staff, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'cyan_bloodbane', prompt: 'Fantasy portrait painting of Cyan Bloodbane from Dragonlance, a massive green dragon with intelligent malevolent yellow eyes, emerald scales, poison breath, ancient and cunning, coiled in shadows, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'lord_soth', prompt: 'Fantasy portrait painting of Lord Soth from Dragonlance, a terrifying death knight in black armor with a rose emblem, empty eye sockets glowing with unholy orange fire, skeletal face visible through visor, surrounded by ghostly flames, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'huma_dragonbane', prompt: 'Fantasy portrait painting of Huma Dragonbane from Dragonlance, a legendary knight in shining silver armor, noble face, determined eyes, holding the original Dragonlance, heroic selfless, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'fistandantilus', prompt: 'Fantasy portrait painting of Fistandantilus from Dragonlance, an ancient evil archmage with withered features, dark ancient eyes, wearing black robes, holding a bloodstone, aura of dark power, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'raistlin_majere_demigod', prompt: 'Fantasy portrait painting of Raistlin Majere as a demigod from Dragonlance, powerful dark archmage with golden skin, hourglass eyes glowing with power, black robes flowing, aura of dark magic, terrifying and tragic, dramatic lighting, oil painting style, detailed fantasy art' }
];

// Krynn Greater Gods
const KRYNN_GREATER_GODS = [
  { id: 'takhisis', prompt: 'Fantasy portrait painting of Takhisis the Dark Queen from Dragonlance, a dark goddess with five dragon heads silhouetted behind her, beautiful and terrible, wearing a crown of darkness, seductive evil presence, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'paladine', prompt: 'Fantasy portrait painting of Paladine the Platinum Dragon from Dragonlance, a radiant good god appearing as a wise old man with platinum hair and beard, kind noble face, silver-white robes, aura of divine goodness, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'sargonnas', prompt: 'Fantasy portrait painting of Sargonnas the Condor God from Dragonlance, a dark god with minotaur features and giant condor wings, red eyes, vengeful expression, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'nuitari', prompt: 'Fantasy portrait painting of Nuitari the Black Moon from Dragonlance, a mysterious god of black magic, dark robes, the unseen moon behind him, surrounded by shadows and forbidden knowledge, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'lunitari', prompt: 'Fantasy portrait painting of Lunitari the Red Moon from Dragonlance, a neutral goddess of red magic, red robes, balanced expression, holding a wand, the red moon in background, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'solinari', prompt: 'Fantasy portrait painting of Solinari the White Moon from Dragonlance, a good god of white magic, white robes, pure expression, surrounded by holy light, the white moon in background, dramatic lighting, oil painting style, detailed fantasy art' }
];

// Krynn Lesser Gods
const KRYNN_LESSER_GODS = [
  { id: 'mishakal', prompt: 'Fantasy portrait painting of Mishakal from Dragonlance, goddess of healing, beautiful woman with blue robes, holding a blue crystal staff, motherly compassionate expression, healing light, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'reorx', prompt: 'Fantasy portrait painting of Reorx from Dragonlance, god of the forge, a powerful dwarf-like smith with hammer and anvil, muscular arms, firelight illuminating his face, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'gilean', prompt: 'Fantasy portrait painting of Gilean from Dragonlance, god of neutrality and knowledge, a scholar with a massive book, balanced scales, neutral expression, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'branchala', prompt: 'Fantasy portrait painting of Branchala the Bard King from Dragonlance, a joyful god with a harp, musical notes floating around him, elven features, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'chemosh', prompt: 'Fantasy portrait painting of Chemosh from Dragonlance, god of undeath, a skeletal figure in dark robes, skull-like face, offering false immortality, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'zeboim', prompt: 'Fantasy portrait painting of Zeboim from Dragonlance, goddess of the sea and storms, a fierce sea witch with wild dark hair, trident, storm clouds behind her, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'hiddukel', prompt: 'Fantasy portrait painting of Hiddukel from Dragonlance, god of lies and corruption, a suave merchant with a sly smile, holding coins and contracts, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'sirrion', prompt: 'Fantasy portrait painting of Sirrion from Dragonlance, god of fire and change, a being of living flame, constantly transforming, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'habbakuk', prompt: 'Fantasy portrait painting of Habbakuk from Dragonlance, god of nature and animals, a gentle figure surrounded by forest creatures, dramatic lighting, oil painting style, detailed fantasy art' }
];

// Krynn Monsters
const KRYNN_MONSTERS = [
  { id: 'khellendros', prompt: 'Fantasy portrait painting of Khellendros Skie from Dragonlance, a massive blue dragon, crackling lightning, storm clouds, intelligent ancient eyes, magnificent deadly, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'beryllinthranox', prompt: 'Fantasy portrait painting of Beryllinthranox from Dragonlance, a massive green dragon overlord, poison green scales, forest canopy, cruel intelligence, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'malystryx', prompt: 'Fantasy portrait painting of Malystryx from Dragonlance, a colossal red dragon overlord, volcanic fire, largest dragon on Krynn, burning destruction, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'draconians', prompt: 'Fantasy portrait painting of Draconians from Dragonlance, reptilian humanoid soldiers, scaled skin, wings folded, military formation, dramatic lighting, oil painting style, detailed fantasy art' },
  { id: 'shadow_wights', prompt: 'Fantasy portrait painting of Shadow Wights from Dragonlance, ghostly knights in tattered armor, shadowy forms, undead warriors, dramatic lighting, oil painting style, detailed fantasy art' }
];

async function generateImage(prompt: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`    Calling Gemini Imagen API...`);
    const base64 = await generateImageGemini(prompt);
    
    if (!base64) {
      return false;
    }
    
    saveBase64Image(base64, outputPath);
    return true;
  } catch (error: any) {
    console.error(`    Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🐉 Generating Krynn (Dragonlance) Portraits with Gemini Imagen 3...\n');
  
  let total = 0;
  let success = 0;
  
  // Generate Heroes
  console.log('📊 Generating Heroes...');
  for (const hero of KRYNN_HEROES) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'heroes', `${hero.id}.png`);
    console.log(`  Generating ${hero.id}...`);
    if (await generateImage(hero.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${hero.id}`);
    } else {
      console.log(`  ✗ ${hero.id}`);
    }
    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Generate Demigods
  console.log('\n📊 Generating Demigods...');
  for (const demigod of KRYNN_DEMIGODS) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'demigods', `${demigod.id}.png`);
    console.log(`  Generating ${demigod.id}...`);
    if (await generateImage(demigod.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${demigod.id}`);
    } else {
      console.log(`  ✗ ${demigod.id}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Generate Lesser Gods
  console.log('\n📊 Generating Lesser Gods...');
  for (const god of KRYNN_LESSER_GODS) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'lesser-gods', `${god.id}.png`);
    console.log(`  Generating ${god.id}...`);
    if (await generateImage(god.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${god.id}`);
    } else {
      console.log(`  ✗ ${god.id}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Generate Greater Gods
  console.log('\n📊 Generating Greater Gods...');
  for (const god of KRYNN_GREATER_GODS) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'greater-gods', `${god.id}.png`);
    console.log(`  Generating ${god.id}...`);
    if (await generateImage(god.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${god.id}`);
    } else {
      console.log(`  ✗ ${god.id}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Generate Monsters
  console.log('\n📊 Generating Monsters...');
  for (const monster of KRYNN_MONSTERS) {
    total++;
    const outputPath = path.join(OUTPUT_DIR, 'monsters', `${monster.id}.png`);
    console.log(`  Generating ${monster.id}...`);
    if (await generateImage(monster.prompt, outputPath)) {
      success++;
      console.log(`  ✓ ${monster.id}`);
    } else {
      console.log(`  ✗ ${monster.id}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n✨ Complete! Generated ${success}/${total} portraits.`);
}

main().catch(console.error);
