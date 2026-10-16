# CAISIK / The Blackbook

The 100-artwork collection is generated individually with the built-in GPT image generation tool. The full prompt set and production state are recorded in `art-direction-100.json`. The exact original PNGs are retained in `art-originals/`; web assets preserve the alpha channel and are served from `dist/assets/masterworks/`.

`tools/build-masterworks.py` verifies real alpha, produces full-size WebP assets and smaller gallery thumbnails, and creates the accessible, searchable `/art/` gallery. PNG downloads are created in the browser from the transparent full-size artwork; the preview checkerboard is never included.

The homepage has four explicit routes: Art, Freestyle, Knowledge and Collections. The six-chapter cinematic sequence remains available through an optional disclosure. The Knowledge Wall provides six short lessons and links to the existing seven-principle learning studio. Creative metaphors are distinguished from factual recording guidance and historical context.

Sources used for factual lesson content:
- Smithsonian National Museum of American History, hip-hop collection: https://americanhistory.si.edu/press/releases/national-museum-american-history-displays-recent-hip-hop-acquisitions
- Shure, How to Record and Mix Vocals: https://www.shure.com/en-EU/insights/how-to-record-and-mix-vocals
- The Kybalion, original text: https://en.wikisource.org/wiki/The_Kybalion

Verification: run `npm test` and `node tests/masterworks.cjs`. Alpha and asset-size records are generated in `docs/MASTERWORKS-QA.json`. Rendered browser checks are recorded separately after publication.
