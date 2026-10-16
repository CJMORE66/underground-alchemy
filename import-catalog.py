from pathlib import Path
from html.parser import HTMLParser
import json,re,urllib.request,concurrent.futures,datetime
p=Path('/workspace/sites/caisik-underground-alchemy');out=p/'dist';assets=out/'assets'/'catalog';assets.mkdir(exist_ok=True)
class Cards(HTMLParser):
 def __init__(self):super().__init__();self.current=None;self.cards=[];self.depth=0
 def handle_starttag(self,t,attrs):
  d=dict(attrs)
  if t=='a'and'/products/'in d.get('href',''):
   self.current={'url':'https://hiphop.caisik.i234.me'+d['href'],'parts':[]};self.depth=1
  elif self.current:
   if t=='a':self.depth+=1
   if t=='img'and'src'in d:self.current.setdefault('image',d['src'])
 def handle_endtag(self,t):
  if t=='a'and self.current:
   self.depth-=1
   if self.depth==0:
    parts=self.current.pop('parts');self.current['name']=' '.join(x for x in parts if not x.startswith('€'));self.current['priceLabel']=next((x for x in parts if x.startswith('€')),None)
    if self.current.get('image')and self.current['priceLabel']:self.cards.append(self.current)
    self.current=None
 def handle_data(self,s):
  if self.current and s.strip():self.current['parts'].append(s.strip())
cards=[]
for f in ['hiphop-store.html','hiphop-store-2.html']:
 c=Cards();c.feed((Path('/workspace/scratch/50ee39693d80')/f).read_text());cards+=c.cards
cards=list({c['url']:c for c in cards}.values())
class Scripts(HTMLParser):
 def __init__(self):super().__init__();self.ins=False;self.scripts=[]
 def handle_starttag(self,t,a):
  if t=='script':self.ins=True
 def handle_endtag(self,t):
  if t=='script':self.ins=False
 def handle_data(self,s):
  if self.ins:self.scripts.append(s)
def fetch(url):
 with urllib.request.urlopen(url,timeout=22)as r:return r.read()
def details(c):
 try:
  raw=fetch(c['url']).decode();s=Scripts();s.feed(raw);stream=''
  for text in s.scripts:
   marker='self.__next_f.push('
   if marker in text:
    try:
     a,_=json.JSONDecoder().raw_decode(text.split(marker,1)[1]);stream+=a[1] if len(a)>1 and isinstance(a[1],str)else''
    except (ValueError,TypeError):pass
  for match in re.finditer(r'"product":\s*\{',stream):
   try:
    product,_=json.JSONDecoder().raw_decode(stream[match.end()-1:])
    if product.get('handle')==c['url'].split('/')[-1]:
     c['productId']=product['id'];c['description']=product.get('description');c['images']=list(dict.fromkeys(x['url']for x in product.get('images',[])if x.get('url')));c['options']=[{'title':o['title'],'values':[v['value']for v in o.get('values',[])]}for o in product.get('options',[])];c['variants']=[{'sku':v.get('sku'),'title':v.get('title'),'options':[{ 'title':o.get('option',{}).get('title'),'value':o.get('value')}for o in v.get('options',[])]}for v in product.get('variants',[])];break
   except (ValueError,KeyError,TypeError):continue
  c['detailVerified']=bool(c.get('productId'))
 except Exception as e:c['detailVerified']=False;c['detailError']=type(e).__name__
 try:
  img=fetch(c['image']);f=assets/(c['url'].split('/')[-1]+'.png');f.write_bytes(img);c['localImage']='/assets/catalog/'+f.name
 except Exception:c['localImage']=c['image']
 name=c['name'].lower();c['category']='hoodies'if any(w in name for w in ['hoodie','sweatshirt'])else'accessories'if any(w in name for w in ['cap','hat','case'])else'tees';c['currency']='EUR';c['checkedAt']='2026-10-16';print(c['name'],c['detailVerified'],flush=True);return c
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as e:cards=list(e.map(details,cards))
result={'source':'https://hiphop.caisik.i234.me/dk/store?page=1','sourcePages':[1,2],'checkedAt':'2026-10-16','regionPath':'dk','currency':'EUR','mode':'verified-public-snapshot','checkoutVerified':False,'products':cards}
(out/'catalog.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('IMPORTED',len(cards),'DETAILS',sum(c['detailVerified']for c in cards),flush=True)
