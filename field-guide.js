// Original Rannamets plant cards. Photographs load only when a card is opened.
(() => {
'use strict';
const $=id=>document.getElementById(id);
function show(t,number){
 // v98: species without a common German name show their scientific name as the title.
 const named=t.de&&t.de!=='—';
 const values={speciesNumber:String(number).padStart(2,'0'),speciesName:named?t.de:t.lat,speciesLatin:named?t.lat:'ohne gebräuchlichen deutschen Namen',
  speciesFamily:t.family+' · '+t.group,speciesDescription:t.traits.join(' · '),
  speciesConfusion:t.confusion,speciesHabitat:t.ecology,speciesToxicity:t.toxicity,
  speciesUse:t.use,speciesEvidence:t.evidenceLevel+' · '+t.evidence,speciesCredit:t.credit};
 for(const [id,value]of Object.entries(values))$(id).textContent=value;
 $('speciesSource').href=t.source;
 const photo=$('speciesPhoto');photo.hidden=false;$('speciesPhotoError').hidden=true;
 photo.alt=t.photoAlt||'Referenzfoto: '+t.de+' ('+t.lat+')';
 photo.onerror=()=>{photo.hidden=true;$('speciesPhotoError').hidden=false;};
 photo.src=window.NOVA_ASSET_DATA?.[t.photo]||t.photo;
 $('observation').hidden=false;$('observation').scrollTop=0;$('closeObservation').focus();
}
window.NovaFieldGuide={show};
})();
