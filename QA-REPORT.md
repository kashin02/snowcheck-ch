# Rapport QA Complet -- snowcheck.ch

**Date :** 17 février 2026
**Scope :** Application complète (SPA React + Workers Cloudflare + APIs externes)
**Méthode :** Revue par 6 agents spécialisés en parallèle (UX, Qualité de code, Bonnes pratiques, Architecture, Logique/Affichage, Sécurité)

---

## Table des matières

1. [Synthèse exécutive](#1-synthèse-exécutive)
2. [Analyse des bugs signalés](#2-analyse-des-bugs-signalés)
3. [UX / Expérience utilisateur](#3-ux--expérience-utilisateur)
4. [Qualité du code](#4-qualité-du-code)
5. [Respect des bonnes pratiques](#5-respect-des-bonnes-pratiques)
6. [Architecture logicielle](#6-architecture-logicielle)
7. [Logique et cohérence de l'affichage](#7-logique-et-cohérence-de-laffichage)
8. [Sécurité](#8-sécurité)
9. [Plan d'action priorisé](#9-plan-daction-priorisé)

---

## 1. Synthèse exécutive

| Domaine | Critique | Majeur | Mineur | Total |
|---------|----------|--------|--------|-------|
| Bugs signalés | 2 | 1 | -- | 3 |
| UX | 3 | 8 | 10 | 21 |
| Qualité du code | 4 | 10 | 12 | 26 |
| Bonnes pratiques | 5 | 10 | 14 | 29 |
| Architecture | 3 | 6 | 9 | 18 |
| Logique / Affichage | 2 | 2 | 2 | 6 |
| Sécurité | 0 | 3 | 4 | 7 |
| **Total (dédupliqué)** | **~12** | **~18** | **~20** | **~50** |

> Les constats se recoupent fortement entre domaines. Le total dédupliqué reflète les problèmes uniques.

### Verdict global

L'application est fonctionnelle et bien conçue dans sa structure de base, mais elle souffre de **données fallback périmées** (dates de février 2025 encore affichées), d'un **bug de cache routing** qui empêche le NPA de fonctionner dans certains cas, et d'une **absence totale d'accessibilité**. La sécurité est acceptable pour une app sans authentification, avec un risque principal de SSRF sur l'endpoint routing.

---

## 2. Analyse des bugs signalés

### BUG #1 : "Quand on saisit le NPA, rien ne se passe"

**Sévérité : CRITIQUE**

#### Cause racine identifiée

Le flux NPA fonctionne correctement jusqu'au moment de la requête routing. Le problème vient de **trois facteurs combinés** :

**A. Collision de clé de cache serveur** (`functions/api/routing.js:13`)

```js
const cacheKey = `routing:${coords.slice(0, 30)}`;
```

La clé de cache est tronquée à 30 caractères. Après le préfixe `routing:` (8 chars), il ne reste que 22 caractères pour les coordonnées. Une paire lon/lat fait ~15 caractères (ex: `7.9275,46.1082;`). **Seules les coordonnées de l'utilisateur sont capturées, pas celles des stations.** Deux NPA proches (même longitude à quelques décimales près) produisent la même clé de cache et reçoivent des données potentiellement incorrectes.

**B. Cache client localStorage verrouille les données erronées pendant 24h** (`src/hooks/useLocation.js:14-24`)

```js
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24h
```

Si la première requête retourne des données corrompues ou vides (collision cache serveur), le client les cache localement pendant 24h. L'utilisateur ne verra aucun temps de trajet pendant une journée entière.

**C. Aucun feedback visuel en cas d'erreur** (`src/hooks/useLocation.js:134`)

```js
if (data.error) { setTravelTimes(null); return; }
```

Quand le routing échoue, `travelTimes` passe silencieusement à `null`. Aucun message d'erreur n'est affiché. L'interface sans temps de trajet est visuellement identique à "aucun NPA saisi".

#### Correctifs recommandés

1. **Clé de cache** : Utiliser un hash SHA-256 des coordonnées complètes ou simplement le code NPA comme clé
2. **Cache client** : Ne pas cacher un résultat vide (`if (Object.keys(times).length > 0)` avant `writeRoutingCache`)
3. **UX** : Afficher une indication "Calcul des distances..." puis un message d'erreur si le routing échoue

---

### BUG #2 : "Les prévisions montrent depuis samedi alors qu'on est lundi"

**Sévérité : CRITIQUE**

#### Cause racine identifiée

**A. Fallback avec dates codées en dur de février 2025** (`src/App.jsx:14-20`)

```js
const fallbackForecast = [
  { day: "Sam", date: "14.02", ... },
  { day: "Dim", date: "15.02", ... },
  { day: "Lun", date: "16.02", ... },
  ...
];
```

Utilisé à la ligne 74 : `forecast={s.liveForecast || fallbackForecast}`. Quand l'API météo est indisponible ou lente, **TOUTES les stations affichent ce fallback avec des jours/dates de février 2025**.

**B. Règle "jour même puis lendemain dès 15h" correctement implémentée mais fragile**

La logique dans `useDashboardData.js:9-12` est correcte :
```js
function getSwissTargetDayIndex() {
  const nowCH = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
  return nowCH.getHours() >= 14 ? 1 : 0;
}
```

Mais cette même logique est **dupliquée côté serveur** (`weather.js:139-141`) et peut diverger en raison du cache KV de 60 minutes. Le serveur pourrait cacher `targetDayIndex: 0` à 13h55, et le client calculer `targetDayIndex: 1` à 14h05.

**C. `ForecastRow.jsx:17` affiche correctement 5 jours depuis le targetDayIndex**

```js
const displayed = forecast.slice(targetDayIndex, targetDayIndex + 5);
```

Cette partie est correcte. Le problème est uniquement le fallback avec dates périmées.

#### Correctifs recommandés

1. **Supprimer le `fallbackForecast` statique** et le remplacer par un état "données indisponibles" avec des tirets gris
2. **Ajouter la date du jour dans la clé de cache** météo serveur : `weather:all:2026-02-17` pour invalider au changement de jour
3. **Supprimer le `targetDayIndex` côté serveur** (c'est du dead code, le client le recalcule)

---

### BUG #3 (découvert) : Bandeau danger avec données périmées

**Sévérité : MAJEUR**

**Fichier :** `src/components/DangerBanner.jsx:7-14`

Le fallback statique affiche "Danger FORT (4/5) - Lun 16-Mer 18" -- des dates de 2025. Quand l'API avalanche est indisponible, un bandeau DANGER 4 s'affiche avec des informations complètement fausses.

**Correctif :** Ne pas afficher le bandeau quand les données live sont indisponibles, ou afficher clairement "Données avalanches indisponibles".

---

## 3. UX / Expérience utilisateur

### Critiques

| ID | Problème | Fichier(s) |
|----|----------|------------|
| UX-C1 | **Aucune stratégie mobile responsive** -- seule 1 media query sur `.card` à 700px. FilterBar avec 11 boutons région + search + NPA dans un row horizontal scrollable sans indication visuelle. Paddings hardcodés. | `index.css:31`, tous les composants |
| UX-C2 | **Zéro accessibilité** -- aucun attribut ARIA, aucun `role`, aucun `tabIndex`. LocationInput dropdown sans `role="listbox"`. StationCards expandables non focusables au clavier. Contrastes insuffisants (texte #94a3b8 sur blanc = ratio 2.98:1, échec WCAG AA). | Tous les composants |
| UX-C3 | **Google Fonts chargé via `<link>` dans le JSX** au lieu du `<head>` HTML -- provoque un FOUT (Flash of Unstyled Text) visible. | `App.jsx:54` |

### Majeurs

| ID | Problème | Fichier(s) |
|----|----------|------------|
| UX-M1 | **Aucun feedback "Aucun résultat"** quand la recherche NPA ne trouve rien -- le dropdown ne s'ouvre simplement pas. | `LocationInput.jsx:24-31` |
| UX-M2 | **Input NPA trop petit** -- 130px de large, font 12px, cible tactile < 44px minimum. | `LocationInput.jsx:100` |
| UX-M3 | **Scroll horizontal FilterBar invisible** sur mobile -- pas d'affordance (gradient, flèche). | `FilterBar.jsx:16` |
| UX-M4 | **Pas d'état vide** quand les filtres ne retournent rien -- page blanche sans explication. | `App.jsx:68-78` |
| UX-M5 | **Footer avec date hardcodée** "14.02.2026 10:15" + point vert "live" trompeur. | `Footer.jsx:11` |
| UX-M6 | **Bandeau danger fallback** avec dates périmées sans indication. | `DangerBanner.jsx:7-14` |
| UX-M7 | **"Détail du score" ressemble à du texte** -- pas de style bouton, faible discoverabilité de la disclosure progressive. | `StationCard.jsx:168-173` |
| UX-M8 | **Pas d'indicateur de chargement** pour les temps de trajet -- seul l'emoji hourglass change. Les stations se re-trient silencieusement. | `LocationInput.jsx:88` |

### Mineurs

| ID | Problème |
|----|----------|
| UX-m1 | Échelle de tailles de police incohérente (8px à 26px, 13 tailles différentes) |
| UX-m2 | Click sur L0 saute toujours à L0 depuis L2 (pas de retour graduel L2→L1) |
| UX-m3 | **BUG d'affichage** : `&icirc;` dans FilterBar rendu littéralement au lieu de "î" |
| UX-m4 | Input recherche sans bouton "effacer" (contrairement au NPA) |
| UX-m5 | Pas d'indicateur de filtre actif (Header montre toujours le total, pas le filtré) |
| UX-m6 | Styles inline empêchent toute personnalisation utilisateur et dark mode |
| UX-m7 | Animation stagger peut sembler lente avec 50+ stations (dernier = 1s+ de délai) |
| UX-m8 | Alertes avalanche sans lien vers le bulletin SLF officiel |
| UX-m9 | Toggle "Tous" non-standard (click pour désélectionner) |
| UX-m10 | Sélection de jour perdue au collapse/re-expand de la carte |

---

## 4. Qualité du code

### Critiques

| ID | Problème | Fichier(s) |
|----|----------|------------|
| CQ-C1 | **Collision de clé de cache routing** -- `coords.slice(0, 30)` ne capture que les coordonnées utilisateur. | `routing.js:13` |
| CQ-C2 | **Fallback hardcodé avec dates périmées** affiche de fausses informations quand l'API échoue. | `App.jsx:14-20`, `DangerBanner.jsx:7-14` |
| CQ-C3 | **`computeVerdict` et `computeDayScore` dupliquent** la logique de scoring avec risque de divergence. | `useDashboardData.js:79-105` vs `109-160` |
| CQ-C4 | **70% des stations sans mesures neige réelles** -- 56/80 stations utilisent les valeurs hardcodées sans distinction visuelle. | `snow.js:3-8`, `stations.js` |

### Majeurs

| ID | Problème | Fichier(s) |
|----|----------|------------|
| CQ-M1 | **Target day dupliqué** entre serveur et client avec risque de divergence par cache. | `weather.js:139-141`, `useDashboardData.js:9-12` |
| CQ-M2 | **3 hooks fetch identiques** (weather, avalanche, snow) -- 44 lignes de duplication. | `useWeatherData.js`, `useAvalancheData.js`, `useSnowMeasurements.js` |
| CQ-M3 | **`DAYS_FR` dupliqué 3 fois** dans des fichiers différents. | `useDashboardData.js:164`, `weather.js:96`, `StationCard.jsx:6` |
| CQ-M4 | **`DANGER_LABELS` dupliqué** entre serveur et client. | `avalanche.js:11-17`, `DangerBanner.jsx:3` |
| CQ-M5 | **`formatDuration` dupliqué** avec implémentations légèrement différentes (gestion null). | `StationCard.jsx:8-13`, `VerdictBreakdown.jsx:1-7` |
| CQ-M6 | **`crowdCalendar.js` hardcodé** pour la saison 2025-2026 -- deviendra silencieusement inactif après avril 2026. | `crowdCalendar.js:5-54` |
| CQ-M7 | **`isLoading` utilise `&&` au lieu de `\|\|`** -- le skeleton disparaît dès qu'UNE seule API répond. | `useDashboardData.js:195` |
| CQ-M8 | **Dépendance `stations.length` fragile** dans useLocation. | `useLocation.js:156` |
| CQ-M9 | **Pas de try/catch** sur les `fetch()` externes dans les Workers. | `weather.js:126`, `avalanche.js:33` |
| CQ-M10 | **NPA data (162KB) + Map** = deux copies en mémoire, chargées à chaque visite. | `npaData.js`, `useLocation.js:5-8` |

### Mineurs

| ID | Problème |
|----|----------|
| CQ-m1 | Check null redondant : `duration != null && duration !== null` |
| CQ-m2 | Variable `allHolidays` construite mais jamais utilisée dans `crowdCalendar.js` |
| CQ-m3 | `DANGER_LEVELS` exporté mais jamais importé (dead code) |
| CQ-m4 | `SnowStats.jsx` et `LabelValue.jsx` jamais importés (composants morts) |
| CQ-m5 | `DAY_LABELS` dans StationCard = 3ème copie de `DAYS_FR` |
| CQ-m6 | Constantes de couleur dupliquées dans 5+ fichiers sans abstraction |
| CQ-m7 | `verdictConfig[station.verdict]` crashera si verdict est undefined |
| CQ-m8 | `<link>` font dans le body React au lieu du `<head>` |
| CQ-m9 | `stationCoords` dans weather.js (92 entrées) ≠ stations.js (80 entrées) |
| CQ-m10 | Pas de retry/backoff sur les 3 hooks fetch côté client |
| CQ-m11 | `currentSnowDepth` calculé dans weather.js mais jamais utilisé côté client |
| CQ-m12 | Pas de gestion de la taille maximale de l'URL Open-Meteo (~2000 chars pour 81 stations) |

---

## 5. Respect des bonnes pratiques

### Critiques

| ID | Problème | Catégorie |
|----|----------|-----------|
| BP-C1 | **Aucune validation d'entrée** sur le paramètre `coords` dans `routing.js` -- injection d'URL possible. | Sécurité API |
| BP-C2 | **Collision de clé de cache** par troncature à 30 caractères. | Intégrité données |
| BP-C3 | **Aucun Error Boundary React** -- une erreur runtime fait un écran blanc complet. | React patterns |
| BP-C4 | **Aucun rate limiting** sur les 4 endpoints API. | Sécurité API |
| BP-C5 | **162KB de données NPA chargées eagerly** même si la feature n'est jamais utilisée. | Performance |

### Majeurs

| ID | Problème | Catégorie |
|----|----------|-----------|
| BP-M1 | Dates hardcodées dans les fallbacks (février 2025). | Maintenance |
| BP-M2 | 3 hooks fetch identiques -- violation DRY sévère. | DRY |
| BP-M3 | Coordonnées stations dupliquées entre front et back. | Source unique de vérité |
| BP-M4 | Calendrier de fréquentation limité à 2025-2026. | Maintenance |
| BP-M5 | **Zéro attribut ARIA / a11y** dans l'application entière. | Accessibilité |
| BP-M6 | Google Fonts dans le JSX au lieu du `<head>`. | Performance |
| BP-M7 | Score computation O(stations x forecastDays) à chaque changement de données. | Performance |
| BP-M8 | `Access-Control-Allow-Origin: *` sur tous les endpoints. | Sécurité |
| BP-M9 | Aucun retry/refresh sur les fetches côté client. | Résilience |
| BP-M10 | Aucune suite de tests (0 fichier test, 0 dépendance test). | Qualité |

### Mineurs

| ID | Problème |
|----|----------|
| BP-m1 | Pas de code splitting via `React.lazy`/`Suspense` |
| BP-m2 | Index comme `key` dans DangerBanner |
| BP-m3 | `isLoading` avec `&&` au lieu de `\|\|` |
| BP-m4 | Liste de régions hardcodée peut diverger des stations |
| BP-m5 | `formatDuration` dupliqué |
| BP-m6 | IMIS codes non synchronisés entre front et back |
| BP-m7 | Tous les styles inline -- impossible d'utiliser pseudo-classes, media queries, dark mode |
| BP-m8 | Pas de manifest PWA ni service worker |
| BP-m9 | SEO limité (SPA sans SSR, pas de données structurées) |
| BP-m10 | `DANGER_LEVELS` exporté mais jamais utilisé |
| BP-m11 | Pas de lint dans le pipeline CI/CD |
| BP-m12 | `compatibility_date` dans wrangler.toml obsolète (2024-01-01) |
| BP-m13 | Erreurs KV silencieusement avalées (9 blocs `catch {}` vides) |
| BP-m14 | Dépendance useEffect instable sur `stations.length` |

---

## 6. Architecture logicielle

### Vue d'ensemble

```
Client (React SPA)          Cloudflare Pages         Workers Functions        APIs externes
┌─────────────────┐        ┌──────────────┐        ┌──────────────────┐      ┌────────────────┐
│  App.jsx        │        │              │        │  /api/weather    │─────▶│  Open-Meteo    │
│  ├─ Header      │◀──────▶│  Static +    │◀──────▶│  /api/snow       │─────▶│  SLF IMIS      │
│  ├─ DangerBanner│        │  Functions   │        │  /api/avalanche  │─────▶│  SLF CAAML     │
│  ├─ FilterBar   │        │              │        │  /api/routing    │─────▶│  OSRM          │
│  │  └─ Location │        └──────────────┘        └──────────────────┘      └────────────────┘
│  ├─ StationCards│                                        │
│  └─ Footer      │                                  Cloudflare KV
└─────────────────┘                                  (cache avec TTL)
```

### Critiques

| ID | Problème | Impact |
|----|----------|--------|
| AR-C1 | **Clé de cache routing tronquée** provoquant des collisions entre NPA proches. | Données incorrectes pour les utilisateurs |
| AR-C2 | **Coordonnées stations dupliquées** entre `weather.js` (92 entrées) et `stations.js` (80 entrées) sans source unique de vérité. Le mapping est par index -- une seule ligne décalée corrompt toutes les données suivantes. | Fragilité extrême des données |
| AR-C3 | **Logique target day dupliquée** entre serveur (cachée 60min) et client (recalculée live). Le serveur calcule une valeur que le client ignore. | Confusion, code mort, divergence potentielle |

### Majeurs

| ID | Problème | Impact |
|----|----------|--------|
| AR-M1 | **Aucun retry, timeout ou circuit-breaking** sur les appels API externes. Un échec transitoire d'Open-Meteo = plus aucune donnée météo jusqu'à expiration du cache. | Tolérance aux pannes faible |
| AR-M2 | **Score calculé côté client** sans versioning -- 567 appels à `computeVerdict` x3 pendant le chargement initial (3 APIs répondent séquentiellement, chacune déclenche un recalcul complet). | Performance mobile, pas de comparaison entre sessions |
| AR-M3 | **162KB NPA data** chargé synchroniquement au démarrage pour tous les utilisateurs. | Bundle size, performance mobile |
| AR-M4 | **Aucune validation d'input** sur `/api/routing`. | Vecteur d'abus (SSRF, DoS amplification) |
| AR-M5 | **CORS `*` sur tous les endpoints** -- tout site tiers peut consommer l'API. | Coûts Cloudflare non contrôlés |
| AR-M6 | **Tout en inline styles** -- pas de système CSS, pas de thème, pas de responsive, pas de dark mode. | Dette technique croissante |

### Évaluation par dimension

| Dimension | Note | Commentaire |
|-----------|------|-------------|
| Séparation des responsabilités | B | Hooks bien séparés, mais scoring mélangé avec enrichissement |
| Scalabilité | C | Conçu pour 81 stations fixes, pas de pagination/virtualisation |
| Maintenabilité | C+ | Code compact (~2500 LOC) mais données dupliquées et styles inline |
| Flux de données | B+ | Unidirectionnel correct, mais mapping par index fragile |
| Stratégie de cache | C | Fonctionnelle mais naive (pas de stale-while-revalidate, clé routing cassée) |
| Design API | B- | Endpoints clairs, mais pas de validation, pas de versioning |
| Déploiement | A- | Cloudflare Pages + Workers = excellent fit pour ce use case |
| Tolérance aux pannes | D | Pas de retry, pas de circuit-breaker, fallbacks avec données périmées |
| Extensibilité | C | Ajout d'une source de données = modifications dans 3+ fichiers |

---

## 7. Logique et cohérence de l'affichage

### Critiques

| ID | Problème | Fichier | Impact |
|----|----------|---------|--------|
| LG-C1 | **Fallback forecast avec dates périmées** (Sam 14.02 de 2025) affiché pour toutes les stations quand l'API météo est indisponible. | `App.jsx:14-20` | Toutes les stations affichent des prévisions fausses |
| LG-C2 | **Routing cache collision** + **cache client 24h** verrouillent des données vides/incorrectes. | `routing.js:13`, `useLocation.js:14-24` | Le NPA semble ne rien faire |

### Majeurs

| ID | Problème | Fichier | Impact |
|----|----------|---------|--------|
| LG-M1 | **Bandeau danger avec alertes d'il y a un an** quand l'API avalanche est down. | `DangerBanner.jsx:7-14` | Information de sécurité trompeuse |
| LG-M2 | **`fresh72` ne tient pas compte de la fonte** -- calcul `max(0, currentHS - oldHS)` sous-estime la neige fraîche en cas de redoux. | `snow.js:47` | Scores de neige fraîche sous-estimés |

### Mineurs

| ID | Problème | Fichier | Impact |
|----|----------|---------|--------|
| LG-m1 | **`computeCalendarCrowdScore` utilise UTC** (`toISOString()`) -- peut donner la mauvaise date entre minuit et 1h heure suisse. | `crowdCalendar.js:66` | Score foule décalé d'un jour pendant 1h |
| LG-m2 | Variable `snowBase` utilisée comme "Sommet" (étiquetage correct dans l'UI, nommage confus dans le code). | `SnowStats.jsx:8` | Clarté du code uniquement |

### Points vérifiés sans problème

- Affichage `pistesOpen/pistesTotal` en km : correct et cohérent avec le scoring
- Échelle `scoreSun` avec plafond à 8h : appropriée pour le contexte alpin suisse hivernal
- Règle "après 14h → lendemain" : correctement implémentée (`getSwissTargetDayIndex()`)
- Slice du forecast à 5 jours depuis targetDayIndex : correct (`forecast.slice(targetDayIndex, targetDayIndex + 5)`)

---

## 8. Sécurité

### Points positifs

- **Aucun XSS** détecté -- React JSX auto-escape, pas de `dangerouslySetInnerHTML`
- **Aucun secret dans le code** -- API token Cloudflare dans GitHub Secrets
- **0 vulnérabilité npm** (`npm audit` clean)
- **Surface d'attaque minimale** -- seulement React + ReactDOM en prod dependencies
- **`rel="noopener noreferrer"`** sur tous les liens externes
- **AbortController** correctement utilisé dans useLocation
- **Messages d'erreur API** génériques (pas de stack traces exposées)

### Hauts

| ID | Problème | CVSS | Fichier |
|----|----------|------|---------|
| SEC-H1 | **SSRF via paramètre `coords` non validé** -- injection de chemin dans l'URL OSRM. Un attaquant peut envoyer `coords=../../admin/...` ou des centaines de coordonnées pour causer un DoS sur OSRM. | 7.2 | `routing.js:6,27` |
| SEC-H2 | **Cache poisoning** via collision de clé tronquée -- un attaquant peut pré-remplir le cache avec de fausses données. | 6.5 | `routing.js:13` |
| SEC-H3 | **Aucun rate limiting** -- flooding illimité des endpoints, épuisement des quotas Workers/KV. | 6.5 | Tous les endpoints |

### Moyens

| ID | Problème | CVSS | Fichier |
|----|----------|------|---------|
| SEC-M1 | **CORS wildcard `*`** sur tous les endpoints -- tout site peut consommer l'API. | 5.3 | Tous les Workers |
| SEC-M2 | **Pas de CSP** ni headers de sécurité (X-Frame-Options, X-Content-Type-Options). | 4.7 | Pas de fichier `_headers` |
| SEC-M3 | **Google Fonts externe** sans SRI -- privacy concern RGPD/LPD (IP + user-agent envoyés à Google). | 4.3 | `constants.js:1` |
| SEC-M4 | **KV namespace IDs** dans le code source (wrangler.toml). | 3.1 | `wrangler.toml:6-8` |

---

## 9. Plan d'action priorisé

### Immédiat (avant la prochaine mise en production)

| # | Action | Fichier(s) | Effort | Impact |
|---|--------|------------|--------|--------|
| 1 | **Valider le paramètre `coords`** avec regex `^[\d.,;-]+$` + cap à 100 paires | `routing.js` | 30min | SSRF fix |
| 2 | **Corriger la clé de cache routing** -- utiliser hash ou NPA comme clé | `routing.js:13` | 30min | Bug NPA fix |
| 3 | **Supprimer le fallback forecast statique** -- remplacer par "données indisponibles" | `App.jsx:14-20,74` | 1h | Bug prévisions fix |
| 4 | **Supprimer le fallback danger statique** -- ne pas afficher quand données indisponibles | `DangerBanner.jsx:7-14` | 30min | Sécurité avalanche |
| 5 | **Corriger le Footer** -- utiliser `lastUpdate` dynamique au lieu de la date hardcodée | `Footer.jsx:11` | 15min | Crédibilité données |
| 6 | **Ne pas cacher un résultat routing vide** côté client | `useLocation.js:148` | 15min | Bug NPA fix |
| 7 | **Fixer le bug HTML entity** `&icirc;` dans FilterBar | `FilterBar.jsx:13` | 5min | Affichage cassé |

### Court terme (1-2 semaines)

| # | Action | Fichier(s) | Effort | Impact |
|---|--------|------------|--------|--------|
| 8 | **Ajouter un Error Boundary React** autour de `<App />` | `main.jsx` | 1h | Résilience |
| 9 | **Restreindre CORS** à `snowcheck.ch` | Tous les Workers | 1h | Sécurité |
| 10 | **Ajouter un fichier `_headers`** avec CSP, X-Frame-Options, etc. | `public/_headers` | 1h | Sécurité |
| 11 | **Extraire un hook générique `useFetchApi(url)`** pour les 3 hooks fetch identiques | `src/hooks/` | 2h | DRY, maintenabilité |
| 12 | **Unifier `computeVerdict` et `computeDayScore`** en une seule fonction | `useDashboardData.js` | 2h | Cohérence scoring |
| 13 | **Corriger `isLoading`** : utiliser `||` ou une logique progressive explicite | `useDashboardData.js:195` | 30min | UX chargement |
| 14 | **Ajouter feedback NPA** : "Aucun résultat" + erreur routing + indicateur de chargement | `LocationInput.jsx` | 2h | UX |
| 15 | **Déplacer le `<link>` fonts** dans `index.html` avec preconnect | `index.html`, `App.jsx` | 15min | Performance |
| 16 | **Ajouter `npm run lint` dans le CI** | `.github/workflows/` | 30min | Qualité |
| 17 | **Self-hoster les Google Fonts** (WOFF2 locaux) | `public/fonts/` | 2h | RGPD/LPD + performance |
| 18 | **Supprimer les composants/exports morts** : `SnowStats.jsx`, `LabelValue.jsx`, `DANGER_LEVELS` | Divers | 30min | Propreté |

### Moyen terme (1-2 mois)

| # | Action | Fichier(s) | Effort | Impact |
|---|--------|------------|--------|--------|
| 19 | **Extraire les coordonnées stations** dans un fichier JSON partagé front/back | `stations.json` partagé | 4h | Source unique de vérité |
| 20 | **Lazy-load npaData** via `import()` dynamique au focus de l'input | `useLocation.js` | 2h | -80KB bundle initial |
| 21 | **Ajouter une suite de tests** pour le scoring (`computeVerdict`, `computeDayScore`, `proximityBonus`) | `src/__tests__/` | 8h | Fiabilité |
| 22 | **Ajouter rate limiting** sur les Workers (Cloudflare Rate Limiting) | Workers config | 4h | Sécurité |
| 23 | **Implémenter retry + timeout** sur les appels API externes | Workers + hooks | 4h | Résilience |
| 24 | **Ajouter les attributs ARIA essentiels** (LocationInput, StationCard, DangerBanner) | Composants | 8h | Accessibilité |
| 25 | **Implémenter un système CSS** (CSS Modules ou Tailwind) pour les composants | Tous les composants | 16h+ | Maintenabilité |
| 26 | **Extraire les constantes partagées** (DAYS_FR, couleurs, DANGER_LABELS) dans un module commun | `src/data/` | 2h | DRY |

### Long terme (prochaine saison)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 27 | **Automatiser la mise à jour du calendrier de fréquentation** ou le rendre data-driven | 4h | Pérennité |
| 28 | **Migrer vers TypeScript** pour les types de données complexes | 16h+ | Type safety |
| 29 | **Ajouter un manifest PWA** + service worker pour le mode offline | 8h | UX mobile |
| 30 | **Ajouter un mode responsive complet** avec breakpoints mobile/tablet/desktop | 16h+ | UX mobile |
| 31 | **Distinguer visuellement les stations avec/sans données neige réelles** | 2h | Transparence données |

---

## Annexe : Fichiers analysés

| Fichier | Lignes | Rôle |
|---------|--------|------|
| `src/App.jsx` | 85 | Composant racine |
| `src/main.jsx` | 10 | Point d'entrée React |
| `src/index.css` | 33 | Styles globaux (minimal) |
| `src/hooks/useDashboardData.js` | 260 | Orchestration données + scoring |
| `src/hooks/useLocation.js` | 160 | NPA + routing OSRM |
| `src/hooks/useWeatherData.js` | 22 | Fetch météo |
| `src/hooks/useAvalancheData.js` | 22 | Fetch avalanches |
| `src/hooks/useSnowMeasurements.js` | 22 | Fetch neige SLF |
| `src/components/StationCard.jsx` | 190 | Carte station (3 niveaux) |
| `src/components/ForecastRow.jsx` | 73 | Prévisions 5 jours |
| `src/components/VerdictBreakdown.jsx` | 150 | Détail du score |
| `src/components/FilterBar.jsx` | 37 | Barre de filtres |
| `src/components/LocationInput.jsx` | 141 | Input NPA autocomplete |
| `src/components/Header.jsx` | 21 | En-tête |
| `src/components/Footer.jsx` | 16 | Pied de page |
| `src/components/DangerBanner.jsx` | 66 | Bandeau alertes |
| `src/components/ErrorMessage.jsx` | 16 | Message d'erreur |
| `src/components/SnowStats.jsx` | 15 | (non utilisé) |
| `src/components/LabelValue.jsx` | 10 | (non utilisé) |
| `src/components/StationCardSkeleton.jsx` | 23 | Skeleton loading |
| `src/data/stations.js` | 812 | Données statiques 81 stations |
| `src/data/npaData.js` | 4087 | Codes postaux suisses |
| `src/data/constants.js` | 17 | Constantes (verdicts, fonts) |
| `src/data/regions.js` | 1 | Liste des régions |
| `src/data/crowdCalendar.js` | 108 | Calendrier scolaire 2025-2026 |
| `functions/api/weather.js` | 217 | Worker météo (Open-Meteo) |
| `functions/api/snow.js` | 74 | Worker neige (SLF IMIS) |
| `functions/api/avalanche.js` | 92 | Worker avalanches (SLF CAAML) |
| `functions/api/routing.js` | 62 | Worker routing (OSRM) |
| `functions/api/health.js` | 7 | Healthcheck |
