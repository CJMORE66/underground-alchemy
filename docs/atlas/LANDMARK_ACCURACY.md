# Architectural studies: accuracy audit

Research date: 26 October 2026. Restored after automated workspace maintenance using the previously checked source material; no claim of a new physical site inspection.

## Geographic truth versus architectural study

The twelve authored models are simplified original architectural studies, not scanned buildings, surveyed CAD or guaranteed map footprints. Navigation points include centres, streetfronts and entrances. A venue entrance is not automatically the centre of its containing building or surrounding roof.

Every registry entry now provides primary-source `evidence` with a specific `supports` description and a `mapPlacement` object:

- `kind: illustrative-context`
- `surveyed: false`
- `modelAnchor: null`
- `anchorStatus: uses-location-point-not-surveyed-building-centroid`
- `headingStatus: approximate-clockwise-bearing-from-north`

No new geographic centres or offsets have been invented. Real cartographic footprints belong to the geographic map data. These studies can be inspected separately or used as a clearly labelled optional artistic overlay.

## Corrected geometry

**Notre-Dame:** the nave roof now follows the operator's43m register instead of49m. Parapets no longer add2.4m above69m tower crowns. Overall length and transept width were corrected; north/south transept roses were added alongside the western rose. The Latin-cross plan, twin open bell towers,three portals and crossing spire remain separate forms. Operator pages disagree about exact facade width(41versus43.5m), so that dimension is not called newly verified.

**Sainte-Chapelle:** the old48m rectangular hall was replaced by a shorter polygonal-apse composition. There are now four large nave bays on each side and seven smaller apse bays, rather than a claim of fifteen windows over unrelated geometry. Two chapel levels,western rose,stair turrets and the roof follow CMN's teaching plans. The primary guide publishes36m length,17m width and42.5m below the spire. Surface details remain simplified.

**Saint-Sulpice:** invented pointed tower caps were removed. The northern and unfinished southern towers have different transition stages and flat balustrade crowns, preserving their five-metre height difference. An eastern apse was added. This classical facade has no invented Gothic rose.

**République:** the figure's vertical register follows the city's9.5m bronze on15.5m pedestal. Its pose,olive branch,tablet,allegorical figures,lion and relief register remain independent geometry.

**Philharmonie:** the study's vertical envelope now follows the operator's52m height. The faceted mass,bands and bird-like folds are still an authored simplification rather than a reconstruction of every panel.

**Construction motion:** the previous localZ scaling of a rotated beam could distort its geographic XY footprint. Neutral parent groups now grow in the architectural parentZ direction. Completed transforms restore exactly; each part's XY envelope remains unchanged during reveal.

## Remaining identity boundaries

| Location | Representation | Limitation |
|---|---|---|
| Flamel | Protected historic facade and inscription band | Roof,depth and window dimensions are illustrative |
| Père-Lachaise | Main gateway composition,hemicycle,pylons,hourglasses | Not the full cemetery;removed gate cross is not restored |
| Abbesses | Covered ArtNouveau Guimard kiosk | Not the underground station or surveyed entrance dimensions |
| M.U.R. | Documented3x8m changing panel | Surrounding building is generic context;artwork is not the current exhibition |
| LaPlace | Canopée roof context | Not LaPlace interior footprint or a surveyed roof centre |
| CENTQUATRE | Compact paired-hall composition | Not the complete40,000m2 site |
| ShakespeareandCompany | Present rueBûcherie bookshop facade study | Not SylviaBeach's former rueOdéon location or measured furnishings |

## Primary sources actually checked in the original audit

- Notre-Dame plans: https://www.notredamedeparis.fr/comprendre/architecture/plans/ ; facade: https://www.notredamedeparis.fr/en/understand/architecture/the-western-facade/ . The plans page's indexed operator dimensions were available; direct retrieval returned403 in this environment.
- CMN architectural plans: https://www.sainte-chapelle.fr/var/cmn_inter/storage/original/application/9de53319fdb7ca2ab30c5b91ee78fa3d.pdf ; CMN guide with dimensions and window types: https://www.sainte-chapelle.fr/en/content/download/9864019/file/Fiche%20de%20visite%20pour%20groupe%20autonome.pdf?inLanguage=eng-GB&version=3 . Both PDFs were opened.
- Saint-Sulpice restoration foundation: https://restaurersaintsulpice.fr/decouvrir . Classical facade,dimensions and tower asymmetry.
- Ministry of Culture,Flamel: https://pop.culture.gouv.fr/notice/merimee/PA00086213 . Identity and protected facade,not model dimensions.
- City of Paris,Père-Lachaise: https://www.paris.fr/pages/le-cimetiere-du-pere-lachaise-comparez-les-avant-apres-17914 . Gateway and removed1883cross.
- City of Paris,République: https://www.paris.fr/pages/1-lieu-3-histoires-la-place-de-la-republique-33595 . Published vertical registers and allegories.
- RATP,Abbesses: https://www.ratp.fr/decouvrir/patrimoine/histoire-station-abbesses . Covered entrance,moved from Hotel-de-Ville in1974.
- M.U.R. operator: https://www.lemur.fr/lasso/ . Panel dimensions and changing exhibition.
- LaPlace operator: https://laplace-paris.com/a-propos/ ; roof glassmaker: https://www.atelierbarrois.com/en/projects/the-canopy-forum-des-halles . Cultural venue under the yellow glass canopy.
- CENTQUATRE operator: https://www.104.fr/projet-du-lieu . Site and halls.
- Philharmonie operator: https://philharmoniedeparis.fr/fr/decouvrir/philharmonie . Mineral forms,aluminium,birds and52m height.
- Bookshop operator: https://www.shakespeareandcompany.com/history . Present location and distinction from SylviaBeach's store.

## Verification

Build: `node tools/build-city-landmarks.mjs`.

Regression: `node tests/city-landmarks.mjs`. Tests execute all twelve distinct builders,finite coordinates,bounded geometry,source metadata,corrected roof/tower heights,the15chapel bays,flat classical tower crowns,clockwise-bearing/local-axis consistency,valid MapLibre exclusion filters,unchanged XY footprints during diagonal beam construction and the real SVGRenderer study lifecycle.

CPU/SVG projection is not proof of a GPU layer correctly overlaid on real map tiles. SVG uses a painter's algorithm and may order complex facade overlaps differently from a WebGL depth buffer. Real GPU placement and physical-phone rendering require separate verification. A different source-backed navigation point is not sufficient evidence to relocate an entire illustrative building model.
