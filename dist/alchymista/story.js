export const greeting = 'Začni hned česky: Na skle starej otisk, v krku novej hlas. Tři doby držím já. Tu čtvrtou máš. Jaký slovo do ní dáš? Pak zmlkni a nech návštěvníka odpovědět.';

// The first label and prompt feed the voice session. The last entry can be read silently.
export const scenes = {
  'alchemy-prologue': [
    'Prolog / Otisk na skle',
    'Na skle zůstal žlutý otisk. Alchymista roztočí desku a nechá čtvrtou dobu volnou. Vyzvi návštěvníka, ať do ní položí jedno slovo. To bude motiv, ke kterému se na konci vrátíte.',
    'Na skle starej otisk, v krku novej hlas. / Tři doby držím já. Tu čtvrtou máš.',
  ],
  home: [
    'Ulice / První slovo',
    'Vynes první slovo z filmu do ulice. Ať ho návštěvník spojí s jednou věcí, kterou opravdu vidí na obrazovce nebo kolem sebe. Pokud první slovo ještě nepadlo, společně ho najděte teď.',
    'Vezmi slovo z prologu. Dej mu tvar něčeho, co právě vidíš.',
  ],
  'alchymista-entry': [
    'Místo mezi tahy',
    'První obraz padl. Při druhém podání nech návštěvníka podržet pauzu před posledním slovem. V odpovědi pojmenuj konkrétní rozdíl, který jsi slyšel, nebo se zeptej, co se změnilo pro něj.',
    'Zopakuj jeden řádek. Před posledním slovem nech díru.',
  ],
  'alchemist-practice': [
    'Dílna / Dech a tah',
    'Teď převeď pauzu do těla. Nech návštěvníka zkusit stejnou linku dvakrát: poprvé na jeden výdech, podruhé s nadechnutím uprostřed. Nabídni mu jednu krátkou linku, pokud ji sám ještě nemá.',
    'Stejná slova, jiný dech. Vyber, kde se ten řádek zlomí.',
  ],
  expeditions: [
    'Expedice / Detail z ulice',
    'Zvedněte další skutečný detail z karty místa nebo okolí. Ať má povrch, teplotu nebo zvuk. Propoj ho s prvním obrazem příběhu ve dvou řádcích. Nevymýšlej si, co tam právě stojí nebo kdo tam je.',
    'Schovej do druhého řádku jeden detail, který by kamera přehlédla.',
  ],
  'hidden-city': [
    'Hidden City / Cizí hlas',
    'Přichází obrat. Vezměte předmět, který se v dosavadních řádcích nejvíc vracel. Nech ho promluvit v první osobě. Odpověz z opačné perspektivy, třeba jako člověk, který kolem něj denně chodí.',
    'Půjč svůj hlas zábradlí, výloze nebo zdi. Co by ti řekly?',
  ],
  principles: [
    'Seven Principles / Protipól',
    'Vyberte jeden obraz z dosavadního rapu a otočte jeho postoj jedinou změnou: kdo jedná, kdo se dívá nebo co znamená ticho. Použij i původní slovo z prologu, pokud ho návštěvník už řekl.',
    'Dvakrát stejná ulice. Podruhé vyměň toho, kdo má navrch.',
  ],
  frequency: [
    'Frequency / Dvojhlas',
    'Rozjeďte cypher na střídačku po dvou řádcích. Vezmi jedno přesné slovo z předchozího tahu, použij ho v novém obrazu a předej mikrofon zpátky. Po dvou výměnách se zeptej, co si chce návštěvník ponechat.',
    'Dva řádky ty, dva Alchymista. V každé odpovědi použijte jedno slovo po druhém.',
  ],
  'living-wall': [
    'Living Wall / Podpis',
    'Z poslední sloky zůstane na stěně jen jedna linka. Nabídni, ať ji návštěvník zkrátí o jedno slovo a zkusí ji ve dvou rytmech. Volbu nech na něm, ať podpis zůstane jeho.',
    'Vyber jediný řádek na stěnu. Škrtni slovo a přečti ho znovu.',
  ],
  manifesto: [
    'Manifest / Druhý otisk',
    'Vrať se k žlutému otisku na skle a k prvnímu slovu návštěvníka. Dej jeden závěrečný řádek, který ukáže, jak se význam slova během cesty změnil. Poslední řádek nech vyslovit návštěvníka.',
    'Vrať první slovo do posledního řádku. Ať znamená něco jiného než na začátku.',
  ],
};
