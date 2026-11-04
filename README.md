# Kontorssignalen

## Google Calendar integration

When a calendar is connected, the status switches to **UPPTAGEN** during every meeting you have **accepted** and every event you created yourself (with or without guests). Events marked "Free", all-day events, focus time, out-of-office and working location events don't count. When the meeting ends, the status goes back to what it was before. If you change status by hand during a meeting, your choice applies until that meeting ends.

The server reads the calendar every 2 minutes and checks the meeting times every 15 seconds. It keeps the state and the Google refresh token in `$DATA_DIR/state.json` (default `./data`, `/app/data` in Docker).

### Setup in Google

1. Go to https://console.cloud.google.com and create a project (project picker → **New project**).
2. **APIs & Services → Library**: search for **Google Calendar API** → **Enable**.
3. **Google Auth Platform → Get started** (= the OAuth consent screen):
   - App name: `Kontorssignalen`. Use your own email as the support and contact email.
   - Audience: choose **Internal** if the account is Google Workspace (e.g. @iteam.se). Choose **External** if it is a private Gmail account.
4. Only for **External**: go to **Audience** and click **Publish app** (→ In production). In "Testing" mode the refresh token stops working after 7 days. Google won't verify the app, but that's fine for your own use: at login, click **Advanced → Go to Kontorssignalen (unsafe)**.
5. **Data access → Add or remove scopes**: add `.../auth/calendar.events.readonly` → **Update** → **Save**.
6. **Clients → Create client**:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://<your-host>/api/google/callback`
     Google only accepts `https://` on a real domain, or `http://localhost:<port>`. Raw IP addresses like `192.168.x.x` don't work, see below.
   - **Create**, then copy the **Client ID** and **Client secret**.

### Configure the app

```bash
docker run -d -p 3000:3000 \
  -e GOOGLE_CLIENT_ID=... \
  -e GOOGLE_CLIENT_SECRET=... \
  -e GOOGLE_REDIRECT_URI=https://<your-host>/api/google/callback \
  -v kontorssignalen-data:/app/data \
  osirisguitar/kontorssignalen
```

`GOOGLE_REDIRECT_URI` is optional. Without it, the URI is built from the request's host, and it must match the one in Google exactly. Optional: `LED_HOST` (default `192.168.88.220`) and `DATA_DIR`.

Then open the app → **Anslut Google Kalender** → log in and approve.

**The app only runs on a LAN IP (no domain/https):** register `http://localhost:3000/api/google/callback` in Google. Connect once through an SSH tunnel: `ssh -L 3000:localhost:3000 <server>`, then open http://localhost:3000 and connect. The token is stored on the server, so after that it works no matter how you reach the app.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
