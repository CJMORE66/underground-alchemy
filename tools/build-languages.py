"""Build three local dictionaries from reviewed content, never user writing."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
LANGS = ('cs', 'en', 'fr')
normalize = lambda value: re.sub(r'\s+', ' ', value).strip()
messages = {lang: {} for lang in LANGS}
conflicts = []

def add(source, translations, origin):
    if not isinstance(source, str) or not source.strip():
        return
    source = normalize(source)
    if not all(isinstance(translations.get(lang), str) and translations[lang].strip() for lang in LANGS):
        raise ValueError(f'Incomplete translation: {origin}: {source[:80]}')
    for lang in LANGS:
        value = normalize(translations[lang])
        prior = messages[lang].get(source)
        if prior is not None and prior != value:
            conflicts.append({'source': source, 'language': lang, 'previous': prior, 'selected': value, 'origin': origin})
        messages[lang][source] = value

def nested(source, variants, origin):
    if isinstance(source, str):
        if all(isinstance(variants.get(lang), str) for lang in LANGS):
            add(source, variants, origin)
    elif isinstance(source, list):
        for i, item in enumerate(source):
            nested(item, {lang: variants.get(lang, [])[i] if isinstance(variants.get(lang), list) and len(variants[lang]) > i else None for lang in LANGS}, origin)
    elif isinstance(source, dict):
        for key, item in source.items():
            if key not in ('translations', 'url', 'id', 'name', 'address', 'coordinateSource'):
                nested(item, {lang: variants.get(lang, {}).get(key) if isinstance(variants.get(lang), dict) else None for lang in LANGS}, origin)

for file in sorted((ROOT / 'docs/i18n').glob('*-translations.json')):
    data = json.loads(file.read_text())
    for source, translations in data['entries'].items():
        add(source, translations, file.name)

studio_source = ROOT / 'docs/atlas/research-studios-2026-10-26.json'
if studio_source.exists():
    data = json.loads(studio_source.read_text())
    for place in data['places']:
        variants = place['translations']
        nested(place, variants, place['id'])
        add(' '.join(place['facts']), {lang: ' '.join(variants[lang]['facts']) for lang in LANGS}, place['id'])
        add('Doložený kulturní kontext: ' + place['facts'][0], {lang: {'cs': 'Doložený kulturní kontext: ', 'en': 'Documented cultural context: ', 'fr': 'Contexte culturel documenté : '}[lang] + variants[lang]['facts'][0] for lang in LANGS}, place['id'])
        add(place['task']['try'] + ' Výstup: ' + place['task']['output'], {lang: variants[lang]['task']['try'] + {'cs': ' Výstup: ', 'en': ' Output: ', 'fr': ' Résultat : '}[lang] + variants[lang]['task']['output'] for lang in LANGS}, place['id'])
    nested(data['sessionBrief'], data['sessionBrief']['translations'], 'studio-session')

positions = json.loads((ROOT / 'docs/atlas/PLACE_POSITION_REVIEW.json').read_text())
for place in positions['positions'].values():
    add(place['coordinateStatus'], place['coordinateStatusI18n'], 'verified-position')
    add('Map position: ' + place['coordinateStatus'] + '. Check the official venue before your visit.', {
        'cs': 'Poloha v mapě: ' + place['coordinateStatusI18n']['cs'] + '. Před návštěvou ověř informace u provozovatele.',
        'en': 'Map position: ' + place['coordinateStatusI18n']['en'] + '. Check the official venue before your visit.',
        'fr': 'Position sur la carte : ' + place['coordinateStatusI18n']['fr'] + '. Vérifie les informations auprès du lieu avant ta visite.'
    }, 'verified-position-profile')

seed = {
    'Recording studio': ('Nahrávací studio', 'Recording studio', 'Studio d’enregistrement'),
    'Nahrávací studia': ('Nahrávací studia', 'Recording studios', 'Studios d’enregistrement'),
    'VYBRAT NAHRÁVACÍ STUDIO ↗': ('VYBRAT NAHRÁVACÍ STUDIO ↗', 'FIND A RECORDING STUDIO ↗', 'CHOISIR UN STUDIO ↗'),
    'Z ulice do studia.': ('Z ulice do studia.', 'From the street to the studio.', 'De la rue au studio.'),
    'Připrav zadání. Nahraj dvě vlastní verze. Odnes si jedno vysvětlené rozhodnutí.': ('Připrav zadání. Nahraj dvě vlastní verze. Odnes si jedno vysvětlené rozhodnutí.', 'Prepare a brief. Record two versions of your own work. Leave with one explained decision.', 'Prépare ton brief. Enregistre deux versions de ta création. Repars avec une décision expliquée.'),
    'FROM STREET TO SESSION / PŘÍPRAVA DO STUDIA ↗': ('FROM STREET TO SESSION / PŘÍPRAVA DO STUDIA ↗', 'FROM STREET TO SESSION / GET READY ↗', 'FROM STREET TO SESSION / PRÉPARE TA SESSION ↗'),
    'AUTORSKÁ VEDENÁ PRAXE CAISIK': ('AUTORSKÁ VEDENÁ PRAXE CAISIK', 'ORIGINAL CAISIK GUIDED PRACTICE', 'PRATIQUE GUIDÉE ORIGINALE CAISIK'),
    'Vysvětlený příklad': ('Vysvětlený příklad', 'Worked example', 'Exemple expliqué'),
    'Přenes do další tvorby': ('Přenes do další tvorby', 'Use it in your next creation', 'Réutilise-le dans ta prochaine création'),
    'Pro zvolený jazyk není dostupný místní hlas. Text zůstává níže.': ('Pro zvolený jazyk není dostupný místní hlas. Text zůstává níže.', 'No local voice is available for this language. The text remains below.', 'Aucune voix locale n’est disponible pour cette langue. Le texte reste accessible ci-dessous.'),
    'STREET / SOUND / THOUGHT · 20 KULTURNÍCH MÍST ↓': ('STREET / SOUND / THOUGHT · 20 KULTURNÍCH MÍST ↓', 'STREET / SOUND / THOUGHT · 20 CULTURAL PLACES ↓', 'STREET / SOUND / THOUGHT · 20 LIEUX CULTURELS ↓'),
}
for source, values in seed.items():
    add(source, dict(zip(LANGS, values)), 'shared-studio-ui')

output = DIST / 'i18n'
output.mkdir(exist_ok=True)
for lang in LANGS:
    (output / f'{lang}.json').write_text(json.dumps(messages[lang], ensure_ascii=False, indent=2) + '\n')
(ROOT / 'docs/i18n/BUILD_REPORT.json').write_text(json.dumps({'entries': len(messages['cs']), 'languages': list(LANGS), 'conflicts': conflicts, 'note': 'Later reviewed catalogues deterministically override equivalent wording. No remote translation, notes or recordings are used.'}, ensure_ascii=False, indent=2) + '\n')
print(f'Built {len(messages["cs"])} local CS/EN/FR entries; {len(conflicts)} wording differences recorded for review.')
