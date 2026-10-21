# HoesCodes Studio

**REVO LAB prototype:** open `/revo-lab/industry-1`. See [REVO setup, demo walkthrough, simulation model, and limitations](docs/REVO-LAB.md).

Your personal AI-powered digital studio. **Build. Learn. Ship. Grow.**

A functioning full-stack MVP for a solo Founder: a procedural 3D office, persistent personal operating system, and four AI workspaces connected through validated server tools. There are no seed records, simulated transactions, invented progress, or simulated AI runs.

## Run locally

Requires Node.js 22.12+ (tested with 24.21) and npm.

```sh
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000 and choose **Set up my studio**. Create the single Founder account with a password of at least 10 characters. The initial dashboard is an empty preview; reading private data and all writes require a session.

```sh
npm run build
npm start
```

The server binds to localhost by default. For a hosted deployment, configure your host binding, HTTPS, persistent storage, `COOKIE_SECURE=true`, and `APP_ORIGIN`.

## Stack and data

Next.js App Router, React 19, strict TypeScript, Tailwind CSS 4, TanStack Query, Prisma, Zod, React Three Fiber, Drei, Three.js, and Lucide. Fonts are bundled locally.

SQLite is the working local default. `prisma/studio.db` and private files under `.data/attachments` are ignored by Git. Database migrations are committed. Back up both locations before moving or deleting the checkout.

The database has `User`, `Session`, `Record`, `AIConversation`, `AIMessage`, `AIAttachment`, `AITask`, `AuditLog`, and `AIProviderSetting`. Validated `Record` kinds represent the personal domains; actual foreign keys connect goals, projects, parent records, tasks, and milestones. Module-specific fields are validated before persistence. This MVP does not create a separate relational table for every entity in the full vision.

### PostgreSQL profile

Set in `.env`:

```dotenv
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/hoescodes"
```

Then run `npm run db:generate`, `npm run db:migrate`, and `npm run build`. The scripts select `prisma/postgresql/schema.prisma` and its PostgreSQL migration. This profile was schema-validated and its SQL was generated, but no PostgreSQL server was provided for a connection test. Changing profiles does not transfer existing SQLite records. Keep the two schema files synchronised when changing the data model.

## Connect the AI team

Open **Settings → AI provider** while signed in:

1. Choose OpenAI, OpenRouter, Ollama (local), or Custom. Enter your API base URL and API key. For an unauthenticated local server, enable **No API key**.
2. Enter any model ID, or choose **Load models** and select one from the provider's actual `/models` response. Loading does not install local models.
3. Choose **Test connection** to check chat and function calling. This makes a small real model request and may consume provider credits; it never creates studio records. A successful chat response without tool calls is reported separately.
4. Choose **Save provider**, then open a teammate's chat. The new configuration applies to all four agents immediately; no server restart is needed. Choose **Action** when explicitly asking the agent to save a task.

The presets use the documented [OpenRouter base URL](https://openrouter.ai/docs/quickstart) and [Ollama OpenAI-compatible endpoint](https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx). Native provider protocols need an OpenAI-compatible endpoint or adapter. Studio uses Chat Completions and function calling. Arbitrary model IDs are accepted, but model capabilities, image/PDF inputs, embeddings, and transcription depend on the provider. An Ollama server needs to be running with the chosen model installed.

**Advanced** lets you choose `max_tokens` or `max_completion_tokens` and optional embedding/transcription model IDs on the same provider. Blank embedding fields enable transparent keyword retrieval; blank transcription fields disable voice input. Changing the embedding provider/model invalidates cached knowledge vectors.

API keys are encrypted with AES-256-GCM in the database and never returned by settings/state endpoints or included in JSON exports. Blank API key fields retain the saved secret for the same endpoint; changing endpoints requires a new key or explicit keyless mode. Provider calls stay on the server, and redirects are rejected. For local use, Studio automatically creates `.data/ai-provider.key` with owner-only permissions. **Back up that key file with your database** to preserve access to saved API keys. Hosted instances should configure a persistent `AI_SETTINGS_ENCRYPTION_KEY` (64 hex characters), shared by all app instances. Losing or changing the encryption key requires re-entering provider credentials.

Environment configuration remains an optional fallback when there are no saved settings. Removing saved settings restores this fallback. Environment changes require a server restart:

```dotenv
AI_API_KEY="your-provider-key"
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4.1-mini"
AI_EMBEDDING_MODEL="text-embedding-3-small"
AI_TRANSCRIPTION_MODEL="whisper-1"
```

No live provider credentials were supplied during implementation, so real model quality and external endpoints remain unverified. Automated tests use a local mock provider, including the full settings → model selection → connection test → saved provider → agent task flow.

- **Chief of Staff**: coordination across all personal modules.
- **Engineer**: projects, decisions, tasks, skills, products, and technical knowledge.
- **Research & Learning**: thesis, papers, experiments, academic work, skills, and sessions.
- **Growth & Business**: ideas, products, content, projects, applications, and portfolio.

Agent permissions are checked on the server; Engineer cannot access Finance. AI has no SQL access, shell execution, web search, or repository editing tool. Research references must come from supplied records or attachments; the prompt prohibits fabricated sources.

### Ask, draft, action

**Ask** reads data. **Draft** proposes an answer without saving domain records. **Action** enables typed mutation tools after the Founder confirms the request. Tool validation and ownership checks apply in every mode. Drafts can be discussed and saved by explicitly requesting the write in Action mode. Recommendations from reviews never automatically modify goals.

Tool functions include `getTodayTasks`, `getRecords`, `getProject`, `getLearningProgress`, `getThesisContext`, `getFinanceSummary`, `searchKnowledge`, `createTask`, `createGoal`, `createProject`, `createMilestone`, `createStudySession`, `createApplication`, `addPaper`, `addExperiment`, `createIdea`, `createContent`, `createKnowledge`, `createSkill`, `createProduct`, and `updateRecord`.

Writes and their before/after audit are atomic. Failed calls are audited and prevent a run from being marked Done. Runs store instructions, conversation, start/finish times, output, and errors. A process interrupted for more than three minutes is marked Error on the next state refresh. Chat state is persisted; office status is polled every five seconds.

## Daily workflows

- Create a goal, link a project, and add tasks or milestones. Progress comes from linked non-cancelled tasks or a goal’s manually entered metric.
- Use Today to prioritise critical/due, high/scheduled, optional, and waiting work. Completion updates the shared dashboard and linked project progress.
- Capture a thought with **⌘K / Ctrl+K** or **Capture**, review the suggested category, then review the full form before saving. Dates are entered explicitly; capture does not pretend to understand natural-language scheduling.
- Track skills with self-assessed stages and evidence. Log actual study sessions. Roadmaps group real skills by domain and stage; logged minutes drive learning summaries.
- Track courses, assignments, thesis stages, papers, datasets, experiments, applications, product hypotheses, content drafts, notes, and actual Rupiah transactions using validated forms.
- Calendar displays dated events and related task, assignment, and content deadlines. Content has its own calendar.
- Start a conversation, attach a PNG/JPEG/WebP/PDF/TXT/Markdown/CSV, and choose an agent. Attachments stay private to the conversation and never automatically become domain records.
- Voice records up to two minutes, transcribes server-side, and places text in the composer for review before sending.
- Review the actual last 7/30 days of task completions, study time, shipped projects, and published content. Save reflections manually or request an AI draft.
- Settings supports Founder profile, career target, timezone, persistent theme preference, sign-out, and JSON export. The export includes records and conversations, not file bytes or secrets.

## Office

The isometric office is real WebGL geometry, with no static office image or remote 3D assets. Four desks have avatars, monitors, chairs, books, plants, a server rack, a lounge, and an interior wordmark. Drag rotates within limits; scroll zooms; reset and expand controls are available. Clicking a workstation opens its agent card; double-clicking opens chat. Agent cards offer chat, filtered assigned tasks, and task assignment.

Only real active AI runs illuminate monitors and animate working avatars. Assigning a task is a persisted planning record; it does not start a background worker automatically. A calm office with no active run is intentional. Light and dark modes change scene lighting. Mobile devices, unavailable WebGL, and rendering errors receive a 2D interactive map with the same agent actions. A manual map switch is also provided.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Unit/integration tests use an isolated temporary SQLite database and mocked provider responses; they never call a paid model or populate the Founder’s studio. Browser tests use `.data/e2e-test.db`, a separate server on port 3001, and a locally installed Chrome. For another machine, adjust `playwright.config.ts` to its browser executable, or use a Playwright-installed Chromium.

See **IMPLEMENTATION.md** for route coverage, verification results, required configuration, and the remaining boundaries of the MVP.
