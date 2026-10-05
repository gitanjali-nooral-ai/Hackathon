# HackVerse Hackathon 2026 – Nooral.AI

React (Vite) frontend + Express backend with Razorpay payments.

Flow: **Register Now** → modal with **Team Details → Member Details → Payment** → Razorpay Checkout → server verifies signature → registration marked `paid`.

## Requirements
- Node.js 18.11 or newer (`node -v`)

## Run locally
```bash
npm install
npm run dev
```
- Website: http://localhost:3000
- API: http://localhost:5000 (the frontend proxies `/api` to it)

`.env` already contains your Razorpay **TEST** keys. Restart `npm run dev` after editing it.

## Test a payment
Click **Register Now**, fill the form, click **Pay ₹999**.
- UPI: `success@razorpay` (success) / `failure@razorpay` (failure)
- Cards: use Razorpay's test cards (Razorpay docs → Test Card Details)

Registrations are stored in `server/data/registrations.json`.

## Project layout
```
server/index.js   API: /api/slots, /register, /create-order, /verify-payment, /razorpay-webhook, /admin/...
server/sheets.js  Google Sheets sync & queueing
server/rows.js    Shared registration column definitions & IST date formatting
server/excel.js   Excel export generator using exceljs
server/db.js      JSON-file storage (swap for a real DB in production)
src/              React app (Hero, Details, RegistrationModal)
src/config.js     Event text, start date
apps-script/      Google Apps Script Code.gs webhook & email logic
```
The fee (₹999) and slots (30) are fixed in `server/index.js`. The browser can never change the amount.

## Google Sheets Sync & Admin Endpoints

Registrations are automatically synced to Google Sheets in real-time when created or updated.

### Setup Instructions

1. **Google Cloud Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new Google Cloud Project (or select an existing one).
   - Go to **APIs & Services > Library** and search for **Google Sheets API**. Click **Enable**.

2. **Create Service Account**:
   - Go to **APIs & Services > Credentials**.
   - Click **Create Credentials > Service Account**.
   - Enter a name (e.g. `hackathon-sync`) and click **Create and Continue**.
   - Click **Done**.

3. **Generate Service Account Private Key**:
   - Click on the newly created Service Account.
   - Go to the **Keys** tab and click **Add Key > Create new key**.
   - Choose **JSON** format and click **Create**. A `.json` credentials file will download.

4. **Share Google Sheet**:
   - Open your Target Google Sheet (ID: `1V33HnHji6xnpe5XF3aOJcKqUf6qRSFoLPd2ckEOA9L0`).
   - Click **Share** and add the service account email (found in the JSON file as `client_email`) as **Editor**.

5. **Configure Environment Variables**:
   Add the following environment variables to `.env` (and hosting server dashboard):
   ```env
   GOOGLE_SHEET_ID=1V33HnHji6xnpe5XF3aOJcKqUf6qRSFoLPd2ckEOA9L0
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEET_TAB=Registrations
   ADMIN_KEY=your_secure_admin_key
   ```
   *(Note: Ensure literal newlines in `GOOGLE_PRIVATE_KEY` are preserved or formatted as `\n` strings).*

### Backfill & Excel Export

- **Backfill Existing Registrations to Sheet**:
  Send a `POST` request with your admin key header:
  ```bash
  curl -X POST http://localhost:5000/api/admin/sync-sheet \
    -H "x-admin-key: your_secure_admin_key"
  ```
  Returns `{ "synced": N }`.

- **Download Registrations Excel Export**:
  Download all registrations:
  ```bash
  curl -O http://localhost:5000/api/admin/registrations.xlsx?key=your_secure_admin_key
  ```
  Or download only paid registrations using `?paid=1`:
  ```bash
  curl -O "http://localhost:5000/api/admin/registrations.xlsx?key=your_secure_admin_key&paid=1"
  ```

## Webhook (optional locally)
Razorpay can only reach a public URL. Locally use a tunnel, e.g. `ngrok http 5000`, then in Razorpay (Test Mode) → Webhooks add `https://<ngrok-url>/api/razorpay-webhook`, events `payment.captured`, `payment.failed`, and the same secret as `RAZORPAY_WEBHOOK_SECRET`.

## Troubleshooting
- **"api.razorpay.com refused to connect"**: a network block. Turn off VPN / ad-blocker / antivirus web shield, try Incognito or a phone hotspot.
- **"Could not create payment order"**: check the keys in `.env` (Key ID and Secret from the same mode) and restart.
- **Port 3000/5000 in use**: close the other app (your main Nooral site also uses 3000, so stop it first).

## Go live
1. Build: `npm run build`, then run `npm start` (serves the site and API together from one port).
2. On your host set env vars with **live** keys (`rzp_live_...` Key ID + its secret) and the webhook secret. Never commit `.env`.
3. In Razorpay (Live Mode) add the webhook `https://nooral.ai/api/razorpay-webhook` with the same secret.
4. Do one small real payment to confirm, then refund it.

## Security notes
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` exist only on the server. Only the Key ID reaches the browser.
- Your test secrets were shared in a chat, so regenerate the test key before reusing it elsewhere.
