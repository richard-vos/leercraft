// Learning and answer rules shared by the six Europe games; no rendering or network.
export const EUROPE_MODES=['europa-landen-klik','europa-landen-schrijf','europa-hoofdsteden-klik',
  'europa-hoofdsteden-schrijf','europa-raster-landen','europa-raster-hoofdsteden'];
export function schoolGroup(value){return [5,6,7,8].includes(Number(value))?Number(value):6;}
export function curriculum(group){return schoolGroup(group)<=6?'europa-1':'europa-1-2';}
export function countriesForGroup(countries,group){return countries.filter(c=>c.level===1||schoolGroup(group)>=7);}
export function normalizeAnswer(text){return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
const aliases={gbr:['Verenigd Koninkrijk','Groot-Brittannië','Groot Brittannie'],blr:['Wit-Rusland','Belarus','Wit-Rusland (Belarus)'],
  ukr:['Oekraïne'],mda:['Moldavië','Moldova']};
const capitalAliases={ukr:['Kyiv','Kiev'],mda:['Chisinau','Chișinău'],isl:['Reykjavik','Reykjavík'],kos:['Pristina','Prishtina']};
export function acceptsAnswer(country,text,capital=false){
  return [capital?country.hoofdstad:country.naam,...((capital?capitalAliases:aliases)[country.id]||[])]
    .some(answer=>normalizeAnswer(answer)===normalizeAnswer(text));
}
export class AtlasSession {
  constructor(countries,group=6,count=10,random=Math.random){
    this.group=schoolGroup(group);this.deck=[...countriesForGroup(countries,this.group)];
    for(let i=this.deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}
    this.deck=this.deck.slice(0,count==='all'?this.deck.length:10);
    this.index=0;this.correct=0;this.attempts=0;this.locked=false;
  }
  get current(){return this.deck[this.index]||null;}
  answer(correct){
    if(!this.current||this.locked)return null;
    this.attempts++;
    const first=correct&&this.attempts===1;
    if(first)this.correct++;
    if(correct||this.attempts>=3)this.locked=true;
    return {correct,first,reveal:!correct&&this.locked,advance:this.locked};
  }
  next(){if(!this.locked)return false;this.index++;this.attempts=0;this.locked=false;return true;}
}
