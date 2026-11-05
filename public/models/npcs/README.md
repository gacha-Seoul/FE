# Human market NPCs

Source: [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox).
Original assets: `Assets/Avatars/Professions/Chef_Female_01` and `Gardener_Male_01`.
Copyright Microsoft / Rocketbox contributors. MIT license: [LICENSE.md](LICENSE.md).

`human.fbx` is the original facial-rig FBX. PNG maps are lossless conversions of
the original 2048×2048 TGA maps; resolution and RGBA pixels are preserved.
`preview.png` is the source preview. Reproduce with Node.js 24:

```sh
node scripts/prepare-npcs.mjs
```

At runtime Three.js normalizes height to 1.66m / 1.74m, rests the arms on the rig,
uses PBR skin/clothing materials, and adds breathing, blinking, and player-facing
idle motion. A cloth apron is added to the first merchant. NPC placement,
interaction radius, quest rules, and the original 1,920,000-splat market are unchanged.
