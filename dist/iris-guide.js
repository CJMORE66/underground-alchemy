/* Original articulated CAISIK street alchemist. Local limb space points down from each joint. */
(() => {
  'use strict';
  const dark = '#16130c', ink = '#090805', ochre = '#cd8e23', gold = '#f2b82e';
  const paper = '#ffdc7f', slate = '#3b3327', mint = '#ffd600';
  const path = (d, fill, stroke = 'none', width = 1) =>
    '<path d="' + d + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + width + '"/>';
  const line = (d, color = paper, width = 1) => path(d, 'none', color, width);
  const circle = (x, y, r, fill, stroke = 'none', width = 1) =>
    '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + width + '"/>';
  const g = (joint, inside) => '<g data-joint="' + joint + '">' + inside + '</g>';
  const at = (x,y,inside) => '<g transform="translate(' + x + ' ' + y + ')">' + inside + '</g>';
  const goldEdge = '#71521e';

  const sleeve = path('M-5-4Q1-7 6-2L7 6 4 10 7 17 3 20-5 19-6 13-7 8Z', gold, ink, 1.6)
    + path('M-5 1 5 4 6 8-2 6 4 10 5 14-5 11Z', dark)
    + path('M-6 12 2 15 5 14 6 17 0 19-4 17Z', ochre)
    + line('M-4 0 1-2 5 0M-5 11 0 13M-2 18 2 17', paper, .75);
  const lowerSleeve = path('M-5-2 4-3 6 2 4 8 4 12 3 17-3 17-5 13-4 10-6 4Z', dark, ink, 1.3)
    + path('M-5-1 4-2 5 2-1 3-4 9-5 7Z', ochre)
    + line('M-4 12 2 10 0 13M-4 15 3 14M-4 17 3 16', gold, 1.1);
  const glove = path('M-3-1 2-2 4 0 4 3 1 5-2 5-4 2Z', '#9a6136', ink, 1)
    + line('M-2 1 1 0M0 3 3 2', '#e1a66b', .65);

  const pants = path('M-6-4Q0-6 6-2L8 3 6 10 7 16 4 24 0 28-6 26-7 20-9 15-6 8Z', dark, ink, 1.65)
    + path('M3-2 7 2 5 9-3 17-7 21-7 15 0 8Z', ochre)
    + path('M5 8 3 16-4 23 2 22-1 26-6 24-4 20Z', gold)
    + line('M-6 1-3 7-5 11M-5 16 0 11M1 24 4 22', '#816b47', .8);
  const shin = path('M-6-2 3-3 6 1 5 8 3 14 4 19 1 23-5 21-7 15-5 9-7 4Z', dark, ink, 1.4)
    + path('M-7 0 1-2 5 0 4 4-2 4-6 7-4 3Z', gold)
    + path('M-7 14 1 9 4 9 0 15 4 14 3 18-3 20Z', ochre)
    + line('M-4 4 1 2M-5 17-1 16M-4 20 2 19', paper, .8);
  const boot = path('M-5-3 2-4 4-1 7 2 11 3Q14 5 11 7L-5 7-7 5-5 1Z', dark, ink, 1.4)
    + path('M-6 4Q2 5 12 4L12 6Q7 8-6 6Z', gold)
    + line('M-3-2 3-2M-2 0 4-1M0 2 6 1M3 3 8 2', ochre, 1.1);
  const coat = path('M-6-39Q2-42 8-37L12-33 14-25 10-17 10-9 13 2 8 6 0 4-8 5-15 3-13-9-15-18-14-27-10-33Z', dark, ink, 1.9)
    + path('M-12-30-6-35-5-30-10-22-8-9-14-3-12-18Z', '#4c3b1f')
    + path('M7-36 13-31 14-27 9-29 4-22Z', slate)
    + path('M-14-2-6-4 0-1 8-3 12-1 13 3 6 2-1 3-9 2-14 4Z', gold)
    + path('M-8-34-4-36-1-27-6-18-6-25-10-22Z', '#5e4b24')
    + line('M-13-27-9-31M6-34 0-23-1-10-2 1M-10-12-7-9-11-6M4-11 8-13 8-11 4-8M8-5 10-5', ochre, .95)
    + line('M-2-35Q-3-28 4-23L9-33', '#e8ac4d', 1.35)
    + path('M4-24 8-18 1-18Z', gold, ink, .65)
    + line('M4-22 6-19 3-19Z', dark, .75)
    + circle(-4,-14,.7,gold) + circle(-3,-7,.7,gold);

  const hood = path('M-10-3Q-12-7-10-13L-8-20-1-28 4-29 10-22 14-14 16-7 12-5 10-1 4 4-4 3-7-2-14 0Z', gold, ink, 1.5)
    + path('M-10-7-7-16 1-26 3-26-1-16-5-9 2-13 9-12 14-8 16-6 8-9-1-5-7 0-12 0Z', ochre)
    + path('M-7-3Q-2-13 7-11L13-7 11-2 6 4-1 2-4-2Z', ink)
    + path('M-5-3 1-8 8-10 11-8 5-8 0-5Z', '#504331')
    + path('M1-4 8-6 12-4 8 1 5 3 1 0Z', '#302a20')
    + line('M2-2 8-4M3 0 7-1', '#75674d', .65)
    + line('M-9-10-5-17 0-22M4-26 9-18 10-15M-8-2-3-7', paper, 1)
    + line('M4-6 6-6.8M9-7 10-7.2', mint, .9)
    + line('M-6 0-6 6M8 1 6 6', ochre, .85);

  // Tools are mounted at the wrist. Counter-rotation keeps their working face level.
  const lantern = line('M-1 0Q-6 0-5 7M1 0Q5 0 5 7', ochre, 1.4)
    + path('M-6 7 5 7 7 17 4 21-5 21-8 17Z', '#392f22', gold, 1.2)
    + path('M-1 10 3 14 1 18-3 16Z', mint) + line('M-8 17 6 17M-5 20 4 20', ochre);
  const marker = path('M-2 3-3-1 5-8 8-8 9-6 3 0Z', paper, ink, 1.1)
    + path('M5-8 8-10 10-9 9-6Z', '#fba515') + line('M0 0 5-5', ochre, 1.2);
  const mike = path('M-2 3-4 1 2-9 5-7Z', slate, ink, 1)
    + '<g transform="rotate(30 5 -9)">' + path('M1-9Q0-15 5-15Q10-15 9-9L8-7H2Z', '#927343', ink, 1.2)
    + line('M2-12 8-12M2-10 8-10', '#fff0bd', .7) + '</g>';
  const book = path('M-17-7Q-9-8-2-3Q6-7 17-9L15 2Q5 3-2 6Q-8 3-16 2Z', '#bc944f', dark, 1.5)
    + path('M-16-9Q-8-9-2-5Q7-9 17-11L15-1Q4 0-2 4Q-9 1-16 0Z', '#e0c587', ink, 1)
    + line('M-2-4-2 3M-13-6-6-4M-12-3-6-1M3-4 12-7M3-1 10-3', '#705a37', .8);
  const map = path('M-16-11-6-8 2-12 16-9 13 5 3 3-7 7-18 4Z', '#e3ce92', ink, 1.2)
    + line('M-6-7-8 6M2-11 3 2', '#a38650', .8)
    + line('M-13 0-8-4-3-2 3-7 10-5', '#91690f', 1.6) + circle(10,-5,1.5,'#ad573b');
  const fork = line('M0 2 0-12M0-12Q-5-12-5-17V-23M0-12Q5-12 5-17V-23', paper, 2.3);
  const lens = line('M0 1 6-8', ochre, 3) + circle(11,-13,7.6,'#634a14',gold,1.6)
    + line('M7-13Q8-18 13-17', mint, .9);
  const stamp = path('M-2 0-2-5Q-4-8 0-9Q4-8 2-5L2 0 5 2 6 5H-6L-5 2Z', ochre, ink, 1);
  const compass = circle(0,0,6.8,ink,gold,1.5) + path('M-3 3 1-5 3-3Z', mint)
    + line('M-5 0-4 0M4 0H5M0 4V5', paper, .75);
  const key = circle(0,0,4,dark,gold,1.4) + line('M2 3 9 11 12 9M7 8 9 6',gold,2);
  const pen = line('M-3 3 7-9',paper,1.9) + path('M-4 5-3 1-1 2Z',gold);
  const tools = {lantern, marker, mic:mike, book, map, fork, lens, stamp, compass, key, pen};

  const decks = path('M71 96 125 96 137 104 134 110 70 110 65 105Z', dark, ochre, 1.3)
    + '<ellipse cx="87" cy="101" rx="13" ry="4" fill="#130d06" stroke="#e3bf6c" stroke-width="1"/>'
    + '<ellipse cx="87" cy="101" rx="4" ry="1.7" fill="#ffcb31"/>'
    + line('M76 100 84 99M101 100 110 100M101 103 110 103M114 103 125 103', paper,.9)
    + circle(105,99,1.3,ochre)+circle(119,100,1.6,mint) +line('M73 111 71 131M132 111 134 131',ochre,1.4);
  const board = path('M100 35 139 32 139 104 100 109Z', '#211b10', '#b0925d', 1.15)
    + line('M103 42 136 39M103 100 137 96', '#55421d', 1) + line('M107 109 103 135M134 106 139 132',ochre,1.3);
  const bench = path('M83 100 126 98 136 103 132 107 80 109Z','#3e341f',ochre,1.3)
    + line('M84 109 83 132M130 108 132 131',ochre,1.45);
  const textile = path('M87 100 95 96 101 97 104 94 110 94 115 97 122 96 130 99 126 102 120 101 120 105 97 105 98 101 93 103Z', '#5f491d', gold,.9);
  const tablet = path('M87 96 115 91 126 96 96 102Z','#e0c587',dark,1)
    + line('M94 96 110 93M98 98 118 94', '#7f6843',.8);
  const rings = '<g fill="none" stroke="#ffd654" stroke-width="1">' +
    '<path d="M106 42Q114 47 112 55M109 38Q121 46 117 58M113 35Q127 45 122 61"/></g>';
  const seal = path('M-4 1 0-4 4 1 0 3Z', 'none',mint,.9) + circle(0,0,5.4,'none',ochre,.8);
  const floor = '<g class="ua-floor" fill="none"><path d="M21 138Q57 142 107 138M30 135l12 1M104 135l13-1" stroke-width=".8"/></g>';

  // A single registered sheet is shared by all puppets. The crops are taken from
  // this site's original standing alchemist, keeping the fabric and face recognisable at hero scale.
  const sheetURL='/assets/alchemy-motion/iris-guide-detail.webp';
  const sheet=new Image();
  sheet.addEventListener('load',()=>document.documentElement.classList.add('ua-guide-textured'),{once:true});
  sheet.src=sheetURL;
  const crop={hood:'0 0 156 181',coat:'160 0 219 306',upper:'383 0 101 130',lower:'488 0 94 132',
    thigh:'0 310 152 222',shin:'156 310 131 192',shoe:'291 310 84 157',hand:'379 310 53 82'};
  const panel=(name,backup,x,y,w,h)=>'<g class="ua-print-under">'+backup+'</g>'
    +'<svg class="ua-print-texture" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h
    +'" overflow="hidden" preserveAspectRatio="none" viewBox="'+crop[name]+'">'
    +'<image href="'+sheetURL+'" width="600" height="532" preserveAspectRatio="none"/></svg>';
  function limb(side, type) {
    const arm = type === 'Arm', length = arm ? 18 : 25, lower = arm ? 16 : 20;
    const tag = side + type;
    const tip = g(tag + 'Tip', (arm ? panel('hand',glove,-3.9,-2.6,7.8,10.3) : panel('shoe',boot,-6.5,-7,15,16)) + (arm && side==='near' ? g('nearTool','') : ''));
    return g(tag, (arm ? panel('upper',sleeve,-7,-5,15,25) : panel('thigh',pants,-8,-5,16,33)) + at(0,length,g(tag+'Bend',(arm ? panel('lower',lowerSleeve,-6.3,-3,12.5,21) : panel('shin',shin,-6.8,-4,13.8,28))+at(0,lower,tip))));
  }

  function markup() {
    const limbs = at(-6,0,limb('far','Leg')) + at(5,0,limb('near','Leg'))
      + at(-8,-28,limb('far','Arm')) + panel('coat',coat,-15.5,-40,30,47) + at(1,-34,g('head',panel('hood',hood,-14.2,-30,30.8,36))) + g('farTool','') + at(9,-27,limb('near','Arm'));
    return '<svg class="ua-puppet" viewBox="0 0 150 146" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">'
      + floor + g('back','') + g('body',limbs) + g('effect','') + '</svg>';
  }
  const script = {
    walk:{secs:1.15}, home: {near:'lantern', secs:5.4}, map:{far:'map',secs:5.2},
    principles:{secs:6.6}, correspondence:{secs:5.8}, vibration:{near:'fork',secs:4.4},
    polarity:{secs:5.6}, rhythm:{secs:4.8}, 'cause-effect':{back:bench,secs:4.6}, generation:{secs:5.7},
    frequency:{near:'fork',secs:4.8}, selfmade:{near:'stamp',back:bench+tablet,secs:4},
    expeditions:{far:'compass',secs:2.9},
    writer:{near:'marker',back:board,secs:5.4}, wall:{near:'marker',back:board,secs:5.4},
    art:{far:'book',near:'pen',secs:5.1}, manifesto:{far:'book',secs:5.4},
    shop:{near:'stamp',back:bench+textile,secs:4.7}, dj:{back:decks,secs:2.5}, mc:{near:'mic',secs:2.8},
    breaking:{secs:2.4}, knowledge:{far:'book',near:'compass',secs:6.1},
    notebook:{far:'book',near:'pen',secs:4.6}, sources:{far:'book',near:'lens',secs:5.1}
  };
  const alias = {mentalism:'principles', city:'map', atelier:'selfmade', 'living-wall':'wall',
    blackbook:'notebook', store:'shop','cause-and-effect':'cause-effect','seven-principles':'principles'};
  const resolve = name => {
    const candidate = alias[name] || name;
    return Object.hasOwn(script,candidate) ? candidate : 'home';
  };
  const tau = 2*Math.PI;
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  const lerp = (a,b,f) => a + (b-a)*f;
  const wave = (t,k=1) => Math.sin(t*tau*k);
  const peak = (t,center,width) => {
    const u = clamp(1-Math.abs(t-center)/width,0,1);
    return u*u*(3-2*u);
  };
  const tagPoints = [[100,72],[104,66],[110,58],[103,70],[117,63],[111,74],[105,79],[120,72]];
  const tagPath = 'M'+tagPoints.map(p=>p.join(' ')).join('L');
  function penPoint(t) {
    const q = clamp((t-.09)/.67,0,1)*(tagPoints.length-1);
    const i = Math.min(Math.floor(q),tagPoints.length-2);
    return tagPoints[i].map((v,j)=>lerp(v,tagPoints[i+1][j],q-i));
  }
  // World-space end effectors are converted to a two-bone pose below. A stationary
  // target stays under the hand even while the jacket and head lean towards it.
  function scenePose(id,t) {
    const s=wave(t), b=(1-Math.cos(t*tau))*.5, beat=wave(t,2), strike=peak(t,.49,.18);
    const p={ x:71, y:89+.7*b, tilt:0, nod:s*2,
      farHand:[55,95],nearHand:[88,92], farFoot:[59,130],nearFoot:[87,130],
      farElbow:-1,nearElbow:1,farKnee:-1,nearKnee:-1,farWrist:-6,nearWrist:0,farSole:0,nearSole:0};
    switch(id) {
      case 'home':
        p.x=68; p.nearHand=[92+5*b,73-16*b]; p.farHand=[59,92-3*b]; p.nod=-7*b;
        p.nearWrist=4*s; p.tilt=1.5*s; break;
      case 'map':
        p.farHand=[80,80-2*b]; p.farWrist=-5; p.farElbow=1;
        p.nearHand=[79+13*b,76-6*b]; p.nod=8+3*b; p.tilt=3;
        break;
      case 'principles': case 'correspondence': case 'polarity': case 'generation': {
        p.x=73; p.y=114-2*b;
        p.farFoot=[69,124]; p.nearFoot=[76,125]; p.farKnee=1; p.nearKnee=-1;
        p.farSole=-8; p.nearSole=11;
        p.farHand=[44+2*b,108-7*b]; p.nearHand=[101-2*b,108-7*b];
        p.farElbow=-1; p.nearElbow=1; p.nod=3-6*b;
        if (id==='correspondence') {
          p.farHand=[49+4*b,99-13*b]; p.nearHand=[97-4*b,99-13*b];
        } else if(id==='polarity') {
          p.farHand=[49,94+11*s]; p.nearHand=[97,94-11*s]; p.nod=3*s;
        } else if(id==='generation') {
          p.farHand=[67-14*b,100-12*b]; p.nearHand=[77+14*b,100-12*b];
        }
        break;
      }
      case 'rhythm':
        p.y=92+3*b; p.tilt=-3*s; p.nearHand=[88+5*b,86-19*b]; p.farHand=[52,71+16*b];
        p.farFoot=[58,130]; p.nearFoot=[90,130-6*b]; p.nearSole=10*b; p.nod=6*beat; break;
      case 'cause-effect':
        p.x=80;p.y=96; p.tilt=2+3*strike; p.nod=6;
        p.nearHand=[96+5*strike,86+11*strike]; p.farHand=[70,91-4*strike]; break;
      case 'vibration': case 'frequency':
        p.x=72;p.nearHand=[96,70+2*s];p.nearWrist=5+4*s+6*peak(t,.46,.05);
        p.farHand=[71+22*strike,76-7*strike]; p.farElbow=1; p.nod=4-7*strike;
        break;
      case 'shop': case 'selfmade':
        p.x=80;p.y=96+2*strike; p.tilt=2+4*strike; p.nod=7+5*strike;
        p.nearHand=[101+1.5*strike,80+18*strike]; p.farHand=[83,97]; p.farFoot=[66,130]; p.nearFoot=[96,130];
        break;
      case 'walk':
        p.x=72; p.y=89+1.5*Math.cos(t*tau*2);p.tilt=4;p.nod=2*beat;
        p.farHand=[63-9*s,91+3*s];p.nearHand=[81+11*s,90-3*s];
        p.farFoot=[70+15*s,130-9*Math.max(0,-Math.cos(t*tau))];
        p.nearFoot=[77-15*s,130-9*Math.max(0,Math.cos(t*tau))];
        p.farSole=10*s;p.nearSole=-10*s;break;
      case 'expeditions':
        p.x=71+1.5*s; p.y=90+2*Math.cos(t*tau*2); p.tilt=4; p.nod=2-7*b;
        p.farHand=[69+7*s,77-2*b]; p.nearHand=[89-6*s,89+2*s];p.farElbow=1;
        p.farFoot=[68+14*s,130-6*Math.max(0,-Math.cos(t*tau))];
        p.nearFoot=[76-14*s,130-6*Math.max(0,Math.cos(t*tau))]; p.farSole=8*s;p.nearSole=-8*s;
        break;
      case 'writer': case 'wall': {
        const q=penPoint(t), lift=peak(t,.88,.12); p.x=79;p.tilt=2+2*b;p.nod=4*s;
        p.nearHand=[q[0]-9-5*lift,q[1]+9+2*lift]; p.nearWrist=0;
        p.farHand=[63,86+2*s]; p.farFoot=[63,129];p.nearFoot=[93,130]; break;
      }
      case 'dj':
        p.x=83;p.y=96+1.5*b;p.tilt=3+3*b;p.nod=5+7*b;
        p.farHand=[82+8*s,97+1.5*beat];p.nearHand=[104-5*s,97-3*b];p.farElbow=1;
        p.farFoot=[69,130]; p.nearFoot=[94,130];break;
      case 'mc':
        p.x=71+2*s; p.tilt=-1+4*s; p.y=91+1.5*b;
        p.nearHand=[78+2*s,58+1.5*b];p.nearWrist=-10;
        p.farHand=[46+9*b,72+14*b];p.farElbow=-1;p.nod=-2+6*b; break;
      case 'breaking':
        p.x=74+8*s;p.y=99-8*b;p.tilt=-12*s;p.nod=6*s;
        p.nearHand=[98-7*s,75-11*s];p.farHand=[50+9*s,72+14*s];
        p.nearFoot=[89-17*s,130-17*Math.max(0,s)];p.farFoot=[59-15*s,130-15*Math.max(0,-s)];
        p.nearSole=14*s;p.farSole=-12*s;break;
      case 'notebook': case 'art': case 'sources': case 'knowledge': case 'manifesto':
        p.x=70;p.farHand=[81,81+2*b];p.farElbow=1;p.farWrist=-5;p.nod=8+4*b;
        p.nearHand=[87+4*s,75+2*beat];p.nearWrist=-2;
        if(id==='sources') { p.nearHand=[80+9*b,75-5*b]; p.nearWrist=8-14*b; }
        if(id==='knowledge') {p.nearHand=[96-3*b,81-13*b];p.nod=8-9*b;}
        if(id==='manifesto') {p.nearHand=[94+6*b,82-20*b];p.nod=7-13*b;}
        break;
    }
    return p;
  }

  // In SVG coordinates a clockwise rotation moves a downward bone to the left.
  function inverse(p, base, target, l1, l2, bend) {
    const angle=p.tilt*Math.PI/180, dx=target[0]-p.x,dy=target[1]-p.y;
    const x=dx*Math.cos(angle)+dy*Math.sin(angle)-base[0], y=-dx*Math.sin(angle)+dy*Math.cos(angle)-base[1];
    const d=clamp(Math.hypot(x,y),Math.abs(l1-l2)+.02,l1+l2-.02);
    const a=Math.atan2(-x,y)+bend*Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
    const e=-bend*Math.acos(clamp((d*d-l1*l1-l2*l2)/(2*l1*l2),-1,1));
    return [a*180/Math.PI,e*180/Math.PI];
  }
  function fullPose(id,t) {
    const p=scenePose(id,t), angles={head:p.nod};
    for(const side of ['far','near']){
      const left=side==='far';
      for(const kind of ['Arm','Leg']) {
        const arm=kind==='Arm', tag=side+kind;
        const base=arm?(left?[-8,-28]:[9,-27]):(left?[-6,0]:[5,0]);
        const [upper,lower]=inverse(p,base,p[side+(arm?'Hand':'Foot')],arm?18:25,arm?16:20,p[side+(arm?'Elbow':'Knee')]);
        angles[tag]=upper;angles[tag+'Bend']=lower;
        angles[tag+'Tip']=p[side+(arm?'Wrist':'Sole')]-p.tilt-upper-lower;
      }
    }
    return {p,angles};
  }
  const settle = .6;
  function effects(id) {
    if(id==='writer'||id==='wall') return '<path data-fx="ink" d="'+tagPath+'" fill="none" stroke="#ffae18" stroke-width="2.6" pathLength="1" stroke-dasharray="1" stroke-linecap="square"/>';
    if(id==='frequency'||id==='vibration') return '<g data-fx="wave">'+rings+'</g>';
    if(id==='shop'||id==='selfmade') return '<g data-fx="imprint">'+at(102,102,seal)+'</g>';
    if(id==='cause-effect') return '<g data-fx="wave">'+at(101,100,line('M-2 0Q6-4 14 0M3 3Q11-1 18 2',mint,1.3))+'</g>';
    if(id==='generation') return '<g data-fx="bloom">'+at(73,84,path('M0 7Q-14 2-11-8Q-1-5 0 2Q0-6 8-11Q13-2 0 7Z',dark,mint,1.1))+'</g>';
    return '';
  }
  const cached=new Map();
  function frames(id) {
    if(cached.has(id)) return cached.get(id);
    const result={}, previous={}, steps=48;
    for(let i=0;i<=steps;i++) {
      const t=i/steps,{p,angles}=fullPose(id,t);
      const keys={body:'translate('+p.x.toFixed(2)+'px,'+p.y.toFixed(2)+'px) rotate('+p.tilt.toFixed(2)+'deg)'};
      const a=angles.farArm*Math.PI/180,e=a+angles.farArmBend*Math.PI/180;
      const fx=-8-18*Math.sin(a)-16*Math.sin(e),fy=-28+18*Math.cos(a)+16*Math.cos(e);
      keys.farTool='translate('+fx.toFixed(2)+'px,'+fy.toFixed(2)+'px) rotate('+(p.farWrist-p.tilt).toFixed(2)+'deg)';
      for(const [joint,val] of Object.entries(angles)) {
        // Unwrap equivalent angles so a crossed foot never spins a full turn.
        let a=val;
        if(previous[joint]!==undefined) a+=360*Math.round((previous[joint]-a)/360);
        previous[joint]=a; keys[joint]='rotate('+a.toFixed(2)+'deg)';
      }
      for(const [key,transform] of Object.entries(keys)) (result[key]??=[]).push({transform,offset:t});
    }
    cached.set(id,result);return result;
  }
  const fxFrames = {
    ink:[{strokeDashoffset:'1',offset:0},{strokeDashoffset:'1',offset:.09},{strokeDashoffset:'0',offset:.76},{strokeDashoffset:'0',opacity:1,offset:.88},{strokeDashoffset:'0',opacity:0,offset:1}],
    wave:[{opacity:0,offset:0},{opacity:0,offset:.42},{opacity:1,offset:.51},{opacity:.5,offset:.59},{opacity:0,offset:.7},{opacity:0,offset:1}],
    imprint:[{opacity:0,offset:0},{opacity:0,offset:.47},{opacity:1,offset:.5},{opacity:1,offset:.85},{opacity:0,offset:1}],
    bloom:[{opacity:0,offset:0},{opacity:1,offset:.4},{opacity:1,offset:.68},{opacity:0,offset:.94},{opacity:0,offset:1}]
  };
  function mount(host,action='home') {
    host.innerHTML=markup();
    const svg=host.querySelector('svg');
    const nodes=Object.fromEntries([...svg.querySelectorAll('[data-joint]')].map(node=>[node.dataset.joint,node]));
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let id, players=[], duration, progress=null, paused=false, visible=true, destroyed=false;
    const sync=()=>{
      if(destroyed)return;
      for(const animation of players) {
        if(paused||reduced.matches) { animation.pause(); animation.currentTime=duration*settle; }
        else if(progress!==null){ animation.pause(); animation.currentTime=duration*progress; }
        else if(!visible||document.hidden) animation.pause();
        else animation.play();
      }
    };
    function animate(node,values) {
      if(!node.animate) {
        Object.assign(node.style, Object.fromEntries(Object.entries(values[Math.floor(values.length*settle)]).filter(([k])=>k!=='offset')));
        return;
      }
      const player=node.animate(values,{duration,iterations:Infinity,easing:'linear',fill:'both'});
      players.push(player);
    }
    function setAction(next) {
      if(destroyed)return;
      const name=resolve(next);
      if(name===id)return;
      players.forEach(a=>a.cancel()); players=[]; id=name; progress=null;
      svg.dataset.action=id;
      const data=script[id];
      duration=data.secs*1000;
      nodes.nearTool.innerHTML=tools[data.near]||'';
      nodes.farTool.innerHTML=tools[data.far]||'';
      nodes.back.innerHTML=data.back||'';
      nodes.effect.innerHTML=effects(id);
      for(const [key,values] of Object.entries(frames(id))) animate(nodes[key],values);
      for(const node of nodes.effect.querySelectorAll('[data-fx]')) animate(node,fxFrames[node.dataset.fx]);
      sync();
    }
    function gesture() {
      if(destroyed||paused||reduced.matches)return;
      for(const player of players) player.currentTime=0;
      sync();
    }
    const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(([entry])=>{visible=entry.isIntersecting; sync();}):null;
    observer?.observe(svg);
    reduced.addEventListener('change',sync);
    document.addEventListener('visibilitychange',sync);
    setAction(action);
    return { setAction, gesture, setProgress(value){
      const next=Number.isFinite(value)?clamp(value,0,1):null;
      if(next===progress)return;progress=next;sync();
    }, setPaused(value){paused=Boolean(value);sync();},destroy(){
      destroyed=true;observer?.disconnect();players.forEach(a=>a.cancel());players=[];
      reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);svg.remove();
    }};
  }
  window.UAGuide={mount};
})();
