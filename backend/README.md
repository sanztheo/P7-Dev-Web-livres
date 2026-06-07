# Mon Vieux Grimoire — API backend

API REST pour l'application « Mon Vieux Grimoire », un site de notation de livres.
Le backend gère l'authentification des utilisateurs, le CRUD des livres et le
système de notation. Il est construit avec **Node.js**, **Express** et
**MongoDB / Mongoose**, et sert les images des livres en statique.

Le frontend React (à la racine du dépôt, dans `src/`) consomme cette API et
constitue le contrat de référence. Le backend écoute sur le **port 4000**.

## Prérequis

- **Node.js 18+** (testé sous Node 22)
- **npm**
- Une instance **MongoDB** accessible (locale ou MongoDB Atlas)

## Installation

```bash
npm install
```

## Configuration de l'environnement

Les secrets ne sont jamais versionnés : seul `.env.example` est fourni, le vrai
`.env` est ignoré par Git.

1. Copier le fichier d'exemple :

   ```bash
   cp .env.example .env
   ```

2. Renseigner les variables dans `.env` :

   | Variable      | Description                                                            |
   | ------------- | ---------------------------------------------------------------------- |
   | `MONGODB_URI` | URI de connexion MongoDB (ex. `mongodb://localhost:27017/grimoire`)     |
   | `JWT_SECRET`  | Chaîne secrète longue et aléatoire pour signer les jetons JWT          |

   `JWT_SECRET` doit rester confidentiel : il protège l'intégrité des sessions.

## Lancement

```bash
# Production
npm start

# Développement (rechargement automatique)
npm run dev
```

L'API est alors disponible sur `http://localhost:4000`.

## Endpoints

Base URL : `http://localhost:4000`

Les routes marquées **Auth** exigent un en-tête `Authorization: Bearer <token>`
obtenu via `/api/auth/login`.

| Méthode  | Chemin                     | Auth | Corps de la requête                                                                                                     | Réponse                          |
| -------- | -------------------------- | :--: | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `POST`   | `/api/auth/signup`         |  Non | JSON `{ email, password }`                                                                                               | `201 { message }`                |
| `POST`   | `/api/auth/login`          |  Non | JSON `{ email, password }`                                                                                               | `200 { userId, token }`          |
| `GET`    | `/api/books`               |  Non | —                                                                                                                       | `200 [ Book, ... ]`              |
| `GET`    | `/api/books/bestrating`    |  Non | —                                                                                                                       | `200 [ Book, ... ]` (top 3)      |
| `GET`    | `/api/books/:id`           |  Non | —                                                                                                                       | `200 Book`                       |
| `POST`   | `/api/books`               |  Oui | `multipart/form-data` : `book` (JSON `{ title, author, year, genre, ratings, averageRating }`) + `image` (fichier)        | `201 { message }`                |
| `PUT`    | `/api/books/:id`           |  Oui | `multipart/form-data` (`book` JSON + `image`) **OU** JSON `{ title, author, year, genre }` si pas de nouvelle image       | `200 { message }`                |
| `DELETE` | `/api/books/:id`           |  Oui | —                                                                                                                       | `200 { message }`                |
| `POST`   | `/api/books/:id/rating`    |  Oui | JSON `{ rating }` (entier de 0 à 5)                                                                                       | `200 Book` (document mis à jour) |

> La route `/api/books/bestrating` retourne les 3 livres les mieux notés
> (tri décroissant sur `averageRating`). Elle est déclarée **avant** `/:id`
> pour qu'Express ne l'interprète pas comme un identifiant.

### Forme d'un objet `Book`

```json
{
  "_id": "string",
  "userId": "string",
  "title": "string",
  "author": "string",
  "imageUrl": "http://localhost:4000/images/<fichier>.webp",
  "year": 0,
  "genre": "string",
  "ratings": [{ "userId": "string", "grade": 0 }],
  "averageRating": 0
}
```

## Sécurité

- Mots de passe hachés avec **bcrypt** (jamais stockés ni renvoyés en clair).
- Connexion : même réponse `401` générique que l'email soit inconnu ou le mot de
  passe erroné (pas d'énumération d'utilisateurs).
- Jetons **JWT** signés avec `JWT_SECRET`, expiration 24 h.
- Le `userId` du propriétaire est toujours forcé côté serveur depuis le jeton :
  jamais lu depuis le corps de la requête. Modifier ou supprimer un livre dont on
  n'est pas l'auteur renvoie `403`.

## Green code

Les images envoyées sont optimisées avec **sharp** pour réduire le poids
transféré et l'empreinte de stockage :

- redimensionnement à une largeur d'environ **463 px** (ratio conservé, sans
  agrandissement) ;
- conversion en **WebP** (qualité ~80) ;
- enregistrement dans le dossier `images/` sous un nom de fichier unique.

Lors du remplacement d'une image (PUT) ou de la suppression d'un livre (DELETE),
l'ancien fichier est supprimé du disque afin d'éviter les fichiers orphelins.
