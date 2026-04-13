# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Running locally against the Blocks backend

To run this app locally (e.g. `pnpm dev` or `pnpm preview`) while talking to the Blocks API in the cloud:

1. Environment variables: a `.env` file is included in the repo with:
   - **`VITE_BLOCKS_API_HOST`** – `https://blocks.diy`
   - **`VITE_APP_ID`** – Your app ID from Blocks (set when the repo is synced)

2. Run the dev server or preview:

   ```bash
   pnpm dev
   # or
   pnpm preview
   ```

3. **Log in**: With `VITE_BLOCKS_API_HOST` and `VITE_APP_ID` set, opening the app in the browser will show a login screen. Enter your email to receive a magic link; click it to sign in (the link will bring you back to your local URL). Alternatively, you can set `token` in `localStorage` (e.g. copy from the Blocks platform after logging in there).

Without the env vars, the app shows setup instructions. With them, you get the login flow and the app talks to the Blocks backend.
