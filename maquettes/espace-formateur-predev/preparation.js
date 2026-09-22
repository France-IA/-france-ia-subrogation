/* Maquette : automatisations J−14 simulées ; aucun appel à Qualiobee, LinkedIn ou une IA. */
'use strict';
const pipeline={linkedin:'waiting',profiles:'waiting',summary:'waiting',generated:false,revision:0};
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
 if(typeof updateWorkspaceAccess==='function')updateWorkspaceAccess();
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
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-ready-action]');
 if(b)(b.dataset.readyAction==='linkedin'?openLinkedinCollection:openGeneration)();
});
learners.forEach(l=>{delete l.updated;});
learners[0].source='Questionnaire ARD initial · Notes GHL · LinkedIn disponible';
