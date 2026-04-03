import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_AV4oKuzSTs5r@ep-frosty-forest-amxt6k73-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

function sep(title) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

// ============================================================
// 1. TOTAL COUNTS
// ============================================================
sep('1. TOTAL COUNTS — Entities per Pantheon & per Category');

const pantheonCounts = await prisma.$queryRaw`
  SELECT pantheon, COUNT(*)::int AS count FROM "Entity" GROUP BY pantheon ORDER BY count DESC
`;
console.log('\n--- By Pantheon ---');
pantheonCounts.forEach(r => console.log(`  ${r.pantheon.padEnd(25)} ${r.count}`));

const categoryCounts = await prisma.$queryRaw`
  SELECT category, COUNT(*)::int AS count FROM "Entity" GROUP BY category ORDER BY count DESC
`;
console.log('\n--- By Category ---');
categoryCounts.forEach(r => console.log(`  ${r.category.padEnd(25)} ${r.count}`));

const total = await prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM "Entity"`;
console.log(`\n  TOTAL ENTITIES: ${total[0].total}`);

// ============================================================
// 2. DUPLICATE IDs
// ============================================================
sep('2. DUPLICATE IDs');
const dupes = await prisma.$queryRaw`
  SELECT id, COUNT(*)::int AS cnt FROM "Entity" GROUP BY id HAVING COUNT(*) > 1
`;
if (dupes.length === 0) {
  console.log('  ✅ No duplicate IDs found.');
} else {
  console.log('  ❌ DUPLICATES FOUND:');
  dupes.forEach(r => console.log(`    id="${r.id}" appears ${r.cnt} times`));
}

// ============================================================
// 3. NULL CHECKS — critical fields
// ============================================================
sep('3. NULL CHECKS — Critical Fields');
const nullChecks = await prisma.$queryRaw`
  SELECT
    COUNT(*) FILTER (WHERE "name" IS NULL)::int      AS null_name,
    COUNT(*) FILTER (WHERE pantheon IS NULL)::int     AS null_pantheon,
    COUNT(*) FILTER (WHERE category IS NULL)::int     AS null_category,
    COUNT(*) FILTER (WHERE align IS NULL)::int        AS null_align,
    COUNT(*) FILTER (WHERE hp IS NULL)::int           AS null_hp,
    COUNT(*) FILTER (WHERE "AC" IS NULL)::int         AS null_AC
  FROM "Entity"
`;
const nc = nullChecks[0];
console.log(`  null name:     ${nc.null_name}`);
console.log(`  null pantheon: ${nc.null_pantheon}`);
console.log(`  null category: ${nc.null_category}`);
console.log(`  null align:    ${nc.null_align}`);
console.log(`  null hp:       ${nc.null_hp}`);
console.log(`  null AC:       ${nc.null_AC}`);

// Also check empty strings
const emptyChecks = await prisma.$queryRaw`
  SELECT
    COUNT(*) FILTER (WHERE "name" = '')::int      AS empty_name,
    COUNT(*) FILTER (WHERE pantheon = '')::int     AS empty_pantheon,
    COUNT(*) FILTER (WHERE category = '')::int     AS empty_category,
    COUNT(*) FILTER (WHERE align = '')::int        AS empty_align
  FROM "Entity"
`;
const ec = emptyChecks[0];
console.log(`\n  empty name:     ${ec.empty_name}`);
console.log(`  empty pantheon: ${ec.empty_pantheon}`);
console.log(`  empty category: ${ec.empty_category}`);
console.log(`  empty align:    ${ec.empty_align}`);

if (ec.empty_name > 0) {
  const emptyNameRows = await prisma.$queryRaw`SELECT id FROM "Entity" WHERE "name" = ''`;
  console.log(`    → IDs with empty name: ${emptyNameRows.map(r => r.id).join(', ')}`);
}
if (ec.empty_pantheon > 0) {
  const emptyPanRows = await prisma.$queryRaw`SELECT id FROM "Entity" WHERE pantheon = ''`;
  console.log(`    → IDs with empty pantheon: ${emptyPanRows.map(r => r.id).join(', ')}`);
}

// ============================================================
// 4. ABILITY SCORES — missing
// ============================================================
sep('4. ABILITY SCORES — Missing');
const abilityStats = await prisma.$queryRaw`
  SELECT
    COUNT(*) FILTER (WHERE str IS NULL)::int  AS null_str,
    COUNT(*) FILTER (WHERE dex IS NULL)::int  AS null_dex,
    COUNT(*) FILTER (WHERE con IS NULL)::int  AS null_con,
    COUNT(*) FILTER (WHERE "int" IS NULL)::int AS null_int,
    COUNT(*) FILTER (WHERE wis IS NULL)::int  AS null_wis,
    COUNT(*) FILTER (WHERE cha IS NULL)::int  AS null_cha
  FROM "Entity"
`;
const as_ = abilityStats[0];
console.log(`  null str: ${as_.null_str}`);
console.log(`  null dex: ${as_.null_dex}`);
console.log(`  null con: ${as_.null_con}`);
console.log(`  null int: ${as_.null_int}`);
console.log(`  null wis: ${as_.null_wis}`);
console.log(`  null cha: ${as_.null_cha}`);

const allMissing = await prisma.$queryRaw`
  SELECT id, "name" FROM "Entity"
  WHERE str IS NULL AND dex IS NULL AND con IS NULL AND "int" IS NULL AND wis IS NULL AND cha IS NULL
`;
console.log(`\n  Entities missing ALL 6 ability scores: ${allMissing.length}`);

const anyMissing = await prisma.$queryRaw`
  SELECT id, "name",
    CASE WHEN str IS NULL THEN 'str' END AS missing_str,
    CASE WHEN dex IS NULL THEN 'dex' END AS missing_dex,
    CASE WHEN con IS NULL THEN 'con' END AS missing_con,
    CASE WHEN "int" IS NULL THEN 'int' END AS missing_int,
    CASE WHEN wis IS NULL THEN 'wis' END AS missing_wis,
    CASE WHEN cha IS NULL THEN 'cha' END AS missing_cha
  FROM "Entity"
  WHERE str IS NULL OR dex IS NULL OR con IS NULL OR "int" IS NULL OR wis IS NULL OR cha IS NULL
`;
console.log(`  Entities missing ANY ability score: ${anyMissing.length}`);
if (anyMissing.length > 0 && anyMissing.length <= 50) {
  anyMissing.forEach(r => {
    const missing = ['str','dex','con','int','wis','cha'].filter(k => r[`missing_${k}`]);
    console.log(`    ${r.name.padEnd(30)} (id: ${r.id}) missing: ${missing.join(', ')}`);
  });
} else if (anyMissing.length > 50) {
  console.log('    (too many to list individually — showing first 20)');
  anyMissing.slice(0, 20).forEach(r => {
    const missing = ['str','dex','con','int','wis','cha'].filter(k => r[`missing_${k}`]);
    console.log(`    ${r.name.padEnd(30)} (id: ${r.id}) missing: ${missing.join(', ')}`);
  });
}

// ============================================================
// 5. PORTRAIT COVERAGE
// ============================================================
sep('5. PORTRAIT COVERAGE');
const portraitBase = '/home/z/my-project/public/portraits';
const portraitDirs = fs.readdirSync(portraitBase).filter(f => {
  return fs.statSync(path.join(portraitBase, f)).isDirectory();
});
console.log(`  Portrait directories found: ${portraitDirs.join(', ')}`);

// Get all entities
const entities = await prisma.$queryRaw`SELECT id, category, "name" FROM "Entity" ORDER BY category, id`;

// Build a set of available portraits keyed by "category/id.png"
const availablePortraits = new Set();
for (const dir of portraitDirs) {
  const dirPath = path.join(portraitBase, dir);
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.endsWith('.png')) {
      availablePortraits.add(`${dir}/${file}`);
    }
  }
}

// Map DB category to directory name
// DB uses underscores (greater_gods), dirs use hyphens (greater-gods)
function categoryToDir(cat) {
  return cat.replace(/_/g, '-');
}

const missingPortraits = [];
const foundPortraits = [];

for (const e of entities) {
  const dir = categoryToDir(e.category);
  const portraitPath = `${dir}/${e.id}.png`;
  if (availablePortraits.has(portraitPath)) {
    foundPortraits.push(e);
  } else {
    // Check if the directory even exists
    const dirExists = portraitDirs.includes(dir);
    missingPortraits.push({ ...e, dir, dirExists, portraitPath });
  }
}

console.log(`\n  Total entities:      ${entities.length}`);
console.log(`  With portrait:       ${foundPortraits.length}`);
console.log(`  Missing portrait:    ${missingPortraits.length}`);

if (missingPortraits.length > 0) {
  console.log(`\n  Entities MISSING portraits:`);
  missingPortraits.forEach(m => {
    const dirFlag = m.dirExists ? '' : ' [DIR MISSING]';
    console.log(`    ${m.name.padEnd(30)} cat=${m.category.padEnd(20)} expected: ${m.portraitPath}${dirFlag}`);
  });
}

// ============================================================
// 6. DATA ANOMALIES
// ============================================================
sep('6. DATA ANOMALIES');

// HP = 0 or negative
const badHp = await prisma.$queryRaw`
  SELECT id, "name", hp, "maxHp" FROM "Entity" WHERE hp <= 0
`;
console.log(`\n  HP ≤ 0: ${badHp.length}`);
badHp.forEach(r => console.log(`    ${r.name.padEnd(30)} hp=${r.hp} maxHp=${r.maxHp}`));

// HP != maxHp
const hpMismatch = await prisma.$queryRaw`
  SELECT id, "name", hp, "maxHp" FROM "Entity" WHERE hp != "maxHp"
`;
console.log(`\n  HP ≠ maxHp (mismatch): ${hpMismatch.length}`);
hpMismatch.forEach(r => console.log(`    ${r.name.padEnd(30)} hp=${r.hp} maxHp=${r.maxHp}`));

// AC > 99 or < -20
const badAc = await prisma.$queryRaw`
  SELECT id, "name", "AC" FROM "Entity" WHERE "AC" > 99 OR "AC" < -20
`;
console.log(`\n  AC > 99 or AC < -20: ${badAc.length}`);
badAc.forEach(r => console.log(`    ${r.name.padEnd(30)} AC=${r.AC}`));

// Ability scores that aren't numeric (contain non-digit/non-paren/% chars)
const badScores = await prisma.$queryRaw`
  SELECT id, "name", str, dex, con, "int", wis, cha FROM "Entity"
  WHERE
    (str IS NOT NULL AND str !~ '^[0-9]+(\\([0-9]+%?\\))?$') OR
    (dex IS NOT NULL AND dex !~ '^[0-9]+(\\([0-9]+%?\\))?$') OR
    (con IS NOT NULL AND con !~ '^[0-9]+(\\([0-9]+%?\\))?$') OR
    ("int" IS NOT NULL AND "int" !~ '^[0-9]+(\\([0-9]+%?\\))?$') OR
    (wis IS NOT NULL AND wis !~ '^[0-9]+(\\([0-9]+%?\\))?$') OR
    (cha IS NOT NULL AND cha !~ '^[0-9]+(\\([0-9]+%?\\))?$')
`;
console.log(`\n  Non-standard ability score values: ${badScores.length}`);
badScores.forEach(r => {
  const fields = ['str','dex','con','int','wis','cha'];
  const bad = fields.filter(f => {
    const v = r[f];
    if (v === null) return false;
    return !/^[0-9]+(\([0-9]+%?\))?$/.test(v);
  });
  console.log(`    ${r.name.padEnd(30)} bad fields: ${bad.map(f => `${f}="${r[f]}"`).join(', ')}`);
});

// Empty string name or pantheon (already checked above, but report in anomalies too)
console.log(`\n  (Empty strings reported in section 3)`);

// ============================================================
// 7. CATEGORY MATCH — DB categories vs portrait directories
// ============================================================
sep('7. CATEGORY MATCH — DB Categories vs Portrait Directories');

const dbCategories = await prisma.$queryRaw`SELECT DISTINCT category FROM "Entity" ORDER BY category`;
const dbCatSet = dbCategories.map(r => r.category);
const dirCatSet = portraitDirs.map(d => d.replace(/-/g, '_'));

console.log(`\n  DB categories:       ${dbCatSet.join(', ')}`);
console.log(`  Portrait dirs (as _): ${dirCatSet.join(', ')}`);

const catsWithoutDir = dbCatSet.filter(c => !portraitDirs.includes(categoryToDir(c)));
const dirsWithoutCat = portraitDirs.filter(d => !dbCatSet.includes(d.replace(/-/g, '_')));

if (catsWithoutDir.length === 0) {
  console.log('\n  ✅ Every DB category has a matching portrait directory.');
} else {
  console.log(`\n  ❌ DB categories WITHOUT a portrait directory:`);
  catsWithoutDir.forEach(c => console.log(`    "${c}" (would need dir: "${categoryToDir(c)}")`));
}

if (dirsWithoutCat.length === 0) {
  console.log('\n  ✅ Every portrait directory has a matching DB category.');
} else {
  console.log(`\n  ⚠️  Portrait directories WITHOUT a DB category:`);
  dirsWithoutCat.forEach(d => console.log(`    "${d}" (would need category: "${d.replace(/-/g, '_')}")`));
}

// ============================================================
// SUMMARY
// ============================================================
sep('AUDIT SUMMARY');
const issues = [];
if (dupes.length > 0) issues.push(`${dupes.length} duplicate ID(s)`);
if (nc.null_name > 0 || nc.null_pantheon > 0 || nc.null_category > 0 || nc.null_align > 0 || nc.null_hp > 0 || nc.null_AC > 0) {
  issues.push(`${nc.null_name + nc.null_pantheon + nc.null_category + nc.null_align + nc.null_hp + nc.null_AC} null critical field(s)`);
}
if (ec.empty_name > 0 || ec.empty_pantheon > 0) issues.push(`${ec.empty_name + ec.empty_pantheon} empty string field(s)`);
if (anyMissing.length > 0) issues.push(`${anyMissing.length} entities with missing ability score(s)`);
if (missingPortraits.length > 0) issues.push(`${missingPortraits.length} missing portrait(s)`);
if (badHp.length > 0) issues.push(`${badHp.length} HP ≤ 0`);
if (hpMismatch.length > 0) issues.push(`${hpMismatch.length} HP ≠ maxHp mismatches`);
if (badAc.length > 0) issues.push(`${badAc.length} out-of-range AC`);
if (badScores.length > 0) issues.push(`${badScores.length} non-standard ability score(s)`);
if (catsWithoutDir.length > 0) issues.push(`${catsWithoutDir.length} category-dir mismatch(es)`);

if (issues.length === 0) {
  console.log('  🎉 ALL CHECKS PASSED — No integrity issues found!');
} else {
  console.log('  Issues found:');
  issues.forEach((iss, i) => console.log(`    ${i + 1}. ${iss}`));
}

console.log('\n');
await prisma.$disconnect();
