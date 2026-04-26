# Nahati Anytime Laundry

Professional, responsive web application built with React + Vite and TailwindCSS.

## Tech Stack

- React + Vite
- TailwindCSS
- Framer Motion
- React Router DOM

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

- GitHub Pages or Firebase Hosting supported.
- For GitHub Pages, set `base` in `vite.config.js` if deploying under a subpath and serve the `dist` folder.
- For Firebase, initialize hosting and set the public directory to `dist` after building.

## Configuration

- Update Google Forms config in `src/utils/googleForms.js` with your Form action URL and entry field IDs.
- WhatsApp number is set to `+256200981445` in `src/utils/constants.js`.

## Supabase (staff Ops)

1. Create a project at [Supabase](https://supabase.com). Copy **Project URL** and **anon public** key.
2. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Install [Supabase CLI](https://supabase.com/docs/guides/cli) (or use `npx supabase`).
4. Link and apply schema:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npm run db:push
   ```

5. In Supabase **Authentication → Users**, add staff accounts (email/password). Each user gets a `profiles` row automatically.
6. Promote the first manager in **SQL Editor**:

   ```sql
   update public.profiles set role = 'manager' where id = 'USER_UUID_HERE';
   ```

7. GitHub Actions: add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` so production builds include Ops.

**Routes:** `/ops` (dashboard), `/ops/orders`, `/ops/invoice` (all ops staff), `/ops/ledger` **Finance** (managers/admins — structured expenses + income). Staff record **service income** from **Invoice** (optional ledger line); managers see the full ledger.

**Staff accounts:** `staff1@nahati.online` (Delivery Staff), `staff2@nahati.online` (Front Desk Staff), `staff3@nahati.online` (Operations Staff), `staff4@nahati.online` (General Staff) — each has a `job_title` matching their role. Set or rotate passwords in **Supabase → Authentication → Users** (do not commit live passwords to the repo).

**Invoices:** Saved in table `public.invoices` with a JSON `snapshot` (full line items). PDF is still generated in the browser for download.

Optional: `npm run db:types` regenerates `src/types/supabase.generated.ts` when you change the schema (create that path first or let the command create the file).

## Project Structure

```
src/
  components/
  pages/
  utils/
  App.jsx
  main.jsx
  index.css
```

## Notes

- Images now live in `public/images/` and the logo at `public/nahati_logo.png`.
- Form submission to Google Forms uses `no-cors`; success is assumed on best-effort.
