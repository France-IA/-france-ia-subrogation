/* Maquette uniquement : une source par journée/apprenant, partagée par tous les accès.
 * Aucun appel métier, aucune création de dossier commercial, aucun enregistrement audio. */
'use strict';
const qualificationState={1:{rows:{},feedback:'',submitted:false},2:{rows:{},feedback:'',submitted:false}};
let qualificationDay=1;
const qualificationLimit=8000;
const hasWords=t=>/[\p{L}\p{N}]/u.test(t);
const emptyQualification=()=>({note:'',besoin:'',aucune_suite_possible:false,saved:false,fromJ1:false});
function readQualification(day,id){
 if(qualificationState[day].rows[id])return qualificationState[day].rows[id];
 return day===2?{...readQualification(1,id),saved:false,fromJ1:true}:emptyQualification();
}
function qualificationTaskId(day){const step=sessionSteps.find(s=>s.id==='formation');return 'formation-'+stepItems(step).findIndex(t=>t[1]==='qualification-j'+day);}
function changeQualification(day,id,patch){
 const state=qualificationState[day];state.rows[id]={...readQualification(day,id),...patch,saved:false,fromJ1:false};
 state.submitted=false;completed.delete(qualificationTaskId(day));refreshQualificationViews();
}
function validQualification(row){return hasWords(row.note)&&row.note.length<=qualificationLimit&&row.besoin.length<=qualificationLimit&&(row.aucune_suite_possible||hasWords(row.besoin));}
function qualificationStatus(row){return row.saved?'Enregistrée':hasWords(row.note)||hasWords(row.besoin)||row.aucune_suite_possible?'À compléter':'À renseigner';}
function refreshQualificationViews(){
 $$('[data-qualification-profile]').forEach(root=>{if(!root.contains(document.activeElement)||!document.activeElement.matches('textarea,input'))renderQualificationProfile(root);});
 if(typeof renderSessionTasks==='function')renderSessionTasks();
}
function dayButtons(day,attr){return '<div class="q-days" aria-label="Journée du bilan">'+[1,2].map(d=>'<button type="button" '+attr+'="'+d+'" aria-pressed="'+(d===day)+'">J'+d+'</button>').join('')+'</div>';}
function renderQualificationProfile(root){
 const id=root.dataset.qualificationProfile,day=Number(root.dataset.day),row=readQualification(day,id);
 root.innerHTML='<div class="q-profile-top">'+dayButtons(day,'data-profile-day')+'<span class="pill '+(row.saved?'ok':'neutral')+'" data-inline-status>'+qualificationStatus(row)+'</span></div>'+(row.fromJ1&&(hasWords(row.note)||hasWords(row.besoin))?'<p class="q-message">Notes du J1 à compléter ; le bilan J1 reste conservé.</p>':'')+['note','besoin'].map(key=>'<details class="q-section" open><summary>'+(key==='note'?'Niveau, retours & points à retenir':'Besoin identifié & upsell possible')+'</summary><div class="q-contenu"><textarea class="q-champ" data-inline-field="'+key+'" aria-label="'+(key==='note'?'Niveau, retours et points à retenir':'Besoin identifié et upsell possible')+'" maxlength="8000" '+(key==='besoin'&&row.aucune_suite_possible?'readonly':'')+'>'+escapeHtml(row[key])+'</textarea>'+(key==='besoin'?'<label class="q-aucuneSuite"><input type="checkbox" data-inline-none '+(row.aucune_suite_possible?'checked':'')+'> Aucune suite possible</label>':'')+'</div></details>').join('')+'<p class="q-erreur" data-inline-error role="alert" hidden></p><div class="q-inline-actions"><span class="q-aide">Maquette · sauvegarde dans cet onglet uniquement.</span><button class="btn btn-p" data-inline-save>Enregistrer</button></div>';
}
document.addEventListener('input',e=>{
 const field=e.target.dataset.inlineField,root=e.target.closest('[data-qualification-profile]');if(!root||!field)return;
 changeQualification(Number(root.dataset.day),root.dataset.qualificationProfile,{[field]:e.target.value});
 $('[data-inline-status]',root).textContent='À compléter';$('[data-inline-status]',root).className='pill neutral';$('[data-inline-error]',root).hidden=true;
});
document.addEventListener('change',e=>{
 if(!e.target.matches('[data-inline-none]'))return;const root=e.target.closest('[data-qualification-profile]');
 changeQualification(Number(root.dataset.day),root.dataset.qualificationProfile,{aucune_suite_possible:e.target.checked});
 $('[data-inline-field=besoin]',root).readOnly=e.target.checked;$('[data-inline-status]',root).textContent='À compléter';$('[data-inline-status]',root).className='pill neutral';
});
document.addEventListener('click',e=>{
 const day=e.target.closest('[data-profile-day]');if(day){const root=day.closest('[data-qualification-profile]');root.dataset.day=day.dataset.profileDay;renderQualificationProfile(root);}
 const save=e.target.closest('[data-inline-save]');if(save){const root=save.closest('[data-qualification-profile]'),day=Number(root.dataset.day),id=root.dataset.qualificationProfile,row=readQualification(day,id);
  if(!validQualification(row)){const error=$('[data-inline-error]',root);error.hidden=false;error.textContent=!hasWords(row.note)?'Renseigne un niveau, un retour ou un point à retenir.':'Décris le besoin identifié ou coche « Aucune suite possible ».';return;}
  qualificationState[day].rows[id]={...row,saved:true,fromJ1:false};refreshQualificationViews();toast('Qualification conservée dans la maquette.');
 }
});
function openQualification(day=qualificationDay,id=learners[0].id){
 // Une seule modale de qualification, quel que soit le point d’entrée.
 const existing=$('dialog[data-kind="qualification"][open]');if(existing){existing.showQualification(day,id);return;}
 const d=modal({title:'Bilan de formation · Journée '+day,sub:'13 & 14 octobre · Session Niveau 1',kind:'qualification',body:'<div class="q-root"></div>',footer:'<span class="q-aide">Maquette · sauvegarde dans cet onglet uniquement.</span><button class="btn btn-s" data-close>Fermer</button><button class="btn btn-s" data-q-save>Enregistrer cet apprenant</button><button class="btn btn-p" data-q-next>Participant suivant</button>'});
 let currentDay=day,currentId=id,final=false;
 function error(message){const el=$('[data-q-error]',d);el.hidden=false;el.textContent=message;}
 function saveCurrent(){
  const row=readQualification(currentDay,currentId);
  if(!validQualification(row)){error(!hasWords(row.note)?'Renseigne un niveau, un retour ou un point à retenir.':!row.aucune_suite_possible&&!hasWords(row.besoin)?'Décris le besoin identifié ou coche « Aucune suite possible ».':'Chaque champ est limité à 8 000 caractères.');return false;}
  qualificationState[currentDay].rows[currentId]={...row,saved:true,fromJ1:false};
  refreshQualificationViews();return true;
 }
 function render(){
  qualificationDay=currentDay;
  const row=readQualification(currentDay,currentId),person=learners.find(l=>l.id===currentId),state=qualificationState[currentDay];
  const saved=learners.filter(l=>readQualification(currentDay,l.id).saved&&validQualification(readQualification(currentDay,l.id))).length;
  $('.dialog-head h2',d).textContent='Bilan de formation · Journée '+currentDay;
  $('[data-q-save]',d).hidden=final;$('[data-q-next]',d).textContent=final?'Soumettre le bilan':learners.at(-1).id===currentId?'Terminer les apprenants':'Participant suivant';
  $('[data-q-next]',d).disabled=final&&(saved!==learners.length||state.submitted);
  $('.q-root',d).innerHTML=dayButtons(currentDay,'data-q-day')+'<p class="q-erreur" data-q-error role="alert" hidden></p><div class="q-layout"><aside class="q-navigation"><h3>Apprenants</h3><div class="q-participants">'+learners.map(l=>'<button class="q-participant '+(!final&&l.id===currentId?'q-actif':'')+'" data-q-person="'+l.id+'" '+(!final&&l.id===currentId?'aria-current="step"':'')+'><span class="q-avatar">'+l.initials+'</span><span><span class="q-nom">'+l.name+'</span><span class="q-statut">'+qualificationStatus(readQualification(currentDay,l.id))+'</span></span></button>').join('')+'</div><div class="q-progression"><span style="width:'+saved/learners.length*100+'%"></span></div><p class="q-statut">'+saved+' / '+learners.length+' apprenants renseignés</p><button class="btn-link q-review" data-q-final>Voir le bilan</button></aside><section class="q-panel">'+(final?'<h3>'+ (currentDay===2?'Ton retour sur la séance':'Le bilan du groupe')+'</h3><p class="q-message">'+saved+' / '+learners.length+' apprenants renseignés · '+learners.filter(l=>{const r=readQualification(currentDay,l.id);return r.saved&&!r.aucune_suite_possible&&hasWords(r.besoin);}).length+' besoins à étudier</p>'+(currentDay===2?'<label class="q-retour">Comment s’est passée la séance ?<textarea class="q-champ" data-q-feedback maxlength="8000" aria-label="Retour général sur la séance" placeholder="Rythme, ateliers, organisation…">'+escapeHtml(state.feedback)+'</textarea></label>':'<p class="q-message">Ces mêmes notes seront disponibles en J2 pour les compléter.</p>')+(state.submitted?'<p class="q-succes" role="status">Bilan enregistré dans la maquette.</p>':''):'<header class="q-enteteParticipant"><span class="q-avatar">'+person.initials+'</span><h3>'+person.name+'</h3></header>'+(row.fromJ1&&(hasWords(row.note)||hasWords(row.besoin))?'<p class="q-message">Notes du J1 à compléter ; le bilan J1 reste conservé.</p>':'')+['note','besoin'].map(key=>'<details class="q-section" open><summary>'+(key==='note'?'Niveau, retours & points à retenir':'Besoin identifié & upsell possible')+'</summary><div class="q-contenu"><textarea class="q-champ" data-q-field="'+key+'" aria-label="'+(key==='note'?'Niveau, retours et points à retenir':'Besoin identifié et upsell possible')+'" maxlength="8000" '+(key==='besoin'&&row.aucune_suite_possible?'readonly':'')+' placeholder="'+(key==='note'?'Niveau, progrès, difficultés, retours…':'Quel besoin, pour quel objectif ?')+'">'+escapeHtml(row[key])+'</textarea>'+(key==='besoin'?'<label class="q-aucuneSuite"><input type="checkbox" data-q-none '+(row.aucune_suite_possible?'checked':'')+'> Aucune suite possible</label>':'')+'</div></details>').join(''))+'</section></div>';
 }
 d.showQualification=(day,id)=>{currentDay=day;currentId=id;final=false;render();};
 d.addEventListener('input',e=>{
  const field=e.target.dataset.qField;
  if(field){changeQualification(currentDay,currentId,{[field]:e.target.value});$('[data-q-error]',d).hidden=true;}
  if(e.target.matches('[data-q-feedback]')){qualificationState[currentDay].feedback=e.target.value;qualificationState[currentDay].submitted=false;completed.delete(qualificationTaskId(currentDay));$('[data-q-next]',d).disabled=learners.some(l=>!readQualification(currentDay,l.id).saved);refreshQualificationViews();}
 });
 d.addEventListener('change',e=>{if(e.target.matches('[data-q-none]')){changeQualification(currentDay,currentId,{aucune_suite_possible:e.target.checked});$('[data-q-field="besoin"]',d).readOnly=e.target.checked;}});
 d.addEventListener('click',e=>{
  const person=e.target.closest('[data-q-person]'),day=e.target.closest('[data-q-day]');
  if(person){currentId=person.dataset.qPerson;final=false;render();}
  if(day){currentDay=Number(day.dataset.qDay);final=false;render();}
  if(e.target.closest('[data-q-final]')){final=true;render();}
  if(e.target.closest('[data-q-save]')&&saveCurrent()){render();toast('Qualification conservée dans la maquette.');}
  if(e.target.closest('[data-q-next]')){
   if(final){if(learners.some(l=>!readQualification(currentDay,l.id).saved||!validQualification(readQualification(currentDay,l.id))))return;qualificationState[currentDay].submitted=true;completed.add(qualificationTaskId(currentDay));refreshQualificationViews();render();}
   else if(saveCurrent()){const i=learners.findIndex(l=>l.id===currentId);if(i===learners.length-1)final=true;else currentId=learners[i+1].id;render();}
  }
 });
 render();return d;
}

const granolaState={1:{start:false,restart:false,filename:'',text:''},2:{start:false,restart:false,filename:'',text:''}};
function granolaTask(day,step){const s=sessionSteps.find(s=>s.id==='formation');return 'formation-'+stepItems(s).findIndex(t=>t[3]?.key==='granola-j'+day+'-'+step);}
function openGranola(action){
 const [,step,dayPart]=action.split('-'),day=Number(dayPart.slice(1)),state=granolaState[day];
 if(step==='deposit')return openGranolaDeposit(day);
 const title=(step==='restart'?'Relancer':'Lancer')+' le transcript Granola du J'+day;
 const d=modal({title,kind:'granola-start',narrow:true,body:'<span class="pill neutral">Facultatif</span><p class="q-message">Ouvre Granola et '+(step==='restart'?'reprends la transcription après la pause.':'lance la transcription de la séance.')+'</p><label class="q-aucuneSuite"><input type="checkbox" data-granola-agreement> Le groupe a été informé et a donné son accord.</label><p class="q-message">La maquette ne lance aucun enregistrement.</p>',footer:'<button class="btn btn-s" data-close>Fermer</button><button class="btn btn-p" data-granola-confirm disabled>Marquer comme fait</button>'});
 $('[data-granola-agreement]',d).addEventListener('change',e=>{$('[data-granola-confirm]',d).disabled=!e.target.checked;});
 $('[data-granola-confirm]',d).addEventListener('click',()=>{if(!$('[data-granola-agreement]',d).checked)return;state[step]=true;completed.add(granolaTask(day,step));renderSessionTasks();d.close();});
}
function openGranolaDeposit(day){
 const state=granolaState[day];let filename=state.filename,fileRevision=0;
 const d=modal({title:'Déposer le transcript Granola du J'+day,kind:'granola-deposit',body:'<span class="pill neutral">Facultatif</span><p class="q-message">Colle le transcript ou sélectionne un fichier texte (.txt ou .md, 2 Mo maximum).</p><label class="field"><span>Fichier</span><input type="file" data-granola-file accept=".txt,.md,text/plain,text/markdown"></label><p class="q-message" data-granola-filename>'+escapeHtml(filename)+'</p><label class="field"><span>Transcript</span><textarea data-granola-text aria-label="Transcript Granola" placeholder="Colle ici le transcript du J'+day+'…">'+escapeHtml(state.text)+'</textarea></label><p class="q-erreur" data-granola-error role="alert" hidden></p>',footer:'<span class="q-aide">Conservé dans cet onglet uniquement. Aucun fichier envoyé.</span><button class="btn btn-s" data-close>Fermer</button><button class="btn btn-p" data-granola-save>Conserver dans la maquette</button>'});
 const field=$('[data-granola-text]',d),save=$('[data-granola-save]',d),error=$('[data-granola-error]',d);
 const update=()=>{save.disabled=!field.value.trim()||field.value.length>2000000;};update();
 field.addEventListener('input',()=>{fileRevision++;filename='';$('[data-granola-filename]',d).textContent='';update();});
 $('[data-granola-file]',d).addEventListener('change',async e=>{
  const file=e.target.files[0],revision=++fileRevision;if(!file)return;
  if(file.size>2000000||!(/\.(txt|md)$/i.test(file.name))){error.hidden=false;error.textContent='Choisis un fichier .txt ou .md de moins de 2 Mo.';return;}
  try{const text=await file.text();if(revision!==fileRevision||!d.open)return;filename=file.name;field.value=text;$('[data-granola-filename]',d).textContent=filename;error.hidden=true;update();}catch{error.hidden=false;error.textContent='Lecture impossible. Tu peux coller le texte directement.';}
 });
 save.addEventListener('click',()=>{if(save.disabled)return;state.text=field.value;state.filename=filename;completed.add(granolaTask(day,'deposit'));renderSessionTasks();d.close();toast('Transcript du J'+day+' conservé dans la maquette.');});
}
