import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import { db } from "./db.js";
import { syncRegistration, syncAllRegistrations, isSheetsConfigured } from "./sheets.js";
import { generateRegistrationsExcel } from "./excel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

// ---- Fixed on the server: the client can never change the price ----
const FEE_RUPEES = 999;
const FEE_PAISE = FEE_RUPEES * 100;
const TOTAL_SLOTS = 30;

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn("⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing in .env — payments will not work.");
}
if (!RAZORPAY_WEBHOOK_SECRET) {
  console.warn("⚠️  RAZORPAY_WEBHOOK_SECRET missing — webhook endpoint will reject requests.");
}
const razorpay =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "https://nooral.ai",
      "https://www.nooral.ai",
      ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : []),
    ],
  })
);

const safeEqual = (a = "", b = "") => {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};
const hmac = (secret, data) => crypto.createHmac("sha256", secret).update(data).digest("hex");

const checkAdminAuth = (req) => {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  const reqKey = req.get("x-admin-key") || req.query?.key || "";
  return safeEqual(adminKey, reqKey);
};

function markPaid(reg, { paymentId, via }) {
  if (reg.status === "paid") return reg; // idempotent
  const updated = db.update(reg.id, {
    status: "paid",
    paymentId,
    paidAt: new Date().toISOString(),
    confirmedVia: via,
    fee: FEE_RUPEES,
  });
  try {
    syncRegistration(updated);
  } catch (e) {
    console.error("Sheets sync error:", e);
  }
  return updated;
}

// =====================================================================
// WEBHOOK  (must use the RAW body, so it is registered BEFORE express.json)
// =====================================================================
app.post("/api/razorpay-webhook", express.raw({ type: "*/*" }), (req, res) => {
  if (!RAZORPAY_WEBHOOK_SECRET) return res.status(500).send("Webhook secret not configured");
  const signature = req.get("X-Razorpay-Signature");
  const expected = hmac(RAZORPAY_WEBHOOK_SECRET, req.body);
  if (!signature || !safeEqual(expected, signature)) return res.status(400).send("Invalid signature");

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).send("Bad payload");
  }

  try {
    const payment = event?.payload?.payment?.entity;
    const orderId = payment?.order_id || event?.payload?.order?.entity?.id;
    const reg = orderId && db.find((r) => r.orderId === orderId);

    if (reg) {
      if (event.event === "payment.captured" || event.event === "order.paid") {
        if (!payment || payment.amount === FEE_PAISE) {
          markPaid(reg, { paymentId: payment?.id || reg.paymentId, via: "webhook" });
        } else {
          console.warn(`Amount mismatch for ${reg.id}: ${payment.amount}`);
        }
      } else if (event.event === "payment.failed" && reg.status !== "paid") {
        db.update(reg.id, {
          lastFailure: {
            paymentId: payment?.id,
            reason: payment?.error_description || "unknown",
            at: new Date().toISOString(),
          },
        });
      }
    }
  } catch (e) {
    console.error("Webhook handling error:", e);
  }
  res.json({ received: true });
});

app.use(express.json({ limit: "100kb" }));

// =====================================================================
// API
// =====================================================================
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/slots", (_req, res) => {
  const paid = db.paidCount();
  res.json({ total: TOTAL_SLOTS, remaining: Math.max(TOTAL_SLOTS - paid, 0), fee: FEE_RUPEES });
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[6-9]\d{9}$/;
const clean = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
// Keep digits only; drop a +91 / 91 country code only when the number is 12 digits long
const normalizePhone = (v) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
};

function validate(body) {
  const team = {
    teamName: clean(body.teamName),
    organization: clean(body.organization),
    city: clean(body.city),
    teamSize: Number(body.teamSize),
    idea: clean(body.idea).slice(0, 500),
  };
  if (team.teamName.length < 2 || team.teamName.length > 60) return { error: "Team name must be 2–60 characters." };
  if (team.organization.length < 2) return { error: "College / organization is required." };
  if (team.city.length < 2) return { error: "City is required." };
  if (![2, 3, 4].includes(team.teamSize)) return { error: "Team size must be 2, 3 or 4." };

  const members = Array.isArray(body.members) ? body.members : [];
  if (members.length !== team.teamSize) return { error: "Member count does not match team size." };
  const out = [];
  const emails = new Set();
  for (let i = 0; i < members.length; i++) {
    const m = {
      name: clean(members[i]?.name),
      email: clean(members[i]?.email).toLowerCase(),
      phone: normalizePhone(members[i]?.phone),
      college: clean(members[i]?.college || team.organization),
      degree: clean(members[i]?.degree),
      passoutYear: clean(members[i]?.passoutYear),
      address: clean(members[i]?.address || team.city),
    };
    const label = i === 0 ? "Team leader" : `Member ${i + 1}`;
    if (m.name.length < 2) return { error: `${label}: name is required.` };
    if (!EMAIL.test(m.email)) return { error: `${label}: enter a valid email.` };
    if (!PHONE.test(m.phone)) return { error: `${label}: enter a valid 10-digit mobile number.` };
    if (m.college.length < 2) return { error: `${label}: college / organization is required.` };
    if (m.degree.length < 1) return { error: `${label}: degree / course is required.` };
    if (m.passoutYear.length < 2) return { error: `${label}: passout year is required.` };
    if (emails.has(m.email)) return { error: `${label}: duplicate email in team.` };
    emails.add(m.email);
    out.push(m);
  }
  return { team, members: out };
}

// Step 1: save the registration as "pending_payment"
app.post("/api/register", (req, res) => {
  const v = validate(req.body || {});
  if (v.error) return res.status(400).json({ error: v.error });

  const leaderEmail = v.members[0].email;
  const all = db.all();
  const teamKey = v.team.teamName.toLowerCase();

  const paidDup = all.find(
    (r) => r.status === "paid" && (r.members[0].email === leaderEmail || r.team.teamName.toLowerCase() === teamKey)
  );
  if (paidDup) return res.status(409).json({ error: "A paid registration already exists for this team name or leader email." });

  const existing = all.find((r) => r.status === "pending_payment" && r.members[0].email === leaderEmail);
  if (!existing && db.paidCount() >= TOTAL_SLOTS) {
    return res.status(409).json({ error: "Registrations are full." });
  }

  if (existing) {
    const rec = db.update(existing.id, { team: v.team, members: v.members, fee: FEE_RUPEES });
    return res.json({ registrationId: rec.id });
  }
  const rec = db.insert({
    id: "REG-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
    status: "pending_payment",
    team: v.team,
    members: v.members,
    fee: FEE_RUPEES,
    createdAt: new Date().toISOString(),
  });
  res.json({ registrationId: rec.id });
});

// Step 2: create the Razorpay order (amount is fixed here)
app.post("/api/create-order", async (req, res) => {
  if (!razorpay) return res.status(500).json({ error: "Payment gateway is not configured on the server." });
  const reg = db.find((r) => r.id === req.body?.registrationId);
  if (!reg) return res.status(404).json({ error: "Registration not found." });
  if (reg.status === "paid") return res.status(409).json({ error: "This registration is already paid." });
  if (db.paidCount() >= TOTAL_SLOTS) return res.status(409).json({ error: "Registrations are full." });

  try {
    const order = await razorpay.orders.create({
      amount: FEE_PAISE,
      currency: "INR",
      receipt: reg.id, // < 40 chars
      notes: { registrationId: reg.id, team: reg.team.teamName },
    });
    db.update(reg.id, { orderId: order.id, fee: FEE_RUPEES });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
  } catch (e) {
    const detail = e?.error?.description || e?.message || "unknown error";
    console.error("create-order failed:", e?.statusCode || "", detail);
    res.status(502).json({ error: `Could not create payment order: ${detail}` });
  }
});

// Step 3: verify the signature returned by Checkout
app.post("/api/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment details." });
  }
  const expected = hmac(RAZORPAY_KEY_SECRET || "", `${razorpay_order_id}|${razorpay_payment_id}`);
  if (!safeEqual(expected, razorpay_signature)) {
    return res.status(400).json({ error: "Payment signature verification failed." });
  }
  const reg = db.find((r) => r.orderId === razorpay_order_id);
  if (!reg) return res.status(404).json({ error: "No registration matches this order." });

  const updated = markPaid(reg, { paymentId: razorpay_payment_id, via: "client-verify" });
  res.json({
    success: true,
    registration: { id: updated.id, teamName: updated.team.teamName, paymentId: updated.paymentId },
  });
});

// =====================================================================
// ADMIN API
// =====================================================================
app.post("/api/admin/sync-sheet", async (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!isSheetsConfigured()) {
    return res.status(500).json({ error: "Google Sheets is not configured." });
  }
  try {
    const allRecords = db.all();
    const synced = await syncAllRegistrations(allRecords);
    res.json({ synced });
  } catch (err) {
    console.error("Backfill sync error:", err);
    res.status(500).json({ error: err?.message || "Failed to sync registrations to Google Sheets." });
  }
});

app.get("/api/admin/registrations.xlsx", async (req, res) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const onlyPaid = req.query.paid === "1";
    const allRecords = db.all();
    const buffer = await generateRegistrationsExcel(allRecords, onlyPaid);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="registrations.xlsx"'
    );
    res.send(buffer);
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ error: "Failed to generate Excel export." });
  }
});

// Clean JSON errors (e.g. malformed request bodies)
app.use("/api", (err, _req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.status === 400 ? "Invalid request body." : "Server error." });
});

// ---- Serve the built frontend in production (npm run build && npm start) ----
const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  console.log(`Google Sheets sync: ${isSheetsConfigured() ? "ON" : "OFF"}`);
});
