export const HEADERS = [
  "Registration ID",
  "Status",
  "Team Name",
  "College/Organization",
  "City",
  "Team Size",
  "Project Idea",
  // Leader
  "Leader Name",
  "Leader Email",
  "Leader Phone",
  "Leader College",
  "Leader Degree",
  "Leader Passout Year",
  "Leader Address",
  // Member 2
  "Member 2 Name",
  "Member 2 Email",
  "Member 2 Phone",
  "Member 2 College",
  "Member 2 Degree",
  "Member 2 Passout Year",
  "Member 2 Address",
  // Member 3
  "Member 3 Name",
  "Member 3 Email",
  "Member 3 Phone",
  "Member 3 College",
  "Member 3 Degree",
  "Member 3 Passout Year",
  "Member 3 Address",
  // Member 4
  "Member 4 Name",
  "Member 4 Email",
  "Member 4 Phone",
  "Member 4 College",
  "Member 4 Degree",
  "Member 4 Passout Year",
  "Member 4 Address",
  // Meta
  "Fee (INR)",
  "Razorpay Order ID",
  "Razorpay Payment ID",
  "Paid At (IST)",
  "Confirmed Via",
  "Registered At (IST)",
];

export function formatIST(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const options = {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    const parts = new Intl.DateTimeFormat("en-GB", options).formatToParts(d);
    const p = {};
    for (const part of parts) {
      p[part.type] = part.value;
    }
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
  } catch {
    return "";
  }
}

export function recordToRow(reg) {
  if (!reg) return [];
  const team = reg.team || {};
  const members = Array.isArray(reg.members) ? reg.members : [];
  const leader = members[0] || {};
  const m2 = members[1] || {};
  const m3 = members[2] || {};
  const m4 = members[3] || {};

  const status = reg.status === "paid" ? "PAID" : "PENDING PAYMENT";

  const formatMember = (m) => [
    m.name || "",
    m.email || "",
    m.phone || "",
    m.college || "",
    m.degree || "",
    m.passoutYear || "",
    m.address || "",
  ];

  return [
    reg.id || "",
    status,
    team.teamName || "",
    team.organization || "",
    team.city || "",
    team.teamSize ?? "",
    team.idea || "",
    ...formatMember(leader),
    ...formatMember(m2),
    ...formatMember(m3),
    ...formatMember(m4),
    reg.fee ?? 999,
    reg.orderId || "",
    reg.paymentId || "",
    formatIST(reg.paidAt),
    reg.confirmedVia || "",
    formatIST(reg.createdAt),
  ];
}
