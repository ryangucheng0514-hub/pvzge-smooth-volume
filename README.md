# PvZGE Smooth Volume

A volume-curve mod for **PvZ2 Gardendless 0.15.0 / GP-Next 1.5.2**. It gives the music and sound effects sliders in the main and pause menus a wider useful adjustment range, especially at low volumes.

**Status: experimental.** Code tests against the original volume callbacks from the official 0.15.0 build have passed. Installation and listening tests in the game are still pending. Compatibility with other game versions has not been verified.

## Download and install

[Download the importable mod ZIP](https://github.com/ryangucheng0514-hub/pvzge-smooth-volume/releases/download/v1.0.0/pvzge-smooth-volume-1.0.0.zip). Use this package for installation. GitHub's **Code > Download ZIP** downloads the entire source repository.

1. Press **F9** in the game to open GP-Next.
2. Open **Experimental**, enable **JS Modding**, and read and confirm the game's script warning.
3. Open **Mods > Import ZIP** and select the downloaded mod ZIP without extracting it.
4. Enable **Smooth Volume · 0–100**, save and apply. If prompted, finish your current game and restart.

You can also enter integer music and sound effects levels (0–100) directly in the mod's details panel. To disable the mod, uncheck it, save and apply, and restart if prompted.

## Volume curve

| Slider position | Native audio gain | Level relative to maximum |
| --- | --- | --- |
| 0 | 0 | Muted |
| 1 | 0.001 | −60 dB |
| 25 | 0.005337 | About −45.45 dB |
| 50 | 0.030539 | About −30.30 dB |
| 75 | 0.174753 | About −15.15 dB |
| 100 | 1 | 0 dB |

Each integer step from 1 to 100 adds approximately **0.606 dB**. Positions between 0 and 1 fade smoothly to silence. Even decibel steps do not guarantee identical perceived loudness changes for every listener.

Enabling the mod preserves the current loudness and changes the displayed slider position. For example, a native gain of 1% appears at about 34% on the new scale. Settings continue to store native audio gains, so disabling the mod preserves the actual loudness.

## Implementation and scope

- Wraps the volume callbacks and display updates in `SettingWindow` and `PauseScreen`.
- Uses the game's existing settings save operations, with independent music and sound effects controls.
- Does not modify the game EXE, player progress, or currency.
- Includes no game assets, personal saves, network requests, or external dependencies.

Code tests cover the original main and pause menu callbacks, mute and maximum levels, decibel steps, independent channels, saved values, repeated updates, numeric input, and disabling/reloading. The mod interface and final listening experience still need testing in the game.

## Source and packaging

`pack.json` is the mod manifest; `scripts/main.js` is the complete entry point. After editing, run:

```sh
python build.py
```

This creates `dist/pvzge-smooth-volume-<version>.zip`, with `pack.json` at the ZIP root. The package also includes `scripts/main.js` and `INSTALL.txt`.

## References

- [Official mod installation guide](https://pvzge.com/en/guide/mod/gp-next)
- [Official JavaScript mod API](https://pvzge.com/en/guide/mod/gp-next-api)
- [Official 0.15.0 build used for comparison](https://github.com/Gzh0821/pvzge_web/blob/0e4a053/docs/assets/main/index.js)

This is an independent, unofficial mod.
