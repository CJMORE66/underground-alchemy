import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createPanelMotion} from '../dist/play/panel-motion.js';

const make = () => {
  const {document} = parseHTML('<html><body><main><section class="play-panel" id="base"></section><section class="play-panel" id="field" hidden></section><section class="play-panel" id="journal" hidden></section></main></body></html>');
  const root = document.querySelector('main');
  const jobs = [];
  for (const panel of root.querySelectorAll('section')) {
    panel.animate = (frames, options) => {
      let resolve, reject;
      const job = {node:panel, frames, options, finished:new Promise((a,b) => {resolve=a;reject=b;}), cancel(){job.canceled=true;reject(Error('canceled'));}, finish(){resolve();}};
      jobs.push(job);
      return job;
    };
  }
  return {document, root, jobs};
};

{
  const {document, root, jobs} = make();
  const motion=createPanelMotion(root,{allowed:()=>false});
  assert.equal(await motion.show('field'),true);
  assert.equal(jobs.length,0,'quiet mode never schedules motion');
  assert.equal(document.getElementById('field').hidden,false);
  assert.equal(document.getElementById('base').hidden,true);
  motion.destroy();
}
{
  const {document,root,jobs}=make();
  const motion=createPanelMotion(root,{allowed:()=>true});
  const first=motion.show('field');
  assert.equal(jobs.length,1);
  assert.equal(document.getElementById('base').hidden,false,'outgoing content stays available during exit');
  const second=motion.show('journal');
  assert.equal(jobs[0].canceled,true,'fast navigation cancels stale exit');
  jobs[1].finish();
  assert.equal(await first,false,'stale request never reveals its panel');
  assert.equal(await second,true);
  assert.equal(document.getElementById('journal').hidden,false);
  assert.equal(document.getElementById('field').hidden,true);
  assert.equal(jobs[2].node.id,'journal','entrance belongs to the newest request');
  motion.destroy();
  assert.equal(jobs[2].canceled,true,'cleanup releases running entrances');
  assert.equal(await motion.show('base'),false);
}
{
  const {document,root}=make();
  root.querySelectorAll('section').forEach(panel=>delete panel.animate);
  const motion=createPanelMotion(root,{allowed:()=>true});
  assert.equal(await motion.show('field'),true,'unsupported Web Animations keeps native navigation');
  assert.equal(document.getElementById('field').hidden,false);
  assert.equal(await motion.show('missing'),false);
  motion.destroy();
}
console.log('PASS panel motion: finite exit/entry, rapid reverse navigation, stale request protection, quiet and API fallbacks, cleanup.');
