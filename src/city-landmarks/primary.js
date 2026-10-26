import * as THREE from 'three';
import {model,box,cylinder,cone,beam,gable,torus,solid,pointedWindow,feature} from './helpers.js';

function rose(g,name,r,x,y,z){const disk=new THREE.CircleGeometry(r,24);disk.rotateX(Math.PI/2);solid(g,`${name}-glass`,disk,'glass',[x,y,z],false);torus(g,`${name}-outer`,r,.45,x,y-.1,z,'ink');torus(g,`${name}-inner`,r*.75,.23,x,y-.2,z,'gold');for(let i=0;i<12;i++){const a=i*Math.PI/6;beam(g,`${name}-tracery-${i}`,[x,y-.3,z],[x+Math.cos(a)*r*.82,y-.3,z+Math.sin(a)*r*.82],.11,'gold');}}
function tower(g,name,x,y,width=12,depth=13,height=69){
 box(g,`${name}-base`,width,depth,41,x,y,0,'bone');
 box(g,`${name}-cornice`,width+1,depth+1,1.3,x,y,40.5,'gold');
 for(const dx of[-1,1])for(const dy of[-1,1])box(g,`${name}-open-bell-pier`,1.8,1.8,height-43,x+dx*(width/2-.9),y+dy*(depth/2-.9),42,'bone');
 for(const dy of[-1,1]){box(g,`${name}-bell-mullion`,1,1,height-46,x,y+dy*(depth/2-.7),43,'bone');for(const dx of[-1,1])pointedWindow(g,`${name}-lower-lancet`,2.3,8,x+dx*2.6,y+dy*(depth/2+.12),28,'glass');}
 box(g,`${name}-top-ledge`,width+1.4,depth+1.4,1.4,x,y,height-1.4,'gold');
 for(const dx of[-1,1])for(const dy of[-1,1])box(g,`${name}-parapet-corner`,1.1,1.1,2.4,x+dx*width/2,y+dy*depth/2,height,'bone');
}
function notreDame(){const g=model('notre-dame','Notre-Dame — silhouette gothique');
 box(g,'stone-plinth',49,132,1,0,0,0,'stone');
 box(g,'aisle-body',39,99,23,0,3,1,'bone');box(g,'nave-high-walls',17,99,12,0,3,24,'bone');
 gable(g,'nave-pitched-roof',19,101,13,0,3,36,'roof');
 box(g,'transept-body',55,17,31,0,13,1,'bone');const roof=gable(g,'transept-roof',19,57,12,0,13,32,'roof');roof.rotation.z=Math.PI/2;
 cylinder(g,'apse-polygon',17,26,0,48,1,'bone',10);cone(g,'apse-roof',18,15,0,48,27,'roof',10);
 box(g,'western-facade',43,7,41,0,-49,1,'bone');
 tower(g,'north-tower',-15,-46,12,14,69);tower(g,'south-tower',15,-46,12,14,69);
 for(let i=-1;i<=1;i++){pointedWindow(g,`portal-${i+1}`,8.5,13,i*12,-52.72,1,'ink');pointedWindow(g,`portal-inner-${i+1}`,5.8,10.2,i*12,-52.9,1,'glass');}
 box(g,'gallery-kings',41,.8,2.4,0,-53,19,'gold');for(let i=0;i<14;i++)box(g,`gallery-small-pier-${i}`, .55,.9,3.2,-19+i*2.9,-53.1,19,'bone');
 rose(g,'western-rose',5.1,0,-53.25,30);
 for(let i=0;i<8;i++){const y=-31+i*10.5;for(const side of[-1,1]){
  box(g,`buttress-outer-${side}-${i}`,2.4,2.4,19,side*23,y,1,'bone');cone(g,`buttress-pinnacle-${side}-${i}`,1.65,7,side*23,y,20,'gold',4);
  const path=new THREE.QuadraticBezierCurve3(new THREE.Vector3(side*22,y,19),new THREE.Vector3(side*18,y,33),new THREE.Vector3(side*9,y,32));
  solid(g,`flying-buttress-${side}-${i}`,new THREE.TubeGeometry(path,8,.7,4,false),'bone');
 }}
 for(let i=0;i<8;i++){const y=-31+i*10.5;for(const side of[-1,1]){const w=pointedWindow(g,`nave-clerestory-${side}-${i}`,3,8.5,0,0,0,'glass');w.rotation.z=Math.PI/2;w.position.set(side*9.05,y,25);}}
 cylinder(g,'crossing-spire-base',4,7,0,13,43,'bone',8);cone(g,'crossing-spire',3.9,42,0,13,50,'gold',8);beam(g,'spire-cross-vertical',[0,13,91],[0,13,96],.18,'ink');beam(g,'spire-cross-horizontal',[-1.5,13,94],[1.5,13,94],.16,'ink');
 feature(g,'three-portals');feature(g,'twin-open-bell-towers');feature(g,'western-rose');feature(g,'latin-cross-nave-and-transept');feature(g,'flying-buttresses');feature(g,'crossing-spire');return g;}

function sainteChapelle(){const g=model('sainte-chapelle','Sainte-Chapelle — glass and stone');
 box(g,'lower-chapel',17,48,9,0,0,1,'bone');box(g,'upper-glass-hall',16,47,17,0,0,10,'glass');gable(g,'steep-slate-roof',18,49,13,0,0,27,'roof');
 for(let side of[-1,1])for(let i=0;i<7;i++){const y=-19+i*6.1;box(g,`upper-buttress-${side}-${i}`,1.2,1.2,27,side*8.5,y,1,'bone');cone(g,`finial-${side}-${i}`,1,5,side*8.5,y,28,'gold',4);for(let j=0;j<3;j++)box(g,`lancet-stone-${side}-${i}-${j}`,.28,4.9,.28,side*8.63,y,12+j*5,'gold');}
 box(g,'western-entrance',18,2.2,26,0,-24,1,'bone');pointedWindow(g,'lower-portal',6.4,9.2,0,-25.2,1,'ink');rose(g,'western-rose',5.4,0,-25.3,20.2);
 for(const side of[-1,1]){cylinder(g,'western-stair-turret',1.8,30,side*9,-23,1,'bone',8);cone(g,'western-turret-spire',2,8,side*9,-23,31,'gold',6);}
 cylinder(g,'central-spire-base',1.8,8,0,3,35,'bone',8);cone(g,'central-spire',1.7,28,0,3,43,'gold',8);
 feature(g,'lower-and-upper-chapels');feature(g,'fifteen-window-composition');feature(g,'western-rose');feature(g,'slender-spire');return g;}

function flamel(){const g=model('flamel-house','Maison de Nicolas Flamel — street facade');
 box(g,'house-main',12,15,13.5,0,0,0,'bone');gable(g,'pitched-roof',13,16,5.5,0,0,13.5,'roof');
 box(g,'stone-ground-floor',12.4,1,4.3,0,-7.8,0,'stone');
 for(let x of[-3.7,0,3.7]){pointedWindow(g,'ground-arch',2.9,3.2,x,-8.35,.1,'ink');box(g,'stone-lintel',3.4,.4,.42,x,-8.6,3.35,'gold');for(let z of[5.3,9]){box(g,'facade-window',2.2,.28,2.7,x,-7.7,z,'glass');box(g,'window-sill',2.7,.5,.25,x,-7.8,z-.2,'gold');}}
 for(let x of[-5.7,-1.9,1.9,5.7])box(g,'vertical-stone-grid',.23,.3,9,x,-7.78,4.1,'stone');
 box(g,'inscribed-stone-band',12,.3,.7,0,-8.4,4.2,'gold');for(let i=0;i<16;i++)box(g,'abstract-inscription-mark',.22,.06,.28,-5.5+i*.72,-8.6,4.37,'ink');
 box(g,'chimney',1.1,1.6,3.2,3,2,17,'bone');
 feature(g,'three-bay-stone-facade');feature(g,'three-ground-arches');feature(g,'inscribed-lintel-band');feature(g,'pitched-street-roof');return g;}

function saintSulpice(){const g=model('saint-sulpice','Saint-Sulpice — classical facade');
 box(g,'church-body',47,98,25,0,7,1,'bone');box(g,'nave-high-body',20,104,11,0,7,26,'stone');gable(g,'nave-roof',23,106,9,0,7,37,'roof');box(g,'transept',63,20,30,0,15,1,'bone');
 box(g,'western-wall',58,7,29,0,-45,1,'stone');
 for(let level=0;level<2;level++){for(let i=0;i<12;i++)cylinder(g,`classical-column-${level}-${i}`, .75,11,-25.3+i*4.6,-50,2+level*14,'bone',10);box(g,`colonnade-entablature-${level}`,60,4,1.7,0,-50,13.5+level*14,'gold');}
 for(let x of[-20,0,20]){box(g,'classical-entry-door',5,.4,9,x,-49.3,1,'ink');}
 for(const side of[-1,1]){const x=side*23,h=side===-1?73:68;box(g,`tower-${side}-base`,12,13,17,x,-44,29,'bone');cylinder(g,`tower-${side}-upper`,6.1,h-47,x,-44,46,'bone',side===-1?16:8);for(let i=0;i<4;i++){const angle=i*Math.PI/2;box(g,`tower-${side}-bell-slot`,2.4,.25,10,x+Math.sin(angle)*5.9,-44+Math.cos(angle)*5.9,50,'ink');}cylinder(g,`tower-${side}-cornice`,6.8,1.5,x,-44,h-1.5,'gold',16);cone(g,`tower-${side}-cap`,5.8,3,x,-44,h,'roof',16);}
 feature(g,'two-unequal-classical-towers');feature(g,'two-storey-colonnade');feature(g,'long-basilica-body');feature(g,'classical-three-entrance-facade');return g;}

export const primaryBuilders={'notre-dame':notreDame,'sainte-chapelle':sainteChapelle,'flamel-house':flamel,'saint-sulpice':saintSulpice};
