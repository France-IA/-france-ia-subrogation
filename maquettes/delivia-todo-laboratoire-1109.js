'use strict';
// Laboratoire visuel autonome : aucune API, aucun état métier, aucun envoi.
const root = document.getElementById('modal');
const template = document.getElementById('source-card');
const scenarioSelect = document.getElementById('preview-scenario');
const menu = document.getElementById('preview-action-menu');
const dialog = document.getElementById('preview-detail');
const types = { executee: 'Automatiquement exécutée', detectee: 'Automatiquement détectée', bouton: 'Bouton d’action', manuel: 'Manuel' };
const robot = template.content.querySelector('.tl-nat svg').outerHTML;
const hand = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7c0 4-2 6-6 6h-1c-2 0-4-1-5-3l-4-5a1.6 1.6 0 0 1 2.5-2z"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>';
const caret = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 4.5 3 3 3-3"/></svg>';
const examples = [
  { id: 'done-read', type: 'executee', state: 'ok', text: 'Envoyer le mail de bienvenue avec les accès apprenant et la facture', button: 'Voir l’e-mail', action: 'read', group: 'done' },
  { id: 'done-empty', type: 'manuel', state: 'ok', text: 'Confirmer les informations d’inscription avec l’apprenant', group: 'done' },
  { id: 'single', type: 'bouton', state: 'now', mine: true, lock: true, text: 'Vérifier le contrat et les pièces nécessaires à la finalisation de l’inscription', button: 'Vérifier les pièces', action: 'read', group: 'single' },
  { id: 'menu', type: 'bouton', state: 'now', mine: true, lock: true, text: 'Consulter le mail, préparer une relance ou retrouver les envois précédents', button: 'Gérer l’envoi', action: 'menu', group: 'multiple' },
  { id: 'panel', type: 'bouton', state: 'todo', text: 'Ouvrir le dossier pour consulter, remplacer ou télécharger une pièce', button: 'Ouvrir le dossier', action: 'panel', group: 'multiple' },
  { id: 'manual', type: 'manuel', state: 'now', mine: true, lock: true, text: 'Appeler l’apprenant pour confirmer sa participation', button: 'Valider', action: 'complete', group: 'single' },
  { id: 'detected-empty', type: 'detectee', state: 'todo', lock: true, text: 'Le contrat signé est détecté automatiquement dans le dossier', group: 'none' },
  { id: 'executed-empty', type: 'executee', state: 'todo', text: 'L’espace apprenant se crée automatiquement', group: 'none' },
  { id: 'locked', type: 'bouton', state: 'todo', text: 'Préparer la formation lorsque le contrat sera signé', button: 'Préparer', disabled: true, note: 'Disponible après la signature du contrat.', group: 'blocked' },
  { id: 'error', type: 'executee', state: 'now', mine: true, lock: true, text: 'Créer l’apprenant et l’ajouter à sa session sur Qualiobee', button: 'Relancer', action: 'retry', note: 'La dernière tentative a échoué. Tu peux la relancer.', noteKind: 'error', group: 'blocked' },
  { id: 'other', type: 'manuel', state: 'todo', actor: 'Formateur', text: 'Vérifier les besoins des apprenants avant la formation', button: 'Vérifier', disabled: true, note: 'Action réservée au formateur.', group: 'blocked' },
  { id: 'long', type: 'bouton', state: 'todo', text: 'Vérifier l’ensemble des justificatifs transmis pour finaliser le dossier d’inscription', button: 'Consulter les pièces justificatives', action: 'read', group: 'long' },
  { id: 'bypass', type: 'manuel', state: 'ok', text: 'Contrôle validé exceptionnellement avec une justification', button: 'Voir le motif', action: 'reason', note: 'Contournement · justification conservée', noteKind: 'bypass', group: 'done' },
];
let mode = 'new', variant = 'lines', scenario = 'all', feedbackTimer, menuAnchor, dialogAnchor;
const completed = new Set();

function element(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function natureFor(type, done) {
  const pictogram = type === 'manuel' || type === 'bouton' ? 'main' : 'robot';
  const nature = element('span', `tl-nat ${type} ${pictogram}`);
  nature.setAttribute('role', 'img'); nature.setAttribute('aria-label', types[type]); nature.tabIndex = 0;
  const drawing = element('i', 'ic round'); drawing.setAttribute('aria-hidden', 'true');
  drawing.innerHTML = done ? check : pictogram === 'robot' ? robot : hand;
  const tooltip = element('span', 'tl-tip', types[type]); tooltip.setAttribute('role', 'tooltip');
  nature.append(drawing, tooltip);
  return nature;
}

function makeRow(example) {
  const done = example.state === 'ok' || completed.has(example.id);
  const row = element('div', `tl ${done ? 'ok' : example.state} ${example.mine ? 'mine' : ''}`);
  row.dataset.case = example.id;
  row.append(natureFor(example.type, done));
  const text = element('div', 'tl-m');
  text.append(element('span', 'who', example.actor || 'Closeur'));
  const body = element('span', 'tl-body'); body.append(element('span', 'lbl', example.text));
  if (example.note) body.append(element('span', `preview-case-note ${example.noteKind || ''}`, example.note));
  text.append(body); row.append(text);
  const actions = element('div', 'tl-r');
  if (example.lock && !done) actions.append(template.content.querySelector('.ib.unlock').cloneNode(true));
  if (example.button && !(done && example.action === 'complete')) {
    const button = element('button', 'b2 g', example.button);
    button.type = 'button'; button.id = `action-${example.id}`; button.dataset.action = example.action || 'read';
    button.disabled = !!example.disabled;
    if (example.disabled) button.title = example.note;
    if (example.id === 'long') button.title = example.button;
    if (example.action === 'menu') {
      button.classList.add('multiple'); button.replaceChildren(element('span', 'preview-btn-label', example.button));
      button.insertAdjacentHTML('beforeend', caret);
      button.setAttribute('aria-haspopup', 'menu'); button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', menu.id);
    }
    if (example.action === 'panel') button.setAttribute('aria-haspopup', 'dialog');
    actions.append(button);
  }
  row.append(actions);
  return row;
}

function finishRow(row, label) {
  row.classList.remove('now'); row.classList.add('ok');
  row.querySelector('.ib.unlock')?.remove();
  const button = row.querySelector('.b2');
  if (button) { button.textContent = label; button.classList.remove('p'); button.classList.add('g'); }
  if (mode === 'new') row.querySelector('.tl-nat .ic').innerHTML = check;
}

function transformSource() {
  root.querySelectorAll('.tl').forEach((row, index) => {
    const nature = row.querySelector('.tl-nat'), actions = row.querySelector('.tl-r'), lock = row.querySelector('.ib.unlock');
    row.querySelector('.tl-node').remove();
    const type = Object.keys(types).find(k => nature.classList.contains(k)) || 'manuel';
    nature.classList.remove('attend', 'coupe'); nature.setAttribute('aria-label', types[type]);
    nature.querySelector('.tl-tip').textContent = types[type]; row.prepend(nature);
    if (lock) actions.prepend(lock);
    row.querySelector('.tl-ic').remove();
    const button = actions.querySelector('.b2');
    button.classList.remove('p'); button.classList.add('g');
    button.textContent = ['Préparer l’e-mail', 'Lier les identifiants', 'État de signature'][index];
    button.removeAttribute('title');
  });
}

function applyVariant() {
  closeMenu(false);
  root.classList.toggle('preview-lines', mode === 'new' && ['lines', 'both'].includes(variant));
  root.classList.toggle('preview-hover', mode === 'new' && ['hover', 'both'].includes(variant));
  document.querySelectorAll('[data-variant]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.variant === variant)); b.disabled = mode === 'old';
  });
}

function render() {
  closeMenu(false);
  root.replaceChildren(template.content.cloneNode(true));
  root.classList.toggle('preview-new', mode === 'new');
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  scenarioSelect.disabled = mode === 'old';
  const source = mode === 'old' || scenario === 'card' || scenario === 'stage';
  document.getElementById('done-control').hidden = mode !== 'new' || scenario !== 'card';
  if (mode === 'new' && source) transformSource();
  if (mode === 'new' && !source) {
    const selected = examples.filter(e => scenario === 'all' || e.group === scenario || (scenario === 'none' && e.id === 'done-empty'));
    root.querySelector('.tlist').replaceChildren(...selected.map(makeRow));
    root.querySelector('.stt').textContent = scenarioSelect.selectedOptions[0].textContent;
    const done = selected.filter(e => e.state === 'ok' || completed.has(e.id)).length;
    root.querySelector('.stc').textContent = `${done}/${selected.length}`;
    root.querySelector('.stn').textContent = 'Exemples indépendants';
  }
  if (mode === 'new' && scenario === 'stage') {
    root.querySelectorAll('.tl').forEach((row, i) => finishRow(row, ['Voir l’e-mail', 'Voir l’apprenant', 'État de signature'][i]));
    const stage = root.querySelectorAll('.stepper .st')[1];
    stage.classList.remove('vu'); stage.classList.add('ok'); stage.textContent = '✓';
    stage.setAttribute('aria-label', 'Finalisation de l’inscription — étape terminée');
    root.querySelectorAll('.stepper .stl')[1].classList.add('ok');
    root.querySelector('.stc').textContent = '3/3'; root.querySelector('.stn').textContent = '3/14';
  } else if (source && document.getElementById('done-example').checked) {
    finishRow(root.querySelector('.tl'), 'Voir l’e-mail');
    root.querySelector('.stc').textContent = '1/3'; root.querySelector('.stn').textContent = '1/14';
  }
  document.getElementById('preview-help').textContent = mode === 'old' ? 'Copie de la carte source, avec des identités fictives.' : source ? 'Compare le rendu et survole les icônes.' : 'Cas indépendants · menus et fenêtres cliquables · simulation uniquement.';
  root.querySelector('textarea').setAttribute('readonly', '');
  applyVariant();
}

function explain(text) {
  const notice = document.querySelector('.preview-feedback'); notice.textContent = text; notice.hidden = false;
  clearTimeout(feedbackTimer); feedbackTimer = setTimeout(() => { notice.hidden = true; }, 4500);
}

function closeMenu(restoreFocus = true) {
  if (!menuAnchor) return;
  const anchor = menuAnchor; menuAnchor = null;
  anchor.setAttribute('aria-expanded', 'false'); anchor.closest('.tl')?.classList.remove('menu-open');
  menu.hidden = true; menu.replaceChildren();
  if (restoreFocus && anchor.isConnected) anchor.focus({ preventScroll: true });
}

function openDetail(anchor, title, description, options) {
  closeMenu(false); dialogAnchor = anchor;
  document.getElementById('preview-detail-title').textContent = title;
  document.getElementById('preview-detail-description').textContent = description;
  document.getElementById('preview-detail-result').textContent = '';
  const actions = document.getElementById('preview-detail-actions'); actions.replaceChildren();
  options.forEach(([label, result]) => {
    const button = element('button', '', label); button.type = 'button';
    button.addEventListener('click', () => { document.getElementById('preview-detail-result').textContent = result; });
    actions.append(button);
  });
  dialog.showModal();
}

function openMenu(anchor, last = false) {
  if (menuAnchor === anchor) { closeMenu(); return; }
  closeMenu(false); menuAnchor = anchor;
  anchor.setAttribute('aria-expanded', 'true'); anchor.closest('.tl').classList.add('menu-open');
  const choices = [
    ['Consulter le template', 'Template de bienvenue', 'Bonjour Alex,\nRetrouve tes informations de formation dans ton espace apprenant.\n\nExemple fictif : aucun message envoyé.'],
    ['Préparer une relance', 'Préparer une relance', 'Le formulaire de préparation s’ouvrirait ici. Aucun destinataire réel, aucun envoi depuis cette maquette.'],
    ['Voir l’historique', 'Historique des envois', '11 septembre à 09:00 · Mail de bienvenue.\nHistorique entièrement fictif.'],
  ];
  menu.replaceChildren(...choices.map(([label, title, description]) => {
    const button = element('button', '', label); button.type = 'button'; button.setAttribute('role', 'menuitem');
    button.addEventListener('click', () => openDetail(anchor, title, description, [['Afficher l’aperçu', description]]));
    return button;
  }));
  menu.hidden = false;
  const box = anchor.getBoundingClientRect(), height = menu.getBoundingClientRect().height;
  menu.style.left = `${Math.max(10, Math.min(innerWidth - 248, box.right - 238))}px`;
  menu.style.top = `${Math.max(10, box.bottom + height + 10 < innerHeight ? box.bottom + 5 : box.top - height - 5)}px`;
  const buttons = menu.querySelectorAll('button'); buttons[last ? buttons.length - 1 : 0].focus({ preventScroll: true });
}

menu.addEventListener('keydown', e => {
  const buttons = [...menu.querySelectorAll('button')], index = buttons.indexOf(document.activeElement);
  if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
  else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
    const target = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[target].focus();
  } else if (e.key === 'Tab') { closeMenu(); }
});
document.addEventListener('pointerdown', e => { if (menuAnchor && !menu.contains(e.target) && !menuAnchor.contains(e.target)) closeMenu(false); });
document.addEventListener('focusin', e => { if (menuAnchor && !menu.contains(e.target) && !menuAnchor.contains(e.target)) closeMenu(false); });
root.addEventListener('scroll', () => closeMenu(false), true);
window.addEventListener('resize', () => closeMenu(false));
document.getElementById('preview-detail-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { if (dialogAnchor?.isConnected) dialogAnchor.focus({ preventScroll: true }); dialogAnchor = null; });
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));
document.querySelectorAll('[data-variant]').forEach(b => b.addEventListener('click', () => { variant = b.dataset.variant; applyVariant(); }));
scenarioSelect.addEventListener('change', () => { scenario = scenarioSelect.value; document.getElementById('done-example').checked = false; render(); });
document.getElementById('done-example').addEventListener('change', render);

root.addEventListener('keydown', e => {
  const anchor = e.target.closest('[data-action="menu"]');
  if (anchor && ['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); openMenu(anchor, e.key === 'ArrowUp'); }
});
root.addEventListener('click', e => {
  const button = e.target.closest('button,a'); if (!button || button.disabled) return;
  e.preventDefault();
  if (button.classList.contains('unlock')) {
    openDetail(button, 'Débloquer la tâche', 'Dans l’application, une justification est obligatoire et le contournement est journalisé. Ici, aucun déblocage réel.', [['Voir un exemple de motif', 'Exemple fictif : contrôle déjà effectué et preuve vérifiée par l’équipe.']]);
    return;
  }
  switch (button.dataset.action) {
    case 'menu': openMenu(button); break;
    case 'panel':
      openDetail(button, 'Pièces du dossier', 'Un seul bouton sur la tâche ouvre ici plusieurs actions. Tous les documents de cet aperçu sont fictifs.', [
        ['Consulter', 'Aperçu du justificatif fictif.'], ['Remplacer', 'Le sélecteur de fichier s’ouvrirait ici. Aucun fichier demandé dans la maquette.'], ['Télécharger', 'Le téléchargement serait proposé ici. Aucun document réel accessible.'],
      ]); break;
    case 'complete': {
      const id = button.closest('.tl').dataset.case, scroll = root.querySelector('.mbox').scrollTop;
      completed.add(id); render(); root.querySelector('.mbox').scrollTop = scroll;
      root.querySelector(`[data-case="${id}"] .tl-nat`).focus({ preventScroll: true });
      explain('Coche simulée dans cette page uniquement. Rien n’est enregistré dans DELIV’IA.'); break;
    }
    case 'retry': openDetail(button, 'Relancer l’automatisation', 'Voici la porte de relance manuelle après une erreur. Aucun service n’est contacté dans cette maquette.', [['Simuler la relance', 'Démonstration uniquement : l’automatisation n’a pas été exécutée.']]); break;
    case 'reason': openDetail(button, 'Justification du contournement', 'Exemple fictif : contrôle déjà effectué et preuve vérifiée par l’équipe. La tâche reste identifiable comme un contournement.', [['Voir la trace', 'Équipe de démonstration · 11 septembre à 09:00.']]); break;
    case 'read': openDetail(button, button.textContent.trim(), 'Cette fenêtre représente la consultation du document ou du dossier associé à la tâche. Aucun service connecté.', [['Afficher l’aperçu', 'Contenu de démonstration · aucune donnée réelle.']]); break;
    default: explain('Maquette de présentation : aucun envoi, aucune validation, aucune modification de données.');
  }
});
render();
