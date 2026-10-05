import { useEffect, useState } from "react";
import { api } from "../api.js";
import { EVENT } from "../config.js";

const KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const STEPS = ["Team Details", "Member Details", "Payment"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[6-9]\d{9}$/;

const blank = (college = "", city = "") => ({
  name: "",
  email: "",
  phone: "",
  college: college,
  degree: "",
  passoutYear: "",
  address: city,
});

const normalizePhone = (v) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
};

function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () =>
      reject(
        new Error(
          "Could not load Razorpay Checkout. Check your internet, and turn off VPN / ad-blockers for this site."
        )
      );
    document.body.appendChild(s);
  });
}

export default function RegistrationModal({ fee, onClose, onPaid }) {
  const [step, setStep] = useState(0);
  const [team, setTeam] = useState({ teamName: "", organization: "", city: "", teamSize: "2" });
  const [members, setMembers] = useState([blank(), blank()]);
  const [registrationId, setRegistrationId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [busy, onClose]);

  const setT = (k) => (e) => setTeam((t) => ({ ...t, [k]: e.target.value }));

  const changeSize = (e) => {
    const n = Number(e.target.value);
    setTeam((t) => ({ ...t, teamSize: e.target.value }));
    setMembers((m) =>
      Array.from({ length: n }, (_, i) => m[i] || blank(team.organization, team.city))
    );
  };

  const setM = (i, k) => (e) =>
    setMembers((m) => m.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));

  function checkTeam() {
    if (team.teamName.trim().length < 2) return "Please enter your team name.";
    if (team.organization.trim().length < 2) return "Please enter your college / organization.";
    if (team.city.trim().length < 2) return "Please enter your city.";
    return "";
  }

  function checkMembers() {
    const seen = new Set();
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const label = i === 0 ? "Team leader" : `Member ${i + 1}`;
      if (m.name.trim().length < 2) return `${label}: enter the full name.`;
      if (!PHONE.test(normalizePhone(m.phone)))
        return `${label}: enter a valid 10-digit mobile number.`;
      if (!EMAIL.test(m.email.trim())) return `${label}: enter a valid email.`;
      if (m.college.trim().length < 2) return `${label}: enter college / organization.`;
      if (m.degree.trim().length < 1) return `${label}: enter degree / course.`;
      if (m.passoutYear.trim().length < 2) return `${label}: enter passout year.`;
      const e = m.email.trim().toLowerCase();
      if (seen.has(e)) return `${label}: this email is already used in the team.`;
      seen.add(e);
    }
    return "";
  }

  async function next() {
    setError("");
    if (step === 0) {
      const err = checkTeam();
      if (err) return setError(err);

      // Auto-prefill member college and city if not set
      setMembers((prev) =>
        prev.map((m) => ({
          ...m,
          college: m.college || team.organization,
          address: m.address || team.city,
        }))
      );
      return setStep(1);
    }
    if (step === 1) {
      const err = checkMembers();
      if (err) return setError(err);
      setBusy(true);
      try {
        // Save registration as "pending_payment" before taking money
        const r = await api("/api/register", {
          method: "POST",
          body: { ...team, teamSize: Number(team.teamSize), members },
        });
        setRegistrationId(r.registrationId);
        setStep(2);
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
  }

  async function pay() {
    setError("");
    setBusy(true);
    try {
      await loadCheckout();
      const order = await api("/api/create-order", { method: "POST", body: { registrationId } });
      const leader = members[0];

      const rzp = new window.Razorpay({
        key: KEY_ID || order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Nooral.AI",
        description: `${EVENT.name} – Team registration`,
        prefill: { name: leader.name, email: leader.email, contact: leader.phone },
        notes: { registrationId, team: team.teamName },
        theme: { color: "#22d3ee" },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment window closed. Your details are saved — click Pay to try again.");
          },
        },
        handler: async (resp) => {
          try {
            const r = await api("/api/verify-payment", { method: "POST", body: resp });
            setDone(r.registration);
            onPaid?.();
          } catch (e) {
            setError(
              `We received your payment but could not confirm it automatically (${e.message}). Do NOT pay again — email ${EVENT.contactEmail} with Payment ID ${resp.razorpay_payment_id}.`
            );
          } finally {
            setBusy(false);
          }
        },
      });
      rzp.on("payment.failed", (r) => {
        setBusy(false);
        setError(`Payment failed: ${r.error?.description || "please try again"}.`);
      });
      rzp.open();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const progress = done ? 100 : ((step + 1) / STEPS.length) * 100;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Hackathon registration">
        <button className="close" onClick={onClose} disabled={busy} aria-label="Close">
          ×
        </button>

        <div className="stepper">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step || done ? "on" : ""}>
              {s}
            </span>
          ))}
        </div>
        <div className="bar">
          <div style={{ width: `${progress}%` }} />
        </div>

        {done ? (
          <div className="pane center">
            <div className="tick">✓</div>
            <h3>Registration confirmed!</h3>
            <p className="muted">Your payment was successful and your team is registered.</p>
            <dl className="receipt">
              <dt>Team</dt>
              <dd>{done.teamName}</dd>
              <dt>Registration ID</dt>
              <dd>{done.id}</dd>
              <dt>Payment ID</dt>
              <dd>{done.paymentId}</dd>
            </dl>
            <p className="muted small">Please save these details. Questions? {EVENT.contactEmail}</p>
            <button className="btn-pay" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            {step === 0 && (
              <div className="pane">
                <h3>Team Details</h3>
                <label>
                  Team name *
                  <input value={team.teamName} onChange={setT("teamName")} maxLength={60} placeholder="e.g. Code Crusaders" />
                </label>
                <label>
                  College / Organization *
                  <input value={team.organization} onChange={setT("organization")} placeholder="Your college or company" />
                </label>
                <div className="row">
                  <label>
                    City *
                    <input value={team.city} onChange={setT("city")} placeholder="Satara" />
                  </label>
                  <label>
                    Team size *
                    <select value={team.teamSize} onChange={changeSize}>
                      <option value="2">2 members</option>
                      <option value="3">3 members</option>
                      <option value="4">4 members</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="pane">
                <h3>Member Details</h3>
                {members.map((m, i) => (
                  <fieldset key={i}>
                    <legend>{i === 0 ? "Team Leader" : `Member ${i + 1}`}</legend>
                    <div className="row">
                      <label>
                        Full name *
                        <input value={m.name} onChange={setM(i, "name")} placeholder="Rahul Sharma" />
                      </label>
                      <label>
                        Mobile / Contact *
                        <input value={m.phone} onChange={setM(i, "phone")} inputMode="numeric" placeholder="10-digit mobile number" />
                      </label>
                    </div>
                    <div className="row">
                      <label>
                        Email *
                        <input type="email" value={m.email} onChange={setM(i, "email")} placeholder="rahul@example.com" />
                      </label>
                      <label>
                        College / Organization *
                        <input value={m.college} onChange={setM(i, "college")} placeholder="College name" />
                      </label>
                    </div>
                    <div className="row">
                      <label>
                        Degree / Course *
                        <input value={m.degree} onChange={setM(i, "degree")} placeholder="e.g. B.Tech / BCA" />
                      </label>
                      <label>
                        Passout Year *
                        <input value={m.passoutYear} onChange={setM(i, "passoutYear")} placeholder="e.g. 2026" />
                      </label>
                    </div>
                    <label>
                      Address / City
                      <input value={m.address} onChange={setM(i, "address")} placeholder="City or full address" />
                    </label>
                  </fieldset>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="pane center">
                <h3>🛡️ Payment Details</h3>
                <div className="fee-box">
                  <strong>Hackathon Registration Fee: ₹{fee} per Team</strong>
                  <p>Please complete the payment of ₹{fee} per team to confirm your hackathon registration.</p>
                  <p>After successful payment, your team registration will be considered confirmed.</p>
                  <p className="small">
                    Team: <b>{team.teamName}</b> · Registration ID: <b>{registrationId}</b>
                  </p>
                </div>
                <button className="btn-pay" onClick={pay} disabled={busy}>
                  {busy ? <span className="spin" /> : `Pay ₹${fee}`}
                </button>
                <p className="muted small">Secured by Razorpay · UPI, Cards, Netbanking, Wallets</p>
              </div>
            )}

            {error && <div className="error" role="alert">{error}</div>}

            <div className="footer-row">
              <button className="back" onClick={() => { setError(""); setStep(step - 1); }} disabled={step === 0 || busy}>
                ← Back
              </button>
              {step < 2 && (
                <button className="btn-next" onClick={next} disabled={busy}>
                  {busy ? "Saving…" : "Continue →"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
