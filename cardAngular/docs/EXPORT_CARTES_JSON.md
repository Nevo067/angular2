# Export JSON des cartes

L’export est déclenché depuis **Gestion des Cartes** via le bouton **Exporter en JSON**. Le fichier téléchargé contient toutes les cartes avec leurs effets, conditions, actions et paramètres associés.

## En-tête du fichier

| Champ           | Type   | Description |
|-----------------|--------|-------------|
| `exportVersion` | string | Version du schéma d’export (`1.1` à partir de l’ajout `cardType`, `hitPoints`, `manaValue`). |
| `exportDate`    | string | Date/heure ISO 8601 du moment de l’export. |
| `cards`         | array  | Liste des objets carte (voir ci-dessous). |

### Compatibilité des versions

- **1.0** : champs carte sans `cardType`, `hitPoints`, `manaValue` explicites dans l’ancien format (certaines propriétés pouvaient être absentes).
- **1.1** : inclut systématiquement `cardType`, `hitPoints` et `manaValue` (valeur `null` si non applicable).

Les outils qui lisent l’export doivent ignorer les champs inconnus pour rester compatibles avec les futures versions.

## Objet carte (`cards[]`)

| Champ            | Type           | Obligatoire | Description |
|------------------|----------------|-------------|-------------|
| `id`             | number         | oui         | Identifiant serveur de la carte. |
| `name`           | string         | oui         | Nom affiché. |
| `cardType`       | string \| null | oui (v1.1)  | `MONSTRE`, `MAGIC` ou `MANA`. `null` si inconnu côté client. |
| `monsterType`    | string         | oui         | Type de monstre (enum backend), chaîne vide si non monstre. |
| `elementType`    | string         | oui         | Élément (`FIRE`, `WATER`, etc.). |
| `tags`           | string[]       | oui         | Liste de tags. |
| `attackPoints`   | number         | oui         | Points d’attaque (0 si non monstre). |
| `defensePoints`  | number         | oui         | Points de défense (0 si non monstre). |
| `hitPoints`      | number \| null | oui (v1.1)  | **PV** : renseigné pour les cartes **Monstre** ; `null` pour Magic/Mana ou si non défini. |
| `manaValue`      | number \| null | oui (v1.1)  | Valeur mana pour les cartes **Mana** ; `null` sinon. |
| `effects`        | array          | oui         | Effets liés (structure détaillée ci-dessous). |
| `imageUrl`       | string         | oui         | URL relative ou absolue de l’image. |

### Règles par type de carte

- **MONSTRE** : `monsterType`, `attackPoints`, `defensePoints` et `hitPoints` sont généralement renseignés ; `manaValue` est `null`.
- **MAGIC** : stats monstre souvent à 0 / vides ; `hitPoints` et `manaValue` en `null`.
- **MANA** : `manaValue` > 0 en général ; stats monstre à 0 ; `hitPoints` en `null`.

## Effet (`effects[]`)

Chaque effet contient notamment :

| Champ            | Type   | Description |
|------------------|--------|-------------|
| `id`             | number | ID effet. |
| `effectName`     | string | Nom. |
| `description`    | string | Description. |
| `conditionCards` | array  | Conditions avec éventuels `parameters`. |
| `actions`        | array  | Actions avec éventuels `parameters` et paramètres par action dans la structure exportée. |

Les paramètres reprennent les codes de définition et valeurs (`parameterDefinitionCode`, `valueString`, `valueNumber`, `enumOptionCode`).

## Exemple minimal (v1.1)

```json
{
  "exportVersion": "1.1",
  "exportDate": "2026-03-18T12:00:00.000Z",
  "cards": [
    {
      "id": 1,
      "name": "Dragon",
      "cardType": "MONSTRE",
      "monsterType": "DRAGON",
      "elementType": "FIRE",
      "tags": ["boss"],
      "attackPoints": 5,
      "defensePoints": 4,
      "hitPoints": 12,
      "manaValue": null,
      "effects": [],
      "imageUrl": "/api/files/images/xxx.png"
    },
    {
      "id": 2,
      "name": "Cristal",
      "cardType": "MANA",
      "monsterType": "",
      "elementType": "ICE",
      "tags": [],
      "attackPoints": 0,
      "defensePoints": 0,
      "hitPoints": null,
      "manaValue": 1,
      "effects": [],
      "imageUrl": ""
    }
  ]
}
```

## Implémentation

- Logique d’export : [`card-list.component.ts`](../src/app/features/cards/components/card-list/card-list.component.ts) — méthodes `exportCardsToJson`, `transformCardForExport`, `transformEffectForExport`.

Il n’existe pas d’import JSON automatique de ce format dans l’application ; l’export sert à la sauvegarde, l’analyse ou un outil externe.
