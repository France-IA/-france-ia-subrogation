/* Maquette : automatisations J−14 simulées ; aucun appel à Qualiobee, LinkedIn ou une IA. */
'use strict';
const pipeline={linkedin:'waiting',profiles:'waiting',summary:'waiting',generated:false,revision:0};
const rail=$('#task-rail');
const railHome=rail.parentElement;
const railNext=rail.nextElementSibling;
let railScroll=0;
const linkedinExamples=[
 {id:'camille',status:'Récupéré',hasLink:true,fields:[['Fonction','Responsable opérations'],['Secteur','Services aux entreprises'],['Responsabilités','Coordination des opérations, suivi des projets et relation client'],['À retenir','Un contexte professionnel complémentaire ; les outils et l’aisance restent à confirmer.']]},
 {id:'thomas',status:'Inaccessible',hasLink:true,reason:'Le profil n’est pas accessible dans ce scénario. L’analyse se poursuit avec ARD et les notes GHL.'},
 {id:'sarah',status:'Lien non renseigné',hasLink:false,reason:'Aucun lien renseigné. La fiche est préparée à partir d’ARD et des notes GHL.'},
 {id:'alex',status:'Lien non renseigné',hasLink:false,reason:'Aucun lien renseigné. Les autres informations absentes sont signalées dans la fiche.'},
];
const statusLabel=s=>({waiting:'En attente',running:'En cours',done:'Terminé',partial:'Terminé · partiel',failed:'Échec'}[s]);
function readyMarkup(){const gen=pipeline.summary==='failed'?'failed':pipeline.summary==='done'?'done':pipeline.profiles==='waiting'?'waiting':'running';return '<section class="ready-process"><div class="ready-heading"><strong>Prête — J−14 formation</strong><span class="pill">Automatique</span></div><p class="ready-caption">Extrait du processus de session · Ce ne sont pas des tâches manuelles du formateur.</p><div class="automatic-task"><span class="automatic-check">✓</span><div><strong>Lancer la session Qualiobee</strong><p>Lancement déjà confirmé dans ce scénario fictif.</p></div><span class="pill ok">Terminé</span></div><div class="automatic-task"><span class="automatic-check">'+(pipeline.linkedin==='partial'?'✓':'·')+'</span><div><strong>Scraper les profils LinkedIn des participants</strong><p>Uniquement les liens renseignés.</p><button class="task-action" data-ready-action="linkedin">Voir les résultats</button></div><span class="pill '+(pipeline.linkedin==='partial'?'warn':'neutral')+'">'+statusLabel(pipeline.linkedin)+'</span></div><div class="automatic-task"><span class="automatic-check">'+(pipeline.generated?'✓':'·')+'</span><div><strong>Générer les synthèses IA session & apprenants</strong><p>Profils individuels, puis synthèse du groupe.</p><button class="task-action" data-ready-action="generation">Voir l’avancement</button></div><span class="pill '+(gen==='done'?'ok':gen==='failed'?'warn':'neutral')+'">'+statusLabel(gen)+'</span></div></section>';}
function refreshPipeline(){
 $$('[data-ready-process]').forEach(el=>{el.innerHTML=readyMarkup();});
 $$('[data-expand]').forEach(b=>{b.disabled=!pipeline.generated;});
 $$('[data-workspace-gate]').forEach(el=>{el.textContent=pipeline.generated?'L’espace formateur est prêt.':pipeline.summary==='failed'?'La génération a échoué. L’espace reste verrouillé.':'Préparation automatique en cours. L’espace sera accessible après génération des synthèses.';});
 $$('dialog[data-kind="linkedin"]').forEach(drawLinkedin);
 $$('dialog[data-kind="generation"]').forEach(drawGeneration);
}
function drawLinkedin(d){
 const opened=$$('.linkedin-profile[open]',d).map(el=>el.dataset.linkedinPerson);
 const finished=pipeline.linkedin==='partial';
 $('.linkedin-results',d).innerHTML='<div class="collection-summary">'+(finished?'1 profil récupéré · 1 inaccessible · 2 liens non renseignés':'Récupération automatique '+(pipeline.linkedin==='running'?'en cours':'en attente')+'…')+'</div>'+linkedinExamples.map(entry=>{
  const l=learners.find(x=>x.id===entry.id);
  const state=!entry.hasLink?'Lien non renseigné':finished?entry.status:statusLabel(pipeline.linkedin);
  const details=finished&&entry.fields?'<dl class="linkedin-fields">'+entry.fields.map(([label,value])=>'<div><dt>'+escapeHtml(label)+'</dt><dd>'+escapeHtml(value)+'</dd></div>').join('')+'</dl>':'<p class="linkedin-reason">'+escapeHtml(entry.reason||'Le résultat apparaîtra ici après la récupération automatique.')+'</p>';
  return '<details class="linkedin-profile" data-linkedin-person="'+entry.id+'"><summary><span class="avatar '+l.color+'">'+l.initials+'</span><span class="linkedin-name">'+l.name+'<small>'+l.job+'</small></span><span class="pill '+(state==='Récupéré'?'ok':state==='Inaccessible'?'warn':'neutral')+'">'+state+'</span><span class="disclosure-arrow">›</span></summary><div class="linkedin-detail"><p class="profile-source">'+(entry.hasLink?'Lien renseigné · exemple fictif, aucune URL réelle consultée':'Aucun lien renseigné')+'</p>'+details+'<p class="profile-source">Données de démonstration · Aucun scraping réel effectué.</p></div></details>';
 }).join('');
 $$('.linkedin-profile',d).forEach(el=>{el.open=opened.includes(el.dataset.linkedinPerson);});
}
function openLinkedinCollection(){
 const d=modal({title:'Profils LinkedIn des participants',sub:'Résultats de la tâche automatique · Démonstration',kind:'linkedin',body:'<p class="muted">Déplie une personne pour consulter les informations récupérées ou la raison de leur absence. ARD et les notes GHL restent disponibles pour préparer les synthèses.</p><div class="linkedin-results"></div>',footer:'<span class="muted">La récupération ne modifie pas le questionnaire ARD.</span><button class="btn btn-s" data-close>Fermer</button>'});
 drawLinkedin(d);
}
function drawGeneration(d){
 const failed=pipeline.summary==='failed';
 $('.generation-results',d).innerHTML='<ol class="generation-steps"><li>Profils individuels <span class="pill '+(pipeline.profiles==='done'?'ok':'neutral')+'">'+statusLabel(pipeline.profiles)+'</span></li><li>Synthèse du groupe <span class="pill '+(pipeline.summary==='done'?'ok':failed?'warn':'neutral')+'">'+statusLabel(pipeline.summary)+'</span></li></ol><p class="generation-status" role="status">'+(failed?(pipeline.generated?'L’actualisation a échoué. La version précédente reste disponible.':'La génération a échoué. L’espace reste verrouillé ; une relance est possible.'):(pipeline.summary==='done'?'Espace prêt : 4 fiches, dont 1 profil incomplet signalé, et la synthèse du groupe.':'Le traitement se lance automatiquement après la récupération LinkedIn, même si certains profils sont absents ou inaccessibles.'))+'</p><div class="status-line">Sources : questionnaire ARD initial, notes GHL et informations LinkedIn disponibles. Aucun score d’orientation.</div>';
 $('[data-retry-generation]',d).hidden=!failed;
}
function openGeneration(){
 const d=modal({title:'Synthèses IA session & apprenants',sub:'Tâche automatique · Simulation locale, sans appel IA',kind:'generation',narrow:true,body:'<div class="generation-results"></div>',footer:'<button class="btn btn-s" data-close>Fermer</button><button class="btn btn-p" data-retry-generation hidden>Réessayer</button>'});
 drawGeneration(d);
 $('[data-retry-generation]',d).addEventListener('click',()=>runGenerationDemo(false));
}
function runGenerationDemo(fail){
 if(pipeline.profiles==='running'||pipeline.summary==='running')return;
 const revision=++pipeline.revision;
 pipeline.profiles='running';pipeline.summary='waiting';refreshPipeline();
 setTimeout(()=>{
  if(revision!==pipeline.revision)return;
  pipeline.profiles='done';pipeline.summary='running';refreshPipeline();
  setTimeout(()=>{
   if(revision!==pipeline.revision)return;
   pipeline.summary=fail?'failed':'done';
   if(!fail)pipeline.generated=true;
   refreshPipeline();
  },700);
 },800);
}
function beginAutomaticPreparation(){
 pipeline.linkedin='running';refreshPipeline();
 setTimeout(()=>{
  pipeline.linkedin='partial';refreshPipeline();
  runGenerationDemo(new URLSearchParams(location.search).get('scenario')==='echec');
 },900);
}
function restoreRail(){
 if(rail.parentElement!==railHome){railScroll=rail.scrollTop;railHome.insertBefore(rail,railNext);rail.classList.remove('compact-rail');rail.scrollTop=railScroll;}
}
function expandWorkspace(){
 if(!pipeline.generated)return;
 restoreRail();
 const card=$('dialog[data-kind="compact-card"]');
 if(card)card.close();
 $('#compact-stage').hidden=true;$('#workspace').hidden=false;rail.scrollTop=railScroll;$('#reduce-button').focus();
}
const previousOpenCompact=openCompact;
openCompact=function(){
 if($('dialog[data-kind="compact-card"]'))return;
 railScroll=rail.scrollTop;rail.classList.remove('mobile-open');$('#task-toggle').setAttribute('aria-expanded','false');
 const d=modal({title:'Session · 13 & 14 octobre 2026',sub:'Paris · Salle Démo · Formateur Démo',kind:'compact-card',narrow:true,body:'<div data-ready-process></div><div class="compact-summary"><p data-workspace-gate></p></div><div data-compact-rail></div>',footer:'<button class="btn btn-s" data-close>Fermer</button><button class="btn btn-p" data-expand disabled>'+icon('maximize')+'Ouvrir l’espace formateur</button>'});
 $('[data-compact-rail]',d).append(rail);rail.classList.add('compact-rail');rail.scrollTop=railScroll;
 refreshPipeline();d.addEventListener('close',restoreRail);$('[data-expand]',d).addEventListener('click',expandWorkspace);
};
const originalRunAction=runAction;
runAction=function(action){
 if(['profiles','wow',...copiedPages.map(p=>p.id)].includes(action)){
  if(!pipeline.generated)return openGeneration();
  if($('#workspace').hidden)expandWorkspace();
 }
 return originalRunAction(action);
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-ready-action]');
 if(b)(b.dataset.readyAction==='linkedin'?openLinkedinCollection:openGeneration)();
});
const autoButton=document.createElement('button');
autoButton.className='btn btn-s';autoButton.id='automatic-preparation';autoButton.textContent='Préparation automatique';
$('.header-actions').prepend(autoButton);
autoButton.addEventListener('click',()=>{
 const d=modal({title:'Préparation automatique de la session',sub:'Déclenchement à J−14 après confirmation du lancement Qualiobee',kind:'automatic-preparation',body:'<div data-ready-process></div>',footer:'<button class="btn btn-s" data-close>Fermer</button>'});
 refreshPipeline();
});
// Le questionnaire reste dans ARD : aucune édition ni actualisation personnelle dans l’espace.
learners.forEach(l=>{delete l.updated;});
learners[0].source='Exemple pédagogique du scénario de démonstration · Questionnaire ARD initial';
const originalOpenProfile=openProfile;
openProfile=function(id){
 originalOpenProfile(id);
 const d=$('dialog[data-kind="profile"]:last-of-type');
 const showPending=()=>{if(!pipeline.generated)$('.profile-detail',d).innerHTML='<div class="status-line">Le résumé IA n’est pas encore disponible. Les synthèses seront renseignées après la réussite de la préparation automatique.</div>';};
 showPending();
 d.addEventListener('click',e=>{if(e.target.closest('[data-profile-tab="ai"]'))showPending();if(e.target.closest('[data-profile-tab="proof"]')){
  const source=$('.profile-detail .profile-source',d);
  if(source)source.textContent='Preuve ARD originale conservée ; questionnaire non modifiable depuis l’espace apprenant.';
 }});
};
$('#reopen-card').removeEventListener('click',previousOpenCompact);
$('#reopen-card').addEventListener('click',openCompact);
openCompact();
setTimeout(beginAutomaticPreparation,300);
