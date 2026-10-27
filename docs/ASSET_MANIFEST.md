# Asset Manifest

All assets used by the PMForge preview are listed here. There are no third-party runtime CDNs, font hosts, image hosts, or analytics scripts. Fonts are bundled through npm packages; two photography plates and two texture maps are stored locally in `public/assets`. The workspace plate's provenance has not been preserved.

## Summary

| Kind | Count | Storage | Licence status |
| --- | ---: | --- | --- |
| Font families | 3 | `@fontsource` npm packages | SIL Open Font License 1.1 |
| Raster photographs | 2 | `public/assets/images/plates/` | Pexels + provenance pending |
| Raster textures | 2 | `public/assets/textures/` | CC0 1.0 |
| Generated social image | 1 | `public/assets/og.png` | Original work |
| Vector source for social image | 1 | `public/assets/og.svg` | Original work |
| App icon | 1 | `src/app/icon.svg` | Original work |
| 3D models (GLB/GLTF) | 0 | — | Procedural geometry only |
| Icons | 1 library + local glyphs | `lucide-react` + `SocialIcon.tsx` | ISC / original |

## Fonts

| Family | Weights used | Package | Designer / source | Licence | Use |
| --- | --- | --- | --- | --- | --- |
| DM Serif Display | 400, 400 italic | `@fontsource/dm-serif-display@5.3.0` | Colophon Foundry / Google Fonts | SIL OFL 1.1 | Display headlines and pull quotes |
| Inter | 400, 500, 600 | `@fontsource/inter@5.3.0` | Rasmus Andersson | SIL OFL 1.1 | Body copy, UI, labels |
| Caveat | 500, 600 | `@fontsource/caveat@5.3.0` | Impallari Type | SIL OFL 1.1 | Handwritten notes and marginalia |

Font files are imported in `src/app/layout.tsx` and served from the application bundle. No request is made to Google Fonts or another font CDN at runtime.

## Photography

| Asset | Dimensions | Size | Creator | Source | Licence | Date / status | Use |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| `public/assets/images/plates/final-mountains.jpg` | 2600 × 3900 | 1,064,554 B | Eberhard Grossgasteiger | [Pexels profile](https://www.pexels.com/@eberhardgross/) | [Pexels License](https://www.pexels.com/license/) | Measured 2026-10-26; exact item URL still pending | Mountain landscape plate in the final Decision Blueprint section and its CSS background |
| `public/assets/images/plates/Cozy Sunlit Workspace Backdrop.png` | 1536 × 1024 | 2,167,048 B | Not recorded | Source URL not recorded | Licence not recorded; verify before public launch | Measured 2026-10-26; existing local asset, provenance pending | Shared wall plate behind the first narrative beat and Signal Test |

**Known gap:** the exact Pexels photo page URL and item ID were not preserved during asset collection. The creator profile and licence are recorded; the ID should be recovered before a public launch if exact provenance is required. See `BLOCKERS.md`.

The shared workspace plate's creator and licence are not recorded in the repository; do not treat it as cleared for public redistribution until provenance is verified. The hero poster, learning scene, interview card, project workbench, career board, and blueprint maquette are CSS/SVG/Three.js art direction built in this repository.

Four additional files remain in `public/assets/images/plates/` (`P-PLATE-DESK.jpg`, `P-PLATE-FINAL.avif`, `TEXTURES (OpenGameArt) Darkwood.jpg`, `TEXTURES (Poly Haven) Laminate floor.jpg`). No source file references them, so they are not shipped by any page and are not counted above. They are left in place as source candidates; delete or document them before packaging the repository.

## Textures

| Asset | Dimensions | Size | Source | Licence | Use |
| --- | --- | ---: | --- | --- | --- |
| `public/assets/textures/wood-table-diffuse.jpg` | 1024 × 1024 | 215,573 B | [Poly Haven — Wood Table 001](https://polyhaven.com/a/wood_table_001) | [CC0 1.0](https://polyhaven.com/license) | Hero shader/table surface, footer band, blueprints, project and signal paper scenes |
| `public/assets/textures/wood-table-rough.jpg` | 1024 × 1024 | 237,261 B | [Poly Haven — Wood Table 001](https://polyhaven.com/a/wood_table_001) | [CC0 1.0](https://polyhaven.com/license) | Roughness map for the Decision Engine wood surface |

The textures are loaded through `three`'s texture loader and CSS `background-image`; they are not re-hosted from a third party.

## Generated and original assets

| Asset | Dimensions | Source | Licence | Use |
| --- | --- | --- | --- | --- |
| `public/assets/og.png` | 1200 × 630 | Rendered from `public/assets/og.svg` in this repository | Original work | Open Graph and Twitter card image |
| `public/assets/og.svg` | 1200 × 630 | Hand-authored SVG | Original work | Editable source for the social image |
| `src/app/icon.svg` | 64 × 64 scalable | Hand-authored SVG using the PMForge paper-plane mark | Original work | Browser tab icon |
| `public/credits.txt` | — | Hand-authored plain text | Original work | Downloadable attribution summary linked from the footer |

## 3D and illustration

| Scene | Implementation | External assets |
| --- | --- | --- |
| Decision Engine hero | Procedural Three.js geometry, custom shaders, `wood-table` textures | 2 wood textures |
| Learning Cluster | Ten procedurally textured paper cards, icosahedra, rings, sphere | None |
| Decision Blueprint maquette | CSS/SVG paper stack, procedural model house and trees, rotated hand-note, warm-graded mountain photograph, wood texture | 1 photo, 1 texture |
| Hero poster fallback | CSS gradients, SVG grain and card composition | Wood texture |
| Signal, Project, Interview, Career plates | CSS gradients, SVG grain, CSS shadows | Wood texture where noted |
| Career artifact shelf | Six hand-authored SVG tiles (memo, map, roadmap, research note, launch note, metrics sheet) | None |

There are **no GLB, GLTF, FBX, OBJ, HDR, or EXR files** in the repository. No Blender source files were available.

## Icons

| Asset | Source | Licence | Use |
| --- | --- | --- | --- |
| `lucide-react@1.61.0` | [lucide.dev](https://lucide.dev) | ISC | Interface icons (arrow, check, lock, microphone, copy, download, etc.) |
| LinkedIn, X, Discord, GitHub glyph paths in `src/components/ui/SocialIcon.tsx` | Hand-authored simple SVG paths | Original work | LinkedIn glyph on the career board. Other glyphs are retained for reuse but are not linked from the current UI. |

The footer no longer renders social links because no PMForge social profiles exist. This avoids implying accounts that are not real.

## CSS-generated art

The following are generated at runtime or defined in CSS, not bundled as image files:

- SVG `feTurbulence` grain overlays and paper noise.
- Gradient light shafts, leaf shadows, plant shadows, cloud bands, and pencil strokes.
- Sticky notes, tape, punched holes, rules, stamps, and hand-drawn underlines.
- The `public/assets/og.svg` composition and all page “plates”.

These are original to the repository and covered by the project's own content.

## External links

The app links to Pexels, Poly Haven, Google Fonts specimen pages, `lucide.dev`, and the licence pages for attribution. These links open third-party sites; no asset is fetched from them at runtime. The privacy note describes this distinction.

## Verification

- No `href="#"` or empty `href` exists in the rendered pages.
- No placeholder lorem ipsum remains.
- The temporary QA harness HTML files have been removed from `public/`; only `credits.txt` remains there as a public file.
- The only intentional placeholder copy is the unmonitored support address `hello@pmforge.example`, disclosed in `BLOCKERS.md` and on the credits page.
- Asset byte sizes and dimensions were measured from the files in this repository on 2026-10-26. Existing source/licence gaps are called out above rather than inferred.
