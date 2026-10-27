# SHOP: oprava a hranice objednávkového napojení

Audit 27. října 2026, GitHub základ `be639623d83da4f6527732b5672a7960b430765c`.
Tento dokument doplňuje historický test ze 16. října, nikoli potvrzuje jeho dnešní platnost.

## Zjištění a opravy v repozitáři

Na kontrolovaném `main` už existuje SHOP v `#main-nav` a samostatný `/shop/`.
Současný runtime je `dist/shop/shop.js`. Starší `commerce-v7.js` patří archivované
zkušenosti; jeho úspěšné staré testy samy neověřují dnešní shop.

- SHOP má nově i přímou zkratku mimo zavřené mobilní menu. Navigace se skládá
  při šířce do 1180 px, má dostatečné dotykové cíle, omezenou výšku a vlastní
  svislé posouvání. Escape menu zavře a vrátí focus na jeho tlačítko.
- `dist/shop/catalog.json` zachovává všech 20 produktů / 86 variant, původní
  product/variant ID, handle, SKU i Printful sync/catalog ID. `dist/catalog.json`
  zůstává beze změny jako původní doklad.
- `sourcePrice` uchovává původní částku, měnu, daňový příznak a datum. V detailu
  se cena ukáže pouze pro jednoznačnou kompletní volbu. Reset, neexistující
  kombinace a nové otevření smažou předchozí cenu i odkaz varianty. Ceny nejsou
  přepočítány ani označeny za aktuální nabídku či konečnou cenu s dopravou.
- `source-commerce.js` vytváří původní URL s přesným `v_id` pouze pro známý host,
  doložený handle a variantu daného produktu. Nepřijímá cizí checkout URL ani
  nevymýšlí původní obchodní identity pro nové `pf-*` importy.
- Nákupní tlačítko je neaktivní a vysvětluje aktuální nedostupnost. Připravené
  URL je diagnostické `data-source-variant-url`; neposílá objednávku a zákazníka
  nepřesměrovává na ověřenou chybovou stránku.
- Čtecí importér rozlišuje Manual/API a ecommerce Sync API. Živý import zachová
  staré prodejní ceny s původním datem; nové výrobní ceny jim nepodsouvá. Změna
  existujícího SKU nebo catalog variant ID skončí chybou před nahrazením souboru.
  Všechny nové texty jsou česky, anglicky a francouzsky.

## Co skutečně ukázal prohlížeč

Testovaná cesta: hlavní navigace → SHOP → vyhledání OMERTA → detail → Black / 2XL
nebo 3XL → zobrazení přesného SKU, historické ceny a stavu nákupu.

| Kontrola | Výsledek |
| --- | --- |
| Současný katalog a detail v preview | Funguje, 20 návrhů; OMERTA nalezena jako jeden výsledek |
| OMERTA Black / 2XL | `PF-18912189-5577030794`, €56.50, cenový snapshot 2026-10-16 |
| OMERTA Black / 3XL | `PF-18912189-5577030795`, €58.50, stejné historické datum |
| CS → FR → EN v detailu | Přeložené ovládání; produkt, SKU a zvolená velikost zůstaly zachované |
| Reset velikosti | Cena a `data-source-variant-url` se vyprázdnily |
| Mobilní hlavička a menu | Skutečně vykreslený iframe 320 × 844 a 390 × 844; navíc 1000px tabletová šířka bez vodorovného přetečení; SHOP dostupný se zavřeným menu, menu otevře všech 7 položek; Escape zavře |
| Přetečení | Při iframe 320 px má dokument 305 px kvůli scrollbar: `scrollWidth = clientWidth = 305`; při 390 px `375 = 375`. Dialog: šířka obsahu i scrollu 318 px, obsah se svisle posouvá |
| Desktop | Preview v cloudovém Chrome, screenshot detailu 1348 × 926; detail a přesná cena vykreslené |
| Konzole shopu | Pozorované chyby pocházely z metadat browser extension; žádná zaznamenaná chyba aplikace shopu |
| Původní katalog a přesná produktová URL | Obě zobrazily Synology „Hledaná stránka nebyla nalezena.“; HTTP status nebyl zaznamenán |
| Aktuální košík, adresní krok, platba, Printful objednávka | **Neověřeno — původní nákupní cesta se neotevřela** |

Externí kontroly použily přesně:

- `https://hiphop.caisik.i234.me/dk/store?page=1`
- `https://hiphop.caisik.i234.me/dk/products/printful-18912189-482104768?v_id=variant_01M51CDGGHJT72J1PK1DY3QJBX`

Nešlo o fyzický telefon ani o placenou objednávku. Nebyly zadány adresy, platební
údaje ani tokeny. Z chybové stránky nelze určit, zda je příčinou proxy, zastavený
kontejner, změna nasazení nebo routování; to vyžaduje níže uvedené přístupy.

## Chybějící přístupy

| Přístup | Konkrétní účel |
| --- | --- |
| Správa existujícího hostu `hiphop.caisik.i234.me` na Synology / reverse proxy a Container Manager / Docker Compose | Zkontrolovat HTTPS virtual host, cílový port, stav původního storefrontu a backendu, healthcheck a provozní logy; obnovit existující nasazení |
| Zdrojový repozitář a konfigurace skutečného objednávkového backendu | Určit platformu a verzi, najít cart/checkout, platební adaptér, odběratele událostí a případný existující Printful modul |
| Admin nebo čtecí přístup do produktové/objednávkové databáze backendu | Porovnat product ID, variant ID, SKU, ceny, Printful mapování a poslední stavy importu; nejprve čtení, žádná plošná migrace |
| Přístup ke stávajícímu Printful store `18912189` | Ověřit skutečný typ obchodu, varianty/print files, ignorované či nesynchronizované položky, nastavení importu a chybové objednávky |
| Bezpečně nastavený store-scoped token `sync_products/read` | Ověřit živé čtení správné rodiny API; nepatří do chatu, veřejného JS ani repozitáře |
| Pro kontrolu objednávek `orders/read`; pro chybějící serverový adaptér následně odpovídající právo `orders` | Nejprve doložit existující order flow; zápis a potvrzení výroby řešit pouze serverově a až ve schváleném testu |
| Přístup ke skutečné platební bráně backendu a jejímu sandboxu/webhook nastavení | Ověřit zaplacení, doručení podepsané platební události a návaznost na fulfillment; konkrétní poskytovatel zatím nebyl zjištěn |

Samotný přístup do tohoto statického GitHub repozitáře žádný z backendových
přístupů nenahrazuje. Chybějící token není jediná překážka; čtecí import neposkytne
checkout, platbu ani spuštění výroby.

## Konkrétní postup dokončení v původním obchodě

1. **Obnovit stávající nasazení.** Ověřit proxy → storefront → backend a jeho
   databázi. Z původní produktové stránky musí fungovat stejný session/cart flow
   jako dříve. Nezakládat nový Magento/PrestaShop ani druhý Printful store.
2. **Ověřit identity a ceny.** Podle skutečného typu store použít čtecí import
   `python tools/sync-printful.py --platform api` nebo `--platform ecommerce`.
   Porovnat původní varianty a SKU se store 18912189, aktivní sync variantou,
   správným blank catalog variant ID a tiskovými soubory. Nové prodejní ceny a
   jejich měnu ověřit v původním backendu, nikoli odhadovat z ceny Printful.
3. **Najít existující objednávkový adaptér.** Zkontrolovat skutečný trigger po
   zaplacení, logy, retry/frontu a uložení Printful order ID. Pokud už integrace
   importuje objednávky, neopakovat totéž vlastním druhým odesílatelem.
4. **Jen pokud adaptér chybí, doplnit jej do tohoto backendu.** Ověřená platební
   událost musí vést přes trvalou idempotentní frontu k jedinému Printful order
   `external_id` navázanému na původní shop order ID. Položky musí používat
   doložené `sync_variant_id` a množství; backend ověřuje adresu, měnu, dopravu,
   daně a skutečné zaplacení. Žádné tajemství ani důvěra v cenu z prohlížeče.
5. **Nejprve draft.** Případný nový adaptér vytváří `POST /orders` bez
   `confirm=1`, uloží vrácené ID a před retry dohledá případnou už vytvořenou
   objednávku podle `external_id`. Ověřit, že znovudoručení platební události ani
   timeout nevytvoří další objednávku. `draft` ještě nedokazuje výrobu.
6. **Stavy a selhání.** Ověřit autentizaci platebních callbacků podle skutečné
   brány a mechanismus Printful webhooků podle použité verze, případně stav
   potvrdit autentizovaným API čtením. Evidovat failed/on-hold/canceled a tracking,
   neoznačovat objednávku za vyrobenou jen proto, že webhook dorazil.
7. **Akceptace.** Znovu projít přesný produkt → variantu → košík → adresu →
   dopravu/daň → sandbox platbu → jednu navázanou Printful draft objednávku.
   Teprve samostatně schválený placený test a doložený stav výrobního zpracování
   opravňuje tvrdit, že výroba funguje. `POST /orders/{id}/confirm` může účtovat
   náklady; v tomto úkolu nebyl proveden.
8. **Obnovit veřejné předání.** Po doloženém aktuálním košíku/adresním kroku
   nahradit neaktivní tlačítko odkazem z `originalVariantURL`, aktivním pouze při
   kompletní jednoznačné volbě. Neplatná volba nesmí ponechat předchozí `v_id`.
   Nákup tak dál probíhá v původním obchodě, bez paralelního checkoutu.

## Reprodukovatelné kontroly

`npm test`, `node tests/shop.mjs`, `python tests/printful-sync.py` (14 testů),
`node tests/languages.mjs`, `node tests/languages-integration.mjs`,
`node tests/atlas-place-browser.mjs`, `node tests/expeditions.mjs` a
`git diff --check` prošly. Shop test porovnává všech 86 uložených cen a SKU
s původním exportem a kontroluje přesná URL, reset i bezpečnost veřejných polí.
Printful test používá mock HTTP transport, nikoli skutečný účet.

Před publikací znovu spustit `python tools/build-languages.py` a
`python tools/wire-selfmade.py`. Tato GitHub oprava sama není produkční deploy.

## Primární zdroje

- [Printful API — Products versus Ecommerce Platform Sync, scopes, Orders](https://developers.printful.com/docs/)
- [Printful — požadavky a stavy pro import objednávek](https://help.printful.com/hc/en-us/articles/50262160035985-What-order-status-is-needed-for-an-order-to-import-from-my-integration)
- [Printful — význam stavů synchronizace variant](https://help.printful.com/hc/en-us/articles/50263331819281-What-do-the-sync-statuses-of-my-products-mean)
