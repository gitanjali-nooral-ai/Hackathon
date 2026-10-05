const BASE = import.meta.env.VITE_API_URL || "";

export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running (npm run dev)?");
  }
  let data = {};
  let text = "";
  try {
    text = await res.text();
    data = JSON.parse(text);
  } catch {
    /* text is not JSON */
  }
  if (!res.ok) {
    const msg = data.error || (text && text.length < 200 ? text : null) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
