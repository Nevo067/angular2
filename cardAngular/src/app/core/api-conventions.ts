/**
 * Conventions front — API HTTP
 *
 * - `environment.apiUrl` pointe la racine JAX-RS (ex. `http://host:8080/api` avec
 *   `quarkus.http.root-path=/api`). Les chemins dans les services doivent être
 *   relatifs à cette racine : `/Card`, `/effects/...`, `/parameters/...`, etc.
 *   Ne pas préfixer une deuxième fois par `/api` (évite `/api/api/...`).
 *
 * - BaseApiService déduplique encore un préfixe `/api/` sur l’endpoint si la base
 *   finit déjà par `/api` (rétrocompatibilité).
 *
 * Persistance relations (Quarkus) : `PUT /Effect` (`EffectPersistRequest`),
 * `PUT /ConditionCard` (`ConditionPersistRequest`, champ `actionIds`),
 * `PUT /ActionCard` (`ActionPersistRequest`, champ optionnel `conditionIds`).
 * Champs de listes absents (`null`) = ne pas modifier ce côté des liaisons.
 *
 * Nouveaux écrans Angular :
 * - Préférer des composants **standalone** (`standalone: true`) pour limiter la
 *   dépendance à `AppModule` ; les écrans existants en NgModule restent tels quels
 *   jusqu’à migration ciblée.
 *
 * Vérification automatisée : `ng build --configuration=production` OK (2026-04-06).
 *
 * QA manuelle (boutons / flux) — à cocher après déploiement local :
 * - Cartes : créer, modifier, export JSON, relations, détail, suppression si présente
 * - Actions : liste, export, édition, paramètres action
 * - Conditions : liste, export, catalogue paramètres, paramètres liaison effet
 * - Effets : liste, édition, relations, paramètres effet, dialogue modifier effet
 * - Paramètres globaux : liste définitions, création définition
 */

export {};
