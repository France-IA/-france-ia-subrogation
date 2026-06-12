# Tampon de subrogation — FRANCE IA × Bibby Factor France

Outil web autonome (un seul fichier HTML) pour apposer la mention de subrogation
Bibby Factor France sur les factures FRANCE IA, à la place des coordonnées de paiement d'origine.

## Utilisation

Ouvre `index.html` dans un navigateur. Tout s'exécute **en local** — aucune facture n'est envoyée sur Internet.

1. **Facture** — glisse un PDF (ou plusieurs en mode lot).
2. **Cache** — un rectangle se cale sur le bloc « Détails du paiement » et se fond dans la couleur du fond.
3. **Bloc Bibby** — la mention de subrogation est imprimée, centrée dans la bande grise, au-dessus de la ligne de pied de page. Le texte s'ajuste automatiquement pour tenir dans la zone.
4. **Téléchargement** — le PDF tamponné est généré côté navigateur. La page tamponnée est aplatie (image) pour que l'ancien IBAN disparaisse du calque texte.
5. **Mode lot** — dépose plusieurs PDF, applique les mêmes réglages à tous, récupère un ZIP.

## Détails techniques

- Pas de dépendance serveur. Librairies chargées depuis cdnjs : `pdf.js` (rendu/aperçu), `pdf-lib` (génération), `jszip` (export lot).
- Le cache adopte automatiquement la couleur de fond détectée (utile sur fond gris/coloré).
- L'aplatissement de la page tamponnée garantit que les anciennes coordonnées ne sont plus lisibles par un logiciel comptable.

## Sécurité

Ce dépôt contient les coordonnées bancaires du factor (Bibby Factor France) inscrites en
dur dans l'outil. **À conserver en dépôt privé.**
