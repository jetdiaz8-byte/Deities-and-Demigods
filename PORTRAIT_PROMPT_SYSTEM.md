# Portrait Prompt System

This project uses a tiered portrait prompt system for all character art.

## Global Art Direction

High fantasy illustration, classic 1980s AD&D Deities and Demigods aesthetic, traditional oil painting, visible brush strokes, analog canvas texture, realistic anatomy, dramatic directional lighting, strong foreground-midground-background composition, cinematic storytelling, fantasy book illustration, ultra-detailed, mythic scale, atmospheric depth, no modern elements, no sci-fi, 3:4 vertical composition.

## Greater Gods

Greater gods must look like supernatural beings, not powerful mortals. They should have the grandest scale in the set.

Required prompt elements:
- Strictly humanoid divine body unless canonically monstrous.
- Bipedal god form consistent with pantheon members.
- Upright regal posture, calm sovereign authority.
- Followers, warriors, priests, or mortals below at smaller scale.
- Environment reacts to their presence: light bends, dust lifts, banners turn, stone warms, storm clouds gather or part.
- Strong celestial, infernal, solar, storm, lunar, or domain aura.
- Grounded mythological realism with strong vertical hierarchy.

## Lesser Gods

Lesser gods must still be clearly divine, but less overwhelming than greater gods.

Required prompt elements:
- Focused sacred domain rather than world-dominating authority.
- Shrine, ruin, forest, hall, sacred road, or intimate mythic location.
- Domain objects, sacred animals, relics, weather, spirits, flame, or shadow answer their presence.
- Supernatural aura is obvious but less apocalyptic.

## Heroes and Demigods

Heroes and demigods must look heroic. Demigods should show visible divine spark; heroes should remain mortal-readable.

Required prompt elements:
- Heroic pose, legendary weapon, robes, armor, scars, relic, or cultural clothing.
- Expression focused, brave, grim, triumphant, or burdened by destiny.
- Environment shows mythic crisis around them.
- Demigods may have glow, divine eyes, aura, or reality distortion.
- Heroes should show courage under impossible pressure.

## Monsters

Monsters must read as mythic terrors, not generic fantasy beasts.

Required prompt elements:
- Legendary scale.
- Environment corrupted, shattered, flooded, darkened, or distorted by the creature.
- Ominous chiaroscuro and silhouette.
- Ancient presence and atmospheric dread.

## Generation Order

1. `greater-gods`
2. `lesser-gods`
3. `demigods`
4. `heroes`
5. `monsters`

Generate in batches, inspect, then regenerate failures only.
