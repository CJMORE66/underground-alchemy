# Printful / CAISIK: bezpečná čtecí synchronizace

Stav k 27. říjnu 2026: připravený import skutečného katalogu Printful, **dosud bez připojení ke skutečnému účtu**. Žádný token nebyl dodán ani použit. Historický katalog 20 produktů / 86 variant je samostatný výchozí snapshot, nikoli důkaz dnešní dostupnosti, ceny nebo funkčního prodeje. Webový soubor, který se má publikovat, je `dist/shop/catalog.json`.

## Co je připravené

`tools/sync-printful.py` používá pouze Python standard library. Po úspěšné autentizaci stáhne produkty obchodu **18912189**, vytvoří veřejný JSON a atomicky jej zapíše. Skript neposkytuje checkout ani serverový endpoint; je to explicitně spuštěný administrátorský import před kontrolou a publikací webu.

Povolené síťové operace jsou výhradně:

- `GET https://api.printful.com/stores` pro kontrolu identity. Odpověď musí obsahovat právě jeden obchod s ID `18912189`.
- `--platform api` (výchozí): `GET https://api.printful.com/store/products?status=synced&offset=…&limit=…` a `/store/products/{numeric_id}` pro existující Manual orders / API store.
- `--platform ecommerce`: stejné čtecí operace pod `/sync/products` pro existující obchod napojený integrační platformou. Typ obchodu ověř v účtu; historická Medusa-like data jej nedokazují. Skript automaticky nezkouší druhou rodinu endpointů ani nevytváří nový store.

Každý požadavek používá TLS, pevný host a pevné `X-PF-Store-Id: 18912189`. Přesměrování se nenásledují ani na stejný host. Neexistuje argument pro jiný API server, obchod, token nebo objednávku. Celý nesanitizovaný API výstup se neukládá a neloguje.

Export obsahuje jen názvy, veřejné identity, bezpečné mockupy, volby a varianty. Zachovává původní ID, schválený `displayName`, `handle`, kategorii a existující lokální obrázek podle Printful sync identity. Nové produkty dostanou `pf-{sync_product_id}` a nové varianty `pfv-{sync_variant_id}`. Bez jednoznačných atributů velikosti/barvy se použije celý dodaný název varianty, nikoli vymyšlené rozdělení názvu. Kategorie nového produktu je `other`, dokud ji správce vědomě nezařadí.

Povoleny jsou pouze nepodepsané Printful CDN náhledy `files.cdn.printful.com/files/…/*_preview.*` nebo `*_thumbnail.*` a existující lokální obrázky v `/assets/catalog/`. Původní tiskové soubory, soukromá metadata, Printful ceny/náklady, dostupnost, objednávky a údaje zákazníků se neexportují. Výjimkou je již veřejná historická cena původního storefrontu v `sourcePrice`: zachovává původní částku, měnu, daňový příznak a původní `checkedAt`. Čerstvý import nesmí toto datum omladit ani nahradit cenu hodnotou Printful `retail_price`. Nová varianta bez doložené prodejní ceny zůstává bez ceny. Změna existujícího SKU nebo Printful catalog variant ID import zastaví; správce musí nejprve prověřit mapování. Nový produkt bez bezpečného náhledu import zastaví; to vyžaduje kontrolu zdroje, nikoli náhradní smyšlený obrázek.

`catalogueVerifiedLive: true` po skutečně úspěšném běhu znamená ověření **čtení katalogu v čase `checkedAt`**, nikoli potvrzení skladové zásoby, doručitelnosti nebo platby. Pole `checkout` se vždy exportuje jako `{enabled:false,url:null,verifiedAt:null}`.

## Připojení skutečného obchodu

1. Přihlas se do existujícího [Printful Developer Portalu](https://developers.printful.com/). Nevytvářej náhradní účet. Pro začátek vytvoř soukromý token omezený na jediný obchod **18912189** s oprávněním **`sync_products/read`**. Čtecí import nepotřebuje práva k objednávkám, změnám produktů ani knihovně tiskových souborů. Samotné ID z historického exportu nedokazuje přístup k tomuto obchodu; proto skript kontroluje API identitu před importem.
2. Token vlož pouze do proměnné prostředí aktuálního procesu `PRINTFUL_API_TOKEN`. Nikdy jej neposílej do chatu, nezapisuj do repozitáře, browser JavaScriptu ani argumentu příkazu. Token se zobrazuje jen při vytvoření; uschovej jej ve správci tajemství.
3. V kořeni projektu spusť `python tools/sync-printful.py --platform api` pro ověřený Manual orders / API store, nebo `python tools/sync-printful.py --platform ecommerce` pro ověřenou ecommerce integraci. Případně `python tools/sync-printful.py --output cesta/ke/katalogu.json` pro oddělený soubor ke kontrole. U nového výstupu se původní identity načítají z `dist/shop/catalog.json`, pokud existuje. Existující výstup slouží sám jako předchozí katalog.
4. Zkontroluj změny `git diff -- dist/shop/catalog.json`, produktové identity, názvy, varianty a lokální obrázky. Spusť `python tests/printful-sync.py` i testy storefrontu. Teprve zkontrolovaný katalog patří do nové publikované verze. Samotný běh skriptu nikam web nenasazuje.
5. Po běhu proměnnou prostředí odstraň. Při kompromitaci nebo expiraci token zruš v Printful a vytvoř nový se stejným omezeným rozsahem.

### PowerShell: zadání bez tokenu v historii

Následující příkazy spouští správce lokálně. Hodnota se zadává skrytě; do historie se zapisuje pouze příkaz, nikoli token. Existující token v této proměnné bude po skončení odstraněn.

```powershell
$pfSecret = Read-Host 'Printful read-only token' -AsSecureString
$pfSecretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pfSecret)
try {
    $env:PRINTFUL_API_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pfSecretPointer)
    # Zvol pouze typ ověřený v existujícím Printful účtu.
    python tools/sync-printful.py --platform api
} finally {
    Remove-Item Env:PRINTFUL_API_TOKEN -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pfSecretPointer)
    $pfSecret.Dispose()
}
```

Při chybě autentizace, neplatné odpovědi, změně stránkování nebo prázdném katalogu zůstane předchozí soubor zachovaný. API token ani text chybové odpovědi se nevypisují. Bez tokenu skončí skript před prvním síťovým požadavkem. Limit je 500 produktů, 500 variant na produkt, 5 000 variant celkem a 8 MiB na jednotlivou odpověď i veřejný export; detaily se zpracovávají průběžně, nikoli jako neomezená sbírka původních API odpovědí.

## Co zbývá před skutečným prodejem

Aktuální browser audit původního storefrontu a přesné produktové varianty ukazuje
stránku Synology „Hledaná stránka nebyla nalezena.“. Nejdříve obnov existující
nasazení a prověř jeho skutečný objednávkový adaptér. Podrobný seznam přístupů,
mapování, kroků a akceptačních podmínek je v [SHOP_REPAIR.md](SHOP_REPAIR.md).
Neinstaluj platformový modul jen podle starých názvů ani nevytvářej druhou
Printful objednávku, pokud tu původní již vytváří existující backend.


Printful API zajišťuje produkty a fulfillment, **ne zákaznickou pokladnu**. Běžně zákazník zaplatí obchodníkovi přes samostatnou platební platformu a Printful potom účtuje obchodníkovi výrobu, dopravu a případné daně. Skutečný checkout, platební účet, ověřené prodejní ceny, doprava, potvrzená platba a následné předání objednávky vyžadují oddělenou implementaci a oprávnění. Tento nástroj žádnou objednávku nevytváří ani nepotvrzuje a neumí zapnout placenou výrobu.

Pokud se obnoví existující PrestaShop, Printful má oficiální modul pro self-hosted PrestaShop; aktuální návod upozorňuje na kompatibilitu verzí. Technologie a verze původního shopu musí být skutečně zjištěny před instalací modulu. Printful Quick Stores je podle aktuálních podmínek omezen na americké prodejce a US doručovací adresy; pro běžný CZ/FR prodej to není náhradní řešení.

## Ověření a rollback

`python tests/printful-sync.py` spouští offline testy nad skutečnou konstrukcí `urllib` HTTP požadavků, mock HTTPS transportem a dočasnými soubory. Ověřuje pevnou identitu a pouze GET endpointy, stránkování, veřejný whitelist, zachování identit, tajemství v chybových odpovědích, chybné JSON/HTML, velikostní meze, prázdné a duplicitní záznamy, odmítnutí přesměrování a atomický zápis. Testy nepoužívají účet ani síť a nedokazují úspěšnou živou autentizaci.

Pro rollback obnov předchozí zkontrolovanou verzi `dist/shop/catalog.json` z Gitu a znovu publikuj odpovídající verzi webu. Neměň původní jazyková, atlasová ani Blackbook data. Nikdy nenahrazuj poškozený originál prázdným katalogem nebo falešným úspěchem.

## Oficiální podklady

- [Printful API: autentizace, scopes a Products API](https://developers.printful.com/docs/)
- [Manual order / API store není automaticky veřejným obchodem](https://help.printful.com/hc/en-us/articles/50262225690257-How-do-I-create-and-use-a-manual-order-API-store)
- [Přijímání plateb zákazníků](https://help.printful.com/hc/en-us/articles/50262145635601-How-do-I-accept-payments-for-my-orders)
- [Oficiální PrestaShop integrace a kompatibilita](https://help.printful.com/hc/en-us/articles/50262820051345-How-do-I-connect-PrestaShop-to-Printful)
- [Dostupnost Quick Stores](https://help.printful.com/hc/en-us/articles/50265737247889-Is-Quick-Stores-available-in-my-area)
