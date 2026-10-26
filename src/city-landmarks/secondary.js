/* Original illustrative place models, metres in a local X/Y ground plane, Z up.
 * These are landmark studies, never an architectural survey or an entrance pin.
 */
import * as THREE from 'three';
import {model,box,cylinder,cone,sphere,beam,gable,torus,windowGrid,feature,solid,arch,palette} from './helpers.js';

function curveBeams(g,name,points,r=.18,color='green'){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 return solid(g,name,new THREE.TubeGeometry(curve,Math.max(12,points.length*2),r,6,false),color,[0,0,0],false);
}
function archingSheet(g,name,width,depth,height,rise,color='gold',thickness=.6){
 const n=16,shape=new THREE.Shape();
 const top=x=>height+rise*Math.cos((x/width)*Math.PI);
 shape.moveTo(-width/2,top(-width/2));
 for(let i=1;i<=n;i++){const x=-width/2+width*i/n;shape.lineTo(x,top(x));}
 for(let i=n;i>=0;i--){const x=-width/2+width*i/n;shape.lineTo(x,top(x)-thickness);}
 shape.closePath();
 const geom=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});geom.rotateX(Math.PI/2);
 return solid(g,name,geom,color,[0,depth/2,0]);
}

function pereLachaise(){
 const g=model('pere-lachaise','Père-Lachaise / portail et mémoire');
 feature(g,'hemicycle-gateway');feature(g,'twin-stone-pylons');feature(g,'winged-hourglass');feature(g,'funerary-chapels');
 g.userData.phases=['threshold','pylon','curved-wall','gate-bar','hourglass','chapel'];
 box(g,'entry-stone-threshold',42,24,.55,0,5,0,'stone');
 // The two pylons frame an open gate; there is deliberately no cross on the gateway.
 for(const side of[-1,1]){
  const x=side*5.7;
  box(g,`pylon-plinth-${side}`,3.4,3.3,.8,x,-5,.55,'stone');
  box(g,`pylon-${side}`,2.7,2.7,6.4,x,-5,1.35,'bone');
  box(g,`pylon-cap-${side}`,3.4,3.4,.65,x,-5,7.75,'gold');
  box(g,`pylon-recess-${side}`,1.9,.15,3.7,x,-6.43,2.5,'roof');
  cone(g,`hourglass-upper-${side}`,.43,.57,x,-5,8.45,'stone',6);
  const hourglass=cone(g,`hourglass-lower-${side}`,.43,.57,x,-5,9.02,'stone',6);hourglass.rotation.x=Math.PI;
  beam(g,`hourglass-wing-${side}-l`,[x,-5,8.9],[x-1.25,-5,9.32],.17,'gold');
  beam(g,`hourglass-wing-${side}-r`,[x,-5,8.9],[x+1.25,-5,9.32],.17,'gold');
  // Side walls curve back in short faceted segments like the documented hemicycle.
  for(let i=0;i<4;i++){
   const a=(i/3)*.65,px=side*(8.5+i*3.2),py=-4.6+Math.sin(a)*5;
   const w=box(g,`curved-wall-${side}-${i}`,3.8,1.3,3.9,px,py,.55,'bone');w.rotation.z=-side*a;
   const coping=box(g,`coping-${side}-${i}`,4.1,1.55,.35,px,py,4.45,'gold');coping.rotation.z=-side*a;
  }
  cylinder(g,`end-pier-${side}`,1.25,5.6,side*19.4,-1.5,.55,'stone',6);
  cylinder(g,`brazier-bowl-${side}`,.95,.5,side*19.4,-1.5,6.2,'roof',8);
  cone(g,`brazier-flame-${side}`,.42,.95,side*19.4,-1.5,6.7,'gold',6);
 }
 for(let i=0;i<11;i++)beam(g,`gate-bar-${i}`,[-4.1+i*.82,-5,1],[-4.1+i*.82,-5,5.6],.085,'roof');
 beam(g,'gate-crossbar',[-4.3,-5,4.9],[4.3,-5,4.9],.12,'gold');
 for(const [i,x,y]of[[0,-11,7],[1,10,10],[2,-3,14]]){
  box(g,`chapel-body-${i}`,3.8,5.2,4.5,x,y,.55,'stone');
  gable(g,`chapel-pediment-${i}`,4.5,5.8,1.7,x,y,5.05,'roof');
  arch(g,`chapel-door-${i}`,1.3,3.2,.12,x,y-2.68,.55,'roof');
 }
 return g;
}

function republique(){
 const g=model('republique','Monument à la République / Marianne');
 feature(g,'stepped-stone-plinth');feature(g,'tall-pedestal');feature(g,'standing-marianne');feature(g,'raised-olive-branch');feature(g,'allegorical-base-figures');feature(g,'lion');
 g.userData.phases=['steps','pedestal','allegory','marianne','olive','lion','bronze-relief'];
 cylinder(g,'broad-steps',14.4,1.0,0,0,0,'stone',32);
 cylinder(g,'inner-steps',12.1,1.1,0,0,1,'bone',32);
 cylinder(g,'pedestal-foot',6.5,2.0,0,0,2.1,'stone',12);
 cylinder(g,'pedestal-drum',5.1,10.2,0,0,4.1,'bone',16);
 cylinder(g,'pedestal-upper-cornice',6.0,.8,0,0,14.3,'gold',16);
 cylinder(g,'pedestal-cap',4.6,.5,0,0,15.1,'stone',16);
 // A faceted figure, with an actual silhouette and limbs rather than a marker icon.
 cone(g,'marianne-draped-skirt',2.1,5.0,0,0,15.6,'green',9);
 cylinder(g,'marianne-torso',1.23,2.4,0,0,19.0,'green',8);
 sphere(g,'marianne-head',1.02,0,-.08,22.5,'green');
 cone(g,'marianne-phrygian-cap',1.05,1.0,.2,-.08,23.1,'green',7);
 beam(g,'raised-upper-arm',[.9,0,21.0],[2.2,-.1,22.3],.41,'green');
 beam(g,'raised-forearm',[2.2,-.1,22.3],[3.0,-.35,24.6],.30,'green');
 beam(g,'olive-stem',[3.0,-.35,24.5],[3.25,-.3,26.3],.075,'gold');
 for(let i=0;i<5;i++){
  const leaf=box(g,`olive-leaf-${i}`,.62,.22,.17,3.25+(i%2?-.25:.25),-.3,24.9+i*.28,'gold');leaf.rotation.y=i%2?.4:-.4;
 }
 beam(g,'left-arm',[ -.95,0,21],[-1.95,-.25,18.8],.36,'green');
 box(g,'declaration-tablet',1.3,.4,2.2,-1.9,-.35,18.3,'green').rotation.y=-.2;
 for(let i=0;i<3;i++){
  const a=i*Math.PI*2/3+.1,x=Math.sin(a)*6.2,y=Math.cos(a)*6.2;
  cone(g,`allegory-body-${i}`,1.35,2.7,x,y,2.9,'green',7);
  sphere(g,`allegory-head-${i}`,.54,x,y,5.65,'green');
  beam(g,`allegory-arm-${i}`,[x-.5,y,4.8],[x-1.3,y-.3,3.6],.23,'green');
 }
 // Twelve small relief panels in the circular lower register.
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,p=box(g,`bronze-relief-${i}`,2.6,.22,1.25,Math.sin(a)*9.2,Math.cos(a)*9.2,2.2,'green');p.rotation.z=-a;
 }
 box(g,'lion-body',3.5,1.45,1.2,0,-8.0,2.5,'green');
 sphere(g,'lion-mane',1.05,-1.6,-8.0,3.8,'green');
 sphere(g,'lion-face',.58,-2.0,-8.3,3.9,'green');
 for(const x of[-1.2,1.15])for(const y of[-8.6,-7.45])cylinder(g,`lion-leg-${x}-${y}`,.21,.9,x,y,2.1,'green',6);
 beam(g,'lion-tail',[1.7,-8,3.2],[2.8,-8.3,3.5],.14,'green');
 const figure=new THREE.Group();figure.name='marianne-height-register';g.add(figure);const figureParts=[];g.traverse(o=>{if(o.isMesh&&/^(marianne|raised|olive|left-arm|declaration-tablet)/.test(o.name))figureParts.push(o);});figureParts.forEach(o=>figure.add(o));figure.updateMatrixWorld(true);const register=new THREE.Box3().setFromObject(figure),k=9.5/(register.max.z-register.min.z);figure.scale.z=k;figure.position.z=15.5-register.min.z*k;g.userData.documentedDimensions={pedestalHeight:15.5,figureHeight:9.5};
 return g;
}

function abbesses(){
 const g=model('abbesses','Abbesses / édicule Guimard');
 feature(g,'open-metro-stairwell');feature(g,'curved-art-nouveau-columns');feature(g,'winged-glass-canopy');feature(g,'green-metal-railings');
 g.userData.phases=['stairwell','step','railing','guimard','winged-glass','canopy','sign'];
 box(g,'stairwell-stone-rim',10.8,15.2,.65,0,0,0,'stone');
 box(g,'open-stairwell-shadow',7.5,11.6,.14,0,-.4,.66,'ink');
 for(let i=0;i<8;i++)box(g,`visible-descending-step-${i}`,6.8,.86,.12,0,-4+i*.87,.8-i*.035,'stone');
 for(const side of[-1,1]){
  for(let i=0;i<10;i++)cylinder(g,`railing-upright-${side}-${i}`,.065,1.2,side*4.3,-6+i*1.35,.7,'green',5);
  beam(g,`railing-top-${side}`,[side*4.3,-6,1.9],[side*4.3,6.1,1.9],.095,'green');
  const p=side*3.4;
  curveBeams(g,`guimard-front-column-${side}`,[[p,-5.5,.65],[p*1.02,-5.5,2.7],[p*.96,-5.5,4.5],[p*.76,-5.5,5.3],[p*.52,-5.5,5.6]],.13,'green');
  curveBeams(g,`guimard-rear-column-${side}`,[[p,5.0,.65],[p,5,2.7],[p*.9,5,4.9],[p*.4,5,5.8]],.13,'green');
  sphere(g,`curved-support-cap-${side}`,.28,p,-5.5,4.7,'gold');
 }
 archingSheet(g,'winged-glass-roof',10.8,14.3,4.9,1.2,'glass',.2);
 for(let i=0;i<8;i++){
  const y=-7.15+i*2.04,pts=[];
  for(let k=0;k<=10;k++){const x=-5.4+k*1.08;pts.push([x,y,5.0+1.2*Math.cos(x/10.8*Math.PI)]);}
  curveBeams(g,`canopy-arched-rib-${i}`,pts,.07,'gold');
 }
 beam(g,'front-canopy-edge',[-5.4,-7.15,5.0],[5.4,-7.15,5.0],.10,'green');
 box(g,'metro-sign-panel',5.7,.18,.8,0,-6.25,3.8,'bone');
 // Letter-free fretted geometry keeps all interface type in HTML.
 for(let i=0;i<7;i++)box(g,`sign-fret-${i}`,.18,.22,.45,-2.2+i*.72,-6.37,3.95,'green');
 return g;
}

function oberkampf(){
 const g=model('mur-oberkampf','Le M.U.R. / panneau éphémère');
 feature(g,'eight-by-three-panel');feature(g,'corner-building-context');feature(g,'original-abstract-wall-study');
 g.userData.phases=['pavement','corner-building','upper-window','panel','own-geometric-art','crimson'];
 box(g,'corner-building',14,9,13.8,0,3,0,'bone');
 box(g,'slate-roof-cap',14.4,9.4,.7,0,3,13.8,'roof');
 box(g,'dark-street-art-recess',8.5,.28,3.5,0,-1.72,2.8,'ink');
 box(g,'art-panel-border',8.2,.06,3.2,0,-1.9,2.95,'gold');
 box(g,'art-panel-black-ground',7.85,.08,2.9,0,-1.96,3.10,'ink');
 // Original graphic study, explicitly not a reproduction of the wall's changing art.
 for(let i=0;i<7;i++){
  const p=box(g,`own-geometric-art-${i}`,.5,.10,1.9,-3+i,-2.04,3.6,'gold');p.rotation.y=(i%2?1:-1)*.35;
 }
 box(g,'own-art-crimson-accent',.8,.13,.22,2.1,-2.10,4.6,'crimson');
 windowGrid(g,'upper-windows',{columns:4,rows:2,width:1.7,height:2.3,x:0,y:-1.58,z:7.4,gapX:3.0,gapZ:3.0});
 for(const x of[-5.4,-2.4,.6,3.6])box(g,`window-sill-${x}`,2.0,.5,.17,x,-1.7,7.3,'gold');
 box(g,'side-door',1.8,.24,2.7,5.45,-1.64,0,'green');
 box(g,'wall-pavement',18,4,.35,0,-3.7,0,'stone');
 return g;
}

function laPlace(){
 const g=model('la-place','La Place / contexte de la Canopée');
 feature(g,'broad-undulating-glass-canopy');feature(g,'golden-structural-ribs');feature(g,'two-side-wings');feature(g,'open-plaza-under-canopy');
 g.userData.phases=['plaza','wing','tree-support','branch','curved-golden','structural-rib','context'];
 box(g,'plaza-terrace',125,83,.7,0,0,0,'stone');
 for(const side of[-1,1]){
  box(g,`side-wing-${side}`,20,80,11,side*51,0,.7,'bone');
  box(g,`side-wing-glazing-${side}`,20.3,74,7.4,side*51,-.4,2,'glass');
  for(let i=0;i<9;i++)box(g,`wing-mullion-${side}-${i}`,20.7,.40,8,side*51,-34+i*8.4,1.7,'gold');
 }
 // A segmented curved glass surface produces a visible swept roof in perspective.
 const roof=archingSheet(g,'curved-golden-glass-cover',131,83,13.0,7.2,'gold',.85);
 roof.userData.context='Canopée roof above La Place; not the internal venue footprint';
 for(let i=0;i<12;i++){
  const y=-41.5+i*(83/11),pts=[];
  for(let k=0;k<=16;k++){const x=-65.5+k*(131/16);pts.push([x,y,13.9+7.2*Math.cos(x/131*Math.PI)]);}
  curveBeams(g,`curved-structural-rib-${i}`,pts,.30,'roof');
 }
 for(const x of[-39,39])for(const y of[-31,0,31]){
  beam(g,`canopy-tree-support-${x}-${y}`,[x,y,0.7],[x*.94,y,14.0],.65,'bone');
  beam(g,`branch-support-${x}-${y}`,[x*.96,y,10.2],[x*.82,y,17.4],.35,'bone');
 }
 box(g,'central-open-court-shadow',47,40,.1,0,-1,.71,'roof');
 box(g,'venue-front-context',20,.4,5.2,-43,-39.8,2,'green');
 return g;
}

function centquatre(){
 const g=model('centquatre','CENTQUATRE / halles de création');
 feature(g,'paired-industrial-halls');feature(g,'pitched-glazed-roofs');feature(g,'repeated-metal-trusses');feature(g,'arched-entry-front');
 g.userData.phases=['courtyard','hall','entry','arcade','pitched-roof','roof-frame','front-window'];
 box(g,'stone-courtyard-base',76,108,.7,0,0,0,'stone');
 for(const side of[-1,1]){
  const x=side*20;
  box(g,`industrial-hall-${side}`,30,93,11.5,x,1,.7,'bone');
  gable(g,`glazed-pitched-roof-${side}`,31.5,95,8.1,x,1,12.2,'glass');
  gable(g,`front-roof-end-${side}`,31.8,.6,8.3,x,-46.7,12.2,'bone');
  for(let i=0;i<9;i++){
   const y=-45+i*11.5;
   beam(g,`roof-frame-left-${side}-${i}`,[x-15.7,y,12.5],[x,y,20.5],.18,'gold');
   beam(g,`roof-frame-right-${side}-${i}`,[x,y,20.5],[x+15.7,y,12.5],.18,'gold');
   box(g,`pilaster-${side}-${i}`,1.1,1.2,11.7,x+side*15.2,y,.7,'gold');
  }
  arch(g,`large-front-entry-${side}`,12.5,10.1,.18,x,-45.65,.7,'roof');
  windowGrid(g,`hall-front-windows-${side}`,{columns:3,rows:1,width:3.2,height:3.6,x,y:-45.82,z:6.0,gapX:7.8});
 }
 box(g,'entry-linking-wing',68,9,7.5,0,-48,.7,'bone');
 arch(g,'central-passage',8.5,6.7,.24,0,-52.65,.7,'roof');
 for(const x of[-27,-17,17,27])arch(g,`front-arcade-${x}`,5.2,5.5,.2,x,-52.65,.7,'glass');
 box(g,'entry-cornice',70,10,.65,0,-48,8.2,'gold');
 return g;
}

function philharmonie(){
 const g=model('philharmonie','Philharmonie / paysage minéral');
 feature(g,'faceted-mineral-hill');feature(g,'central-hall-mass');feature(g,'sweeping-aluminium-ribbons');feature(g,'bird-like-facade-tessellation');
 g.userData.phases=['mineral-base','landscape','angular-central','secondary','aluminium-band','bird-fold'];
 box(g,'mineral-base',104,100,2.0,0,0,0,'roof');
 const core=new THREE.IcosahedronGeometry(1,0);core.scale(45,43,25);core.translate(0,0,27);
 solid(g,'angular-central-volume',core,'bone');
 const flank=new THREE.DodecahedronGeometry(1,0);flank.scale(35,28,11);flank.rotateZ(.28);flank.translate(-20,-17,12);
 solid(g,'sloping-public-roof-landscape',flank,'stone');
 const far=new THREE.IcosahedronGeometry(1,0);far.scale(27,34,17);far.translate(25,12,19);
 solid(g,'folded-secondary-mass',far,'roof');
 // Faceted curved bands turn around the actual 3D volume, not flat screen sprites.
 for(let band=0;band<3;band++){
  const points=[];
  for(let i=0;i<=18;i++){
   const a=-Math.PI*.90+i*(Math.PI*1.7/18);
   points.push(new THREE.Vector3(Math.cos(a)*(46-band*4),Math.sin(a)*(43-band*3),13+band*10+Math.sin(a*.9)*5));
  }
  const curve=new THREE.CatmullRomCurve3(points);
  const geom=new THREE.TubeGeometry(curve,36,1.35,4,false);
  solid(g,`sweeping-aluminium-band-${band}`,geom,band===1?'gold':'bone');
 }
 // A sparse original bird-like fold pattern denotes the documented cladding motif.
 for(let row=0;row<3;row++)for(let col=0;col<5;col++){
  const x=-25+col*11,z=12+row*7,y=-36+Math.abs(x)*.10;
  const left=box(g,`bird-fold-left-${row}-${col}`,3.9,.55,.52,x-1.5,y,z,'gold');left.rotation.y=.23;
  const right=box(g,`bird-fold-right-${row}-${col}`,3.9,.55,.52,x+1.5,y,z,'gold');right.rotation.y=-.23;
 }
 g.updateMatrixWorld(true);const envelope=new THREE.Box3().setFromObject(g);g.scale.z=52/envelope.max.z;g.userData.documentedDimensions={height:52};
 return g;
}

function shakespeare(){
 const g=model('shakespeare-company','Shakespeare and Company / librairie');
 feature(g,'old-masonry-shop-front');feature(g,'three-shopfront-bays');feature(g,'green-awnings');feature(g,'street-book-displays');
 g.userData.phases=['pavement','masonry','slate-roof','shop-window','awning','sign-band','book'];
 box(g,'old-masonry-building',15.0,13.5,17.0,0,2.5,0,'bone');
 gable(g,'pitched-slate-roof',15.8,14.2,4.7,0,2.5,17,'roof');
 box(g,'shop-green-frontage',14.8,.32,4.6,0,-4.44,0,'green');
 for(const x of[-4.8,0,4.8]){
  box(g,`street-shop-window-${x}`,3.5,.18,3.2,x,-4.65,.45,'glass');
  box(g,`green-window-sill-${x}`,3.8,.35,.22,x,-4.77,.35,'gold');
  const awning=box(g,`green-awning-${x}`,4.2,2.15,.20,x,-5.45,4.6,'green');awning.rotation.x=-.12;
  box(g,`awning-edge-${x}`,4.2,.18,.52,x,-6.45,4.15,'gold');
 }
 box(g,'doorway',1.3,.20,3.8,0,-4.80,0,'roof');
 windowGrid(g,'upper-masonry-windows',{columns:3,rows:2,width:2.05,height:3.2,x:0,y:-4.37,z:6.4,gapX:4.7,gapZ:5.1});
 for(const x of[-4.7,0,4.7])for(const z of[6.25,11.35])box(g,`white-sill-${x}-${z}`,2.4,.6,.22,x,-4.47,z,'stone');
 box(g,'bookshop-sign-band',14.5,.28,.72,0,-4.69,5.00,'gold');
 for(const x of[-5.1,5.1]){
  box(g,`book-display-crate-${x}`,2.8,1.25,1.25,x,-6.1,0,'green');
  for(let i=0;i<7;i++){
   const book=box(g,`outdoor-book-${x}-${i}`,.25,.85,.55,x-1+i*.32,-6.1,1.25,i%3===0?'crimson':i%2?'bone':'gold');book.rotation.y=(i%2?.08:-.08);
  }
 }
 box(g,'shop-pavement',18,5,.22,0,-6.3,0,'stone');
 return g;
}

export const secondaryBuilders={
 'pere-lachaise':pereLachaise,
 republique,
 abbesses,
 'mur-oberkampf':oberkampf,
 'la-place':laPlace,
 centquatre,
 philharmonie,
 'shakespeare-company':shakespeare
};
