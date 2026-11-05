import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Recovers the report from the server when localStorage was wiped
// (crash, reload, new tab). Requires the report_token + user session id.
export async function recoverReportFromServer() {
  try {
    const token = localStorage.getItem("leaderos_report_token");
    const user = JSON.parse(localStorage.getItem("emergent_user") || "{}");
    const sid = user.session_id || user.user_id;
    if (!token || !sid) return null;
    const res = await axios.get(`${API}/report/${sid}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });
    if (res.data?.session_id) {
      localStorage.setItem("emergent_report", JSON.stringify(res.data));
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}
