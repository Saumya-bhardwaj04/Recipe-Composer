# Recipe Composer

A full-stack app where you can create ingredients and recipes, build recipes out of other recipes, and see exactly how many raw ingredients any dish needs.

Built for the ThinkVerge Software Engineer Intern take-home.

---

## What it does

- **Sign up / log in** — your data is private to you
- **Ingredients** — add things like "egg" and give it optional states ("raw", "boiled", "fried")
- **Recipes** — compose a recipe from ingredients and/or other recipes, with quantities and states
- **Resolve** — click "Resolve" on any recipe to see its complete base ingredient list (works through any level of nesting)
- **Import / Export** — download your whole book as JSON or upload a JSON file to merge in

---

## Tech choices and why

| Thing | Choice | Why |
|---|---|---|
| Backend | Node.js + Express | Fast, simple, lots of people know it |
| Database | MongoDB + Mongoose | Great fit for nested, flexible data |
| Auth | JWT stored in HttpOnly cookie | Can't be stolen by JavaScript, secure by default |
| Frontend | React + TypeScript + Vite | Required by brief; Vite is fast to start |
| Styling | Vanilla CSS | Full control, no abstractions to fight |
| Font | Nunito (Google Fonts) | Friendly and very readable, not the default |

---

## Folder structure

```
recipe-composer/
├── server/          # Express API
│   ├── src/
│   │   ├── models/      — Mongoose schemas
│   │   ├── controllers/ — business logic
│   │   ├── routes/      — Express routers
│   │   ├── middleware/  — auth guard
│   │   ├── utils/       — cycle detection, flatten logic
│   │   └── tests/       — Jest unit tests
│   └── .env.example
├── client/          # React + TypeScript
│   ├── src/
│   │   ├── api/     — all Axios calls
│   │   ├── context/ — AuthContext (current user)
│   │   ├── pages/   — Login, Signup, Dashboard, Ingredients, Recipes
│   │   └── components/ — Navbar
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

---

## Data model notes

- Ingredients have a `slug` (short unique id like `"egg"`) and optional `states[]`.
- Recipes have components, each pointing to another ingredient or recipe by `refSlug`, with a `qty` and optional `state`.
- Slugs are unique per user, so two users can both have an `"egg"` ingredient without colliding.

---

## How to run locally

**You need:** Node 18+, npm, and a MongoDB instance running on `localhost:27017`.

### 1. Clone the repo

```bash
git clone https://github.com/Saumya-bhardwaj04/Recipe-Composer.git
cd recipe-composer
```

### 2. Start the backend

```bash
cd server
cp .env.example .env    # edit JWT_SECRET if you like
npm install
npm run dev             # starts on http://localhost:5000
```

### 3. Start the frontend

```bash
cd client
npm install
npm run dev             # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## How to run with Docker

Make sure Docker Desktop is running.

```bash
docker-compose up --build
```

- Frontend → `http://localhost:4173`
- Backend  → `http://localhost:5000`
- MongoDB is managed by Docker, data persists in a named volume

---

## Running tests

```bash
cd server
npm test
```

Tests cover:
- Cycle detection (direct and indirect)
- Recursive flatten (simple, nested, multiplied quantities)
- Circular reference error during flatten

---

## Edge cases handled

| Case | Where it's handled |
|---|---|
| Non-existent component | `validateComponent()` in recipeUtils.js |
| Circular reference | `hasCycle()` in recipeUtils.js |
| Invalid state | `validateComponent()` checks ingredient's states array |
| qty ≤ 0 or non-numeric | `validateComponent()` |
| Empty recipe (0 components) | recipeController.js rejects with clear message |
| Duplicate slugs on import | collectionController.js checks before inserting anything |
| Deep nesting | `flattenRecipe()` recurses with a `seen` set to catch cycles |

---

## What I'd do with more time

- Add search / filter on the ingredients and recipes lists
- Let users rename slugs (right now slug is set at creation)
- Better mobile layout for the recipe composer table
- Refresh token rotation for longer sessions
- Soft-delete to prevent accidental data loss
- Pagination for large collections
