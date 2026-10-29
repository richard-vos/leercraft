import {schoolGroup} from './atlas-session.js';
const select=document.getElementById('chapter-atlas-group');
let stored;try{stored=localStorage.getItem('leercraft-atlas-group');}catch{}
select.value=schoolGroup(stored);
function apply(){
  const group=schoolGroup(select.value);
  document.getElementById('chapter-atlas-curriculum').textContent=group<=6?'Europa 1 · 19 landen':'Europa 1 + 2 · 39 landen';
  for(const link of document.querySelectorAll('#subj-topo a.card')){
    const url=new URL(link.href);if(!/\/(?:europa-[a-z-]+|atlascode)\/$/.test(url.pathname))continue;
    url.searchParams.set('groep',group);link.href=url.pathname+url.search;
  }
  try{localStorage.setItem('leercraft-atlas-group',String(group));}catch{}
}
select.addEventListener('change',apply);apply();
