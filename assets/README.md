# Assets GHL — CSS des formulaires embarqués

Fichiers **en production**, chargés par les champs Custom CSS de GHL via `@import`
(l'éditeur GHL corrompt les collages longs, on n'y met qu'une ligne d'import).
Hébergés ici (GitHub Pages) pour être indépendants du cycle de vie de franceia.com.

| Fichier | Consommateur GHL | Ligne dans le champ Custom CSS |
|---|---|---|
| `ghl-rdv.css` | Formulaire « Prendre RDV - DIRECT SUR LP » (calendrier xmUIlzi9RNmW0HreiTRe, LP /cta-rdv) | `@at-root{@import url("https://france-ia.github.io/-france-ia-subrogation/assets/ghl-rdv.css");}` |
| `ghl-programme.css` | Formulaire « Demande programme » (oBcuG79krDx5mh9zv2fG, home + /preview-v2) | `@at-root{@import url("https://france-ia.github.io/-france-ia-subrogation/assets/ghl-programme.css");}` |

⚠️ Ne pas supprimer ni renommer : les formulaires du site perdraient leur habillage.
Modifier = éditer ici + merger ; GitHub Pages propage en ~2 min (cache 10 min max).
