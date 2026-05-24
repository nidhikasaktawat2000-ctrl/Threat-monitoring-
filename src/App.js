import { useState, useEffect, useRef } from "react";

const SAMPLE_LOGS = [
  { id: 1, time: "2025-05-23 08:12:34", type: "AUTH_FAILURE", source: "192.168.1.45", user: "admin", detail: "Failed SSH login attempt", raw: "sshd[1234]: Failed password for admin from 192.168.1.45 port 22 ssh2" },
  { id: 2, time: "2025-05-23 08:12:35", type: "AUTH_FAILURE", source: "192.168.1.45", user: "admin", detail: "Failed SSH login attempt", raw: "sshd[1234]: Failed password for admin from 192.168.1.45 port 22 ssh2" },
  { id: 3, time: "2025-05-23 08:12:36", type: "AUTH_FAILURE", source: "192.168.1.45", user: "admin", detail: "Failed SSH login attempt", raw: "sshd[1234]: Failed password for admin from 192.168.1.45 port 22 ssh2" },
  { id: 4, time: "2025-05-23 08:12:37", type: "AUTH_FAILURE", source: "192.168.1.45", user: "root", detail: "Failed SSH login attempt", raw: "sshd[1234]: Failed password for root from 192.168.1.45 port 22 ssh2" },
  { id: 5, time: "2025-05-23 08:12:38", type: "AUTH_FAILURE", source: "192.168.1.45", user: "root", detail: "Failed SSH login attempt", raw: "sshd[1234]: Failed password for root from 192.168.1.45 port 22 ssh2" },
  { id: 6, time: "2025-05-23 08:14:01", type: "PORT_SCAN", source: "203.0.113.22", user: "-", detail: "Sequential port scan detected", raw: "kernel: IN=eth0 SRC=203.0.113.22 DST=10.0.0.5 PROTO=TCP DPT=21,22,23,25,80,443,3306,8080" },
  { id: 7, time: "2025-05-23 08:15:22", type: "AUTH_SUCCESS", source: "10.0.0.8", user: "jsmith", detail: "Successful login after hours", raw: "sshd[5678]: Accepted password for jsmith from 10.0.0.8 port 51234 ssh2" },
  { id: 8, time: "2025-05-23 08:17:45", type: "FILE_ACCESS", source: "10.0.0.15", user: "mlopez", detail: "Access to /etc/passwd", raw: "audit: SYSCALL arch=x86_64 syscall=openat uid=1001 exe=/bin/cat path=/etc/passwd" },
  { id: 9, time: "2025-05-23 08:22:10", type: "NETWORK_ANOMALY", source: "10.0.0.20", user: "svc-backup", detail: "Unusually large outbound transfer (2.1 GB)", raw: "netflow: src=10.0.0.20 dst=198.51.100.45 bytes=2254857216 proto=TCP port=443" },
  { id: 10, time: "2025-05-23 08:25:00", type: "PRIV_ESCALATION", source: "10.0.0.15", user: "mlopez", detail: "sudo su - root executed", raw: "sudo: mlopez : TTY=pts/0 ; PWD=/home/mlopez ; USER=root ; COMMAND=/bin/su -" },
  { id: 11, time: "2025-05-23 08:26:11", type: "MALWARE_DETECT", source: "10.0.0.31", user: "svc-web", detail: "Webshell detected in /var/www/html/upload/", raw: "antivirus: ALERT file=/var/www/html/upload/img.php.jpg type=PHP/WebShell.Generic" },
  { id: 12, time: "2025-05-23 08:30:00", type: "AUTH_FAILURE", source: "198.18.0.55", user: "administrator", detail: "RDP brute force attempt", raw: "Security: EventID=4625 Account=administrator Source=198.18.0.55 LogonType=10" },
  { id: 13, time: "2025-05-23 08:31:00", type: "AUTH_FAILURE", source: "198.18.0.55", user: "administrator", detail: "RDP brute force attempt", raw: "Security: EventID=4625 Account=administrator Source=198.18.0.55 LogonType=10" },
  { id: 14, time: "2025-05-23 08:45:12", type: "DNS_ANOMALY", source: "10.0.0.20", user: "-", detail: "DNS query to known C2 domain: update-svc[.]net", raw: "dns: query=update-svc.net type=A src=10.0.0.20 NXDOMAIN" },
  { id: 15, time: "2025-05-23 09:01:33", type: "AUTH_SUCCESS", source: "10.0.0.5", user: "hradmin", detail: "Normal business hours login", raw: "sshd[9012]: Accepted publickey for hradmin from 10.0.0.5 port 55100 ssh2" },
];

const TYPE_META = {
  AUTH_FAILURE:    { icon: "ti-lock-x",           color: "#E24B4A", label: "Auth Failure" },
  AUTH_SUCCESS:    { icon: "ti-lock-check",        color: "#639922", label: "Auth Success" },
  PORT_SCAN:       { icon: "ti-radar",             color: "#BA7517", label: "Port Scan" },
  FILE_ACCESS:     { icon: "ti-file-search",       color: "#7F77DD", label: "File Access" },
  NETWORK_ANOMALY: { icon: "ti-alert-triangle",    color: "#EF9F27", label: "Net Anomaly" },
  PRIV_ESCALATION: { icon: "ti-crown",             color: "#E24B4A", label: "Priv Escalation" },
  MALWARE_DETECT:  { icon: "ti-virus",             color: "#D85A30", label: "Malware" },
  DNS_ANOMALY:     { icon: "ti-world-exclamation", color: "#BA7517", label: "DNS Anomaly" },
};

function Badge({ level }) {
  const colors = { CRITICAL: ["#FCEBEB","#A32D2D"], HIGH: ["#FAEEDA","#854F0B"], MEDIUM: ["#E6F1FB","#185FA5"], LOW: ["#EAF3DE","#3B6D11"], INFO: ["#F1EFE8","#5F5E5A"] };
  const [bg, fg] = colors[level] || colors.INFO;
  return <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6 }}>{level}</span>;
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#888", fontSize: 13 }}>
      <div style={{ width: 16, height: 16, border: "2px solid #ddd", borderTopColor: "#4a90d9", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Analyzing...
    </div>
  );
}

export default function App() {
  const [logs] = useState(SAMPLE_LOGS);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  async function runAnalysis() {
    setLoading(true);
    setAnalysis(null);
    await new Promise(r => setTimeout(r, 2000));
    const result = {
      summary: "Critical security incident detected. A coordinated brute force attack from 192.168.1.45 has been identified alongside a webshell upload and possible data exfiltration of 2.1GB. Immediate action required.",
      totalAlerts: 15,
      falsePositives: 2,
      realThreats: 6,
      threats: [
        { id: "T1", title: "SSH Brute Force Attack", severity: "CRITICAL", type: "Credential Attack", confidence: 98, sourceIPs: ["192.168.1.45"], affectedAssets: ["SSH Server"], description: "IP 192.168.1.45 ne 5 baar galat password try kiya admin aur root account pe. Yeh brute force attack hai.", recommendation: "Firewall mein 192.168.1.45 ko block karo. SSH ke liye sirf SSH key use karo.", isFalsePositive: false },
        { id: "T2", title: "Webshell Detected", severity: "CRITICAL", type: "Malware / Backdoor", confidence: 99, sourceIPs: ["10.0.0.31"], affectedAssets: ["/var/www/html/upload/"], description: "Web server pe ek PHP webshell upload hua hai. Yeh attacker ko server ka full control de sakta hai.", recommendation: "File delete karo: /var/www/html/upload/img.php.jpg. Web server restart karo.", isFalsePositive: false },
        { id: "T3", title: "Data Exfiltration (2.1 GB)", severity: "HIGH", type: "Data Theft", confidence: 87, sourceIPs: ["10.0.0.20"], affectedAssets: ["svc-backup"], description: "svc-backup account se 2.1GB data bahar bheja gaya hai. Yeh data chori ka strong sign hai.", recommendation: "10.0.0.20 ko network se disconnect karo. Destination IP block karo.", isFalsePositive: false },
        { id: "T4", title: "Privilege Escalation", severity: "HIGH", type: "Lateral Movement", confidence: 92, sourceIPs: ["10.0.0.15"], affectedAssets: ["mlopez account"], description: "Normal user mlopez ne /etc/passwd access kiya aur phir root ban gaya sudo se.", recommendation: "mlopez ka password reset karo. sudo access revoke karo.", isFalsePositive: false },
        { id: "T5", title: "C2 DNS Query", severity: "HIGH", type: "Command & Control", confidence: 85, sourceIPs: ["10.0.0.20"], affectedAssets: ["Internal Network"], description: "10.0.0.20 ne ek known malicious domain query kiya. Yeh malware C2 server se baat karne ki koshish hai.", recommendation: "DNS level pe update-svc.net block karo. 10.0.0.20 isolate karo.", isFalsePositive: false },
        { id: "T6", title: "After-Hours Login", severity: "MEDIUM", type: "Suspicious Access", confidence: 70, sourceIPs: ["10.0.0.8"], affectedAssets: ["jsmith account"], description: "jsmith ne unusual time pe login kiya. Suspicious lagta hai.", recommendation: "jsmith se confirm karo. MFA enable karo.", isFalsePositive: false },
        { id: "T7", title: "hradmin Business Hours Login", severity: "INFO", type: "Normal Activity", confidence: 95, sourceIPs: ["10.0.0.5"], affectedAssets: ["hradmin"], description: "Normal business hours mein normal login.", recommendation: "Kuch nahi karna.", isFalsePositive: true },
        { id: "T8", title: "RDP Login Attempts", severity: "INFO", type: "Possible Scan", confidence: 60, sourceIPs: ["198.18.0.55"], affectedAssets: ["Windows Server"], description: "Sirf 2 attempts — automated scanner ho sakta hai.", recommendation: "Monitor karo.", isFalsePositive: true },
      ]
    };
    setAnalysis(result);
    setSelectedThreat(result.threats[0]);
    setLoading(false);
  }

  async function sendChat() {
    if (!chatMsg.trim() || chatLoading) return;
    const msg = chatMsg.trim();
    setChatMsg("");
    setChatHistory(h => [...h, { role: "user", content: msg }]);
    setChatLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setChatHistory(h => [...h, { role: "assistant", content: "Demo mode mein AI chat available nahi hai. Upar 'Run AI Analysis' button se threat analysis dekh sakte ho!" }]);
    setChatLoading(false);
  }

  const criticalCount = analysis?.threats?.filter(t => t.severity === "CRITICAL" && !t.isFalsePositive).length || 0;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; } }
        .threat-row { cursor: pointer; border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; border: 1px solid #eee; transition: background 0.15s; }
        .threat-row:hover { background: #f5f5f5; }
        .threat-row.active { background: #EBF4FF; border-color: #90CDF4; }
        .tab-btn { padding: 6px 16px; border-radius: 8px; border: 1px solid #ddd; background: transparent; cursor: pointer; font-size: 14px; color: #666; }
        .tab-btn.active { background: white; color: #111; border-color: #999; font-weight: 500; }
        .log-row { font-size: 12px; font-family: monospace; padding: 6px 10px; border-radius: 6px; margin-bottom: 3px; background: #f9f9f9; display: flex; gap: 10px; }
        .chat-user { background: #EBF4FF; border-radius: 12px 12px 4px 12px; padding: 10px 14px; font-size: 14px; max-width: 80%; align-self: flex-end; }
        .chat-ai { background: #f5f5f5; border-radius: 12px 12px 12px 4px; padding: 10px 14px; font-size: 14px; max-width: 85%; align-self: flex-start; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0C447C", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>🛡</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Security Threat Monitor</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{logs.length} events loaded</p>
          </div>
        </div>
        <button onClick={runAnalysis} disabled={loading} style={{ padding: "8px 18px", borderRadius: 8, background: "#0C447C", color: "white", border: "none", cursor: "pointer", fontWeight: 500, fontSize: 14 }}>
          {loading ? "Analyzing..." : "▶ Run AI Analysis"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[["dashboard","📊 Threat Dashboard"],["logs","📋 Raw Logs"],["chat","💬 AI Chat"]].map(([t,label]) => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{label}</button>
        ))}
      </div>

      {/* DASHBOARD */}
      {activeTab === "dashboard" && (
        <div>
          {!analysis && !loading && (
            <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed #ddd", borderRadius: 12, color: "#888" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontWeight: 500, color: "#333", marginBottom: 6 }}>No analysis yet</p>
              <p style={{ fontSize: 14, margin: 0 }}>Click "Run AI Analysis" to scan {logs.length} security events</p>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ width: 40, height: 40, border: "3px solid #eee", borderTopColor: "#4a90d9", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ fontWeight: 500 }}>AI analyzing security logs...</p>
              <p style={{ fontSize: 13, color: "#888" }}>Grouping events · Filtering false positives · Assessing severity</p>
            </div>
          )}
          {analysis && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              {/* Metric cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Alerts", value: analysis.totalAlerts, color: "#185FA5" },
                  { label: "False Positives", value: analysis.falsePositives, color: "#3B6D11" },
                  { label: "Real Threats", value: analysis.realThreats, color: "#E24B4A" },
                  { label: "Critical", value: criticalCount, color: "#A32D2D" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#f9f9f9", borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {/* Summary */}
              <div style={{ background: "#EBF4FF", borderRadius: 10, padding: "12px 16px", marginBottom: 20, borderLeft: "3px solid #4a90d9" }}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{analysis.summary}</p>
              </div>
              {/* Threat list + detail */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#888", margin: "0 0 10px", textTransform: "uppercase" }}>Threats Detected</p>
                  {analysis.threats.filter(t => !t.isFalsePositive).map(t => (
                    <div key={t.id} className={`threat-row ${selectedThreat?.id === t.id ? "active" : ""}`} onClick={() => setSelectedThreat(t)}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</span>
                        <Badge level={t.severity} />
                      </div>
                      <div style={{ fontSize: 12, color: "#888" }}>{t.type} · {t.confidence}% confidence</div>
                    </div>
                  ))}
                  {analysis.threats.some(t => t.isFalsePositive) && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>✅ False positives filtered:</p>
                      {analysis.threats.filter(t => t.isFalsePositive).map(t => (
                        <div key={t.id} style={{ fontSize: 12, color: "#aaa", padding: "4px 8px", background: "#f5f5f5", borderRadius: 6, marginBottom: 4 }}>{t.title}</div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedThreat && (
                  <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 16, animation: "fadeIn 0.2s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{selectedThreat.title}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{selectedThreat.type}</p>
                      </div>
                      <Badge level={selectedThreat.severity} />
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#888", margin: "0 0 4px" }}>KYA HO RAHA HAI</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>{selectedThreat.description}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#888", margin: "0 0 4px" }}>KYA KARNA HAI</p>
                    <div style={{ background: "#EAF3DE", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                      <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "#27500A" }}>{selectedThreat.recommendation}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {selectedThreat.sourceIPs.map(ip => <span key={ip} style={{ fontSize: 11, fontFamily: "monospace", background: "#FCEBEB", color: "#A32D2D", borderRadius: 4, padding: "2px 6px" }}>{ip}</span>)}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${selectedThreat.confidence}%`, background: selectedThreat.confidence > 85 ? "#E24B4A" : "#EF9F27", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#888" }}>{selectedThreat.confidence}% confidence</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOGS */}
      {activeTab === "logs" && (
        <div style={{ maxHeight: 500, overflowY: "auto", borderRadius: 10, border: "1px solid #eee", padding: 10 }}>
          {logs.map(log => {
            const meta = TYPE_META[log.type] || { color: "#888" };
            return (
              <div key={log.id} className="log-row">
                <span style={{ color: meta.color, minWidth: 140 }}>{log.time}</span>
                <span style={{ color: meta.color, minWidth: 120, fontWeight: 500 }}>{log.type}</span>
                <span style={{ color: "#888", minWidth: 110 }}>{log.source}</span>
                <span style={{ color: "#333" }}>{log.detail}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* CHAT */}
      {activeTab === "chat" && (
        <div>
          <div style={{ height: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "4px 0", marginBottom: 12 }}>
            {chatHistory.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <p style={{ fontSize: 14, margin: "0 0 12px" }}>Security logs ke baare mein kuch bhi poochho</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {["Which IP should I block first?", "Explain the brute force attack", "Is the data exfiltration confirmed?"].map(q => (
                    <button key={q} onClick={() => setChatMsg(q)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, border: "1px solid #ddd", background: "transparent", cursor: "pointer", color: "#666" }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} className={m.role === "user" ? "chat-user" : "chat-ai"}>
                {m.content}
              </div>
            ))}
            {chatLoading && <div className="chat-ai"><Spinner /></div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Koi bhi sawaal poochho..." style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14 }} />
            <button onClick={sendChat} disabled={chatLoading || !chatMsg.trim()} style={{ padding: "9px 18px", borderRadius: 10, background: "#0C447C", color: "white", border: "none", cursor: "pointer", fontSize: 14 }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}