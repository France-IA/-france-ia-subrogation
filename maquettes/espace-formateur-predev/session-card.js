/* Présentation de la carte issue de DELIV’IA v182 (popup, TaskRow, Board).
 * Seuls les adaptateurs de données et d’actions sont remplacés par cette démo locale.
 * L’article #task-rail ne quitte jamais son parent et n’est jamais reconstruit à l’ouverture. */
'use strict';
const sessionShell=$('#modal'),sessionCard=$('#task-rail'),trainerPanel=$('#workspace');
const nativeTraits={
 main:'<path d="M18 11V6a2 2 0 0 0-4 0v1"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
 lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 check:'<path d="m5 12 4 4L19 6"/>'
};
const nativeIcon=(name)=>'<i class="ic round" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+nativeTraits[name]+'</svg></i>';
const sessionSteps=[
 {id:'prendre',label:'À prendre',items:[['Accepter la session','external','Voir la session']]},
 {id:'prep',label:'Préparer',date:'le 29 septembre',...tasks[0]},
 {id:'formation',label:'Animer',date:'le 13 octobre',...tasks[1]},
 {id:'facturer',label:'Facturer',date:'après la formation',items:[['Déposer ma facture','external','Déposer']]},
 {id:'termine',label:'Terminé',items:[]},
 {id:'retrait',label:'Retrait',items:[]}
];
completed.add('prendre-0');
let sessionStep=1,workspaceExpanded=false,mobileCard=false;
const compactMedia=matchMedia('(max-width:1199px)');
const stepItems=step=>step.items||step.groups.flatMap(g=>g[1]);
function renderSessionTasks(){
 const step=sessionSteps[sessionStep],items=stepItems(step);
 const indexed=stepItems(step).map((item,i)=>({id:step.id+'-'+i,item}));
 const required=indexed.filter(t=>!t.item[3]?.optional);
 const all=sessionSteps.flatMap(s=>stepItems(s).map((t,i)=>({id:s.id+'-'+i,item:t}))).filter(t=>!t.item[3]?.optional);
 $('#session-stepper').innerHTML=sessionSteps.map((s,i)=>{const done=stepItems(s).length>0&&stepItems(s).every((t,j)=>t[3]?.optional||completed.has(s.id+'-'+j));return (i?'<span class="stl"></span>':'')+'<button class="st '+(done?'ok':i===sessionStep?'vu':i===1?'cur':'')+'" data-step="'+i+'" title="'+s.label+'" aria-label="'+s.label+'" '+(i===sessionStep?'aria-current="step"':'')+'>'+(done?'✓':i+1)+'</button>';}).join('')+'<span class="stn">'+all.filter(t=>completed.has(t.id)).length+'/'+all.length+'</span>';
 $('#step-title').textContent=step.label;$('#step-date').textContent=step.date?'Ouverture '+step.date:'';
 $('#step-count').textContent=required.filter(t=>completed.has(t.id)).length+'/'+required.length;
 $('#previous-step').disabled=sessionStep===0;$('#next-step').disabled=sessionStep===sessionSteps.length-1;
 let counter=0;
 const row=item=>{const id=step.id+'-'+counter++,done=completed.has(id);const state=done?'ok':counter===items.findIndex((t,i)=>!t[3]?.optional&&!completed.has(step.id+'-'+i))+1?'now':'todo';
 return '<div class="tl todo-card '+state+' mine" data-task-id="'+id+'" data-task-key="'+(item[3]?.key||id)+'" '+(item[3]?.optional?'data-optional="true"':'')+'><span class="tl-nat manuelle main tl-node" role="img" aria-label="'+(done?'Tâche terminée':'Tâche manuelle')+'">'+nativeIcon(done?'check':'main')+'</span><div class="tl-m"><span class="who">Formateur</span><span class="tl-body"><span class="lbl">'+escapeHtml(item[0])+(item[3]?.optional?'<small class="task-optional">Facultatif</small>':'')+'</span></span></div><div class="tl-r"><span class="tl-ic"></span><div class="tl-action-slot"><button class="tl-primary" data-task-action="'+id+'" title="'+escapeHtml(item[2]|| (done?'Repasser à faire':'Valider'))+'"><span>'+escapeHtml(item[2]||(done?'Terminée':'Valider'))+'</span></button></div></div></div>';};
 $('#task-list').innerHTML=step.groups?step.groups.map(g=>'<div class="tl-g">'+escapeHtml(g[0])+'</div>'+g[1].map(row).join('')).join(''):items.length?items.map(row).join(''):'<p class="empty">Aucune tâche à cette étape.</p>';
 updateWorkspaceAccess();
}
function updateWorkspaceAccess(){
 const allowed=sessionStep===1||sessionStep===2;
 $$('[data-expand]').forEach(b=>{b.disabled=!pipeline.generated||!allowed;b.title=!allowed?'Disponible aux étapes Préparer et Animer':!pipeline.generated?(pipeline.summary==='failed'?'Synthèses indisponibles — contacter l’administration':'Les synthèses sont en préparation'):'Ouvrir l’espace formateur';});
}
function selectSessionStep(i){sessionStep=Math.max(0,Math.min(i,sessionSteps.length-1));renderSessionTasks();}
$('#session-stepper').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(b)selectSessionStep(Number(b.dataset.step));});
$('#previous-step').addEventListener('click',()=>selectSessionStep(sessionStep-1));
$('#next-step').addEventListener('click',()=>selectSessionStep(sessionStep+1));
$('#task-list').addEventListener('click',e=>{
 const b=e.target.closest('[data-task-action]');if(!b)return;
 const step=sessionSteps[sessionStep],i=Number(b.dataset.taskAction.split('-').pop()),item=stepItems(step)[i];
 if(item[1])return runAction(item[1]);
 completed.has(b.dataset.taskAction)?completed.delete(b.dataset.taskAction):completed.add(b.dataset.taskAction);
 renderSessionTasks();$('[data-task-action="'+b.dataset.taskAction+'"]')?.focus({preventScroll:true});
});
function syncWorkspaceVisibility(){
 const cardOnly=compactMedia.matches&&workspaceExpanded&&mobileCard;
 sessionShell.classList.toggle('expanded',workspaceExpanded);sessionShell.classList.toggle('show-card',cardOnly);
 trainerPanel.inert=!workspaceExpanded||cardOnly;trainerPanel.setAttribute('aria-hidden',String(trainerPanel.inert));
 sessionCard.inert=compactMedia.matches&&workspaceExpanded&&!mobileCard;
 $('#task-toggle').setAttribute('aria-expanded',String(cardOnly));
 $('.card-expand span:last-child').textContent='Espace formateur';
 sessionShell.setAttribute('aria-labelledby',workspaceExpanded?'trainer-title':'session-title');
}
function expandWorkspace(){
 if(!pipeline.generated||![1,2].includes(sessionStep))return;
 workspaceExpanded=true;mobileCard=false;syncWorkspaceVisibility();
 setTimeout(()=>{if(workspaceExpanded&&!trainerPanel.inert&&$$('dialog[open]').at(-1)===sessionShell)$('#reduce-button').focus({preventScroll:true});},180);
}
function showTrainerPanel(){if(workspaceExpanded){mobileCard=false;syncWorkspaceVisibility();}}
function reduce(){
 if(!workspaceExpanded)return;
 workspaceExpanded=false;mobileCard=false;syncWorkspaceVisibility();
 $('.card-expand').focus({preventScroll:true});
}
function openCompact(){
 if(sessionShell.open)return;
 workspaceExpanded=false;mobileCard=false;syncWorkspaceVisibility();sessionShell.showModal();
 document.body.classList.add('session-open');
 $('#close-session').focus({preventScroll:true});
}
function closeSession(){sessionShell.close();document.body.classList.remove('session-open');$('#reopen-card')?.focus({preventScroll:true});}
sessionShell.addEventListener('cancel',e=>{e.preventDefault();workspaceExpanded?reduce():closeSession();});
sessionShell.addEventListener('click',e=>{if(e.target===sessionShell)workspaceExpanded?reduce():closeSession();});
$('#close-session').addEventListener('click',()=>workspaceExpanded?reduce():closeSession());
$$('[data-expand]').forEach(b=>b.addEventListener('click',expandWorkspace));
$('#reduce-button').addEventListener('click',reduce);
$('#task-toggle').addEventListener('click',()=>{mobileCard=true;syncWorkspaceVisibility();$('.card-expand').focus({preventScroll:true});});
compactMedia.addEventListener('change',()=>{mobileCard=false;syncWorkspaceVisibility();});
const originalRunAction=runAction;
runAction=function(action){
 if(['profiles','wow',...copiedPages.map(p=>p.id)].includes(action)){
  if(!pipeline.generated)return toast(pipeline.summary==='failed'?'Synthèses indisponibles — contacter l’administration.':'Les synthèses sont en préparation.');
  if(!workspaceExpanded)expandWorkspace();else showTrainerPanel();
 }
 return originalRunAction(action);
};
function openTrainerProcess(){modal({title:'Process complet Sessions N1',kind:'trainer-process',body:sessionSteps.map(s=>'<section class="trainer-process-step"><h3>'+s.label+'</h3><ul>'+stepItems(s).map(t=>'<li>'+escapeHtml(t[0])+(t[3]?.optional?' <small class="task-optional">Facultatif</small>':'')+'</li>').join('')+'</ul></section>').join(''),footer:'<button class="btn btn-s" data-close>Fermer</button>'});}
$('#process-button').addEventListener('click',openTrainerProcess);
$('[data-session-details]').addEventListener('click',()=>modal({title:'Informations de la session',kind:'session-details',body:'<p>Paris · Salle Démo<br>13 et 14 octobre 2026 · Niveau 1<br>4 apprenants · Formateur Démo</p>',footer:'<button class="btn btn-s" data-close>Fermer</button>'}));
function renderBoard(offer='Sessions N1'){
 const names=['À prendre','Préparer','Animer','Facturer','Terminé','Retrait'];
 $('#session-board').innerHTML=names.map((name,i)=>'<section class="col"><div class="col-h"><span class="pill"></span><h3>'+name+'</h3><span class="n">'+(i===1&&offer==='Sessions N1'?1:0)+'</span></div><div class="colbody">'+(i===0?'<div class="card pointer-card"><div class="t">Sessions disponibles au shotgun</div><button class="ilink" data-demo-link="À prendre">Rendez-vous sur la page À prendre</button></div>':'')+(i===1&&offer==='Sessions N1'?'<button class="card haslock st-locked" id="reopen-card"><div class="t">Paris · Salle Démo<br>13/10 - 14/10</div><div class="places">4 / 7 (+ 0 en cours d’inscription)</div><div class="lockmid"><span class="lockico">'+nativeIcon('lock')+'</span><div class="lm-x"><div class="lm-t">Préparer</div><div class="lm-d">Ouverture le 29 septembre</div><div class="lm-r">J−14 formation</div></div></div></button>':'')+'</div></section>').join('');
 $('#reopen-card')?.addEventListener('click',openCompact);
 $('#board-hint').textContent=offer==='Sessions N1'?'':'Aucune prestation de démonstration dans cette vue.';
}
$('#offer-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-offer]');if(!b)return;$$('[data-offer]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderBoard(b.dataset.offer);});
$('#my-tasks').addEventListener('click',e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(on));$('#board-hint').textContent=on?'La session affichée contient tes tâches.':'';});
$('#back-to-card').addEventListener('click',()=>{if(sessionShell.open)closeSession();});
$('#sidebar-toggle').addEventListener('click',e=>{if(innerWidth<=700){$('#app').classList.remove('sidebar-collapsed');const open=$('#sidebar').classList.toggle('mobile-nav');e.currentTarget.setAttribute('aria-expanded',String(open));}else{const collapsed=$('#app').classList.toggle('sidebar-collapsed');e.currentTarget.setAttribute('aria-expanded',String(!collapsed));}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-demo-link]');if(b)toast(b.dataset.demoLink+' : hors périmètre de cette maquette.');});
renderBoard();renderSessionTasks();
setTimeout(beginAutomaticPreparation,300);
