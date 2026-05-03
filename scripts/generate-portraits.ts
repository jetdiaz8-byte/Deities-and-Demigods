import { promises as fs } from "node:fs";
import path from "node:path";
import { characterData } from "../src/lib/gameData/characterData";
import { buildPortraitPrompt } from "../src/lib/portraits";

async function main() {
  const manifest: Array<{ id: string; name: string; category: string; path: string; prompt: string; status: string }> = [];
  const shouldDownload = process.env.PORTRAIT_DOWNLOAD === "true";
  for (const character of characterData) {
    const dir = path.join(process.cwd(), "public", "portraits", character.category);
    const file = path.join(dir, `${character.id}.png`);
    await fs.mkdir(dir, { recursive: true });
    let status = "missing";
    const prompt = buildPortraitPrompt(character);
    try {
      await fs.access(file);
      status = "cached";
    } catch {
      if (shouldDownload) {
        const url = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
        url.searchParams.set("width", "1024");
        url.searchParams.set("height", "1024");
        url.searchParams.set("nologo", "true");
        url.searchParams.set("model", "flux");
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Portrait generation failed for ${character.name}: ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(file, buffer);
        status = "generated";
      }
    }
    manifest.push({
      id: character.id,
      name: character.name,
      category: character.category,
      path: `/portraits/${character.category}/${character.id}.png?v=3`,
      prompt,
      status
    });
  }
  await fs.writeFile(path.join(process.cwd(), "public", "portraits", "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Prepared ${manifest.length} portrait prompts. ${manifest.filter((entry) => entry.status === "cached").length} cached images found. ${manifest.filter((entry) => entry.status === "generated").length} generated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
