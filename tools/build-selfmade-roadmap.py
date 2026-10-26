"""Publish the source-audited feature plan without pretending every request is done."""
from pathlib import Path
from html import escape
from collections import Counter
import json
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'docs/selfmade/coverage.json').read_text())
features=data['features']; counts=Counter(f['status'] for f in features)
labels={'implemented':'Funkční v uvedeném rozsahu','partial':'Částečně hotovo','planned':'Další vývoj','external':'Chybí skutečné externí podklady'}
rows=''
for f in features:
    details=f.get('limitations') or f.get('reason') or f.get('note') or f.get('scope') or ''
    if isinstance(details,list): details='; '.join(details)
    evidence=f.get('evidence') or []
    if isinstance(evidence,str):evidence=[evidence]
    rows+=f'<article><p class="eyebrow">{escape(f["id"])} / {escape(labels[f["status"]])}</p><h3>{escape(f["title"])}</h3><p>{escape(f["request"])}</p><p class="scope">{escape(str(details))}</p><small>Zdrojová evidence: {escape(", ".join(evidence))}</small></article>'
html='''<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#080808"><title>200 kroků vlastního světa / CAISIK</title><link rel="stylesheet" href="/fonts-v7.css"><link rel="stylesheet" href="/play/play.css"><style>main{max-width:1050px;padding:70px 6vw;margin:auto}h1{font:800 clamp(60px,12vw,130px)/.9 'Barlow Condensed',sans-serif;margin:40px 0;color:#ffd600}article{padding:30px 0;border-top:1px solid #49432a}article h3{font-size:30px;margin-bottom:15px}article p{font-size:14px;margin:15px 0}.scope{color:#b4b1a8}small{font-size:10px;color:#8d8b83;overflow-wrap:anywhere}.counts{display:flex;flex-wrap:wrap;gap:20px;padding:25px 0;margin:25px 0;border-block:1px solid #49432a}.counts b{color:#ffd600;font-size:30px}.intro{max-width:750px;color:#b4b1a8;margin-bottom:40px}a{color:#ffd600}.eyebrow{font-size:10px}</style></head><body><main><a href="/play/">↖ SELFMADE</a><p class="eyebrow" style="margin-top:40px">KONKRÉTNÍ PLÁN / 200 POŽADAVKŮ</p><h1>BUILD YOUR<br>OWN WORLD.</h1><p class="intro">Hrdinou jsi ty. Níže je skutečný stav požadovaných funkcí po této úpravě. Funkční body zahrnují i zachované dřívější nástroje. Částečný bod není dokončený. Počet bodů není hodnocení tvojí tvorby.</p><div class="counts">'''+''.join(f'<span><b>{counts[key]}</b><br>{labels[key]}</span>' for key in labels)+'''</div><p class="intro">Originální malby zůstávají zachované. Animovaná konstrukční vrstva není rekonstruování každého malovaného detailu. Veřejná komunita, odborné ukázky, licence a skutečné spolupráce potřebují vlastní podklady a integrace.</p>'''+rows+'''<a href="/play/">Zpět do vlastního světa ↗</a></main></body></html>'''
out=ROOT/'dist/play/roadmap/index.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html)
print('Published roadmap:',dict(counts))
