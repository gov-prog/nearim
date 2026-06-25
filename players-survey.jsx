import { useState, useEffect } from "react";

const players = [
  "ישראל חגבי","שלו מויאל","נווה טרכטנגוט","צורי דגני","אוריה סולטן",
  "הראל קמינקר","נוריאל סיטבון","יהודה שלם","יאיר סאסי","עודד שושן",
];

const C = {
  כן:   { bg:"#f97316", glow:"rgba(249,115,22,0.45)", light:"#fff7ed", border:"#ea580c", text:"#c2410c", dark:"#9a3412" },
  לא:   { bg:"#ef4444", glow:"rgba(239,68,68,0.38)",  light:"#fef2f2", border:"#dc2626", text:"#b91c1c", dark:"#7f1d1d" },
  תלוי: { bg:"#8b5cf6", glow:"rgba(139,92,246,0.38)", light:"#f5f3ff", border:"#7c3aed", text:"#6d28d9", dark:"#4c1d95" },
};

const sKey = (i) => `bball-narim-a-player-${i}`;

const PlayerIcon = ({ color = "#fff", size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="45" cy="19" r="9" fill={color} opacity="0.92"/>
    <path d="M39 19 Q45 13 51 19" stroke="rgba(0,0,0,0.18)" strokeWidth="1.3" fill="none"/>
    <path d="M39 19 Q45 25 51 19" stroke="rgba(0,0,0,0.18)" strokeWidth="1.3" fill="none"/>
    <line x1="45" y1="10" x2="45" y2="28" stroke="rgba(0,0,0,0.18)" strokeWidth="1.3"/>
    <circle cx="20" cy="12" r="7.5" fill={color}/>
    <path d="M7 44 C7 30 12 25 20 25 C28 25 33 30 33 44 L31 59 L9 59 Z" fill={color}/>
    <path d="M31 31 Q39 24 44 28" stroke={color} strokeWidth="5.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const SmallPlayerIcon = ({ color = "#fff" }) => (
  <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
    <circle cx="45" cy="19" r="9" fill={color} opacity="0.92"/>
    <circle cx="20" cy="12" r="7.5" fill={color}/>
    <path d="M7 44 C7 30 12 25 20 25 C28 25 33 30 33 44 L31 59 L9 59 Z" fill={color}/>
    <path d="M31 31 Q39 24 44 28" stroke={color} strokeWidth="5.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const GridPattern = () => (
  <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize:"22px 22px", pointerEvents:"none" }} />
);

function exportCSV(responses) {
  const BOM = "\uFEFF";
  const rows = [
    ["#","שם שחקן","סטטוס","סיבה / הערה"],
    ...players.map((p,i) => {
      const r = responses[i];
      return [i+1, p, r?.status || "לא ענה", r?.reason || ""];
    }),
    [],
    ["סיכום",
     `ממשיכים: ${players.filter((_,i)=>responses[i]?.status==="כן").length}`,
     `לא ממשיכים: ${players.filter((_,i)=>responses[i]?.status==="לא").length}`,
     `תלוי: ${players.filter((_,i)=>responses[i]?.status==="תלוי").length}`
    ],
  ];
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob = new Blob([BOM+csv],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="נערים_א_עונה_הבאה.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [responses, setResponses] = useState({});
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("home");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [chosenStatus, setChosenStatus] = useState(null);
  const [reason, setReason]       = useState("");
  const [saving, setSaving]       = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const result = {};
    for (let i = 0; i < players.length; i++) {
      try {
        const res = await window.storage.get(sKey(i), true);
        if (res) result[i] = JSON.parse(res.value);
      } catch(e) { /* key not found */ }
    }
    setResponses(result);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const saveResponse = async () => {
    if (!chosenStatus) return;
    setSaving(true);
    try {
      await window.storage.set(
        sKey(selectedIdx),
        JSON.stringify({ status: chosenStatus, reason, savedAt: new Date().toISOString() }),
        true
      );
      setResponses(prev => ({ ...prev, [selectedIdx]: { status: chosenStatus, reason } }));
      setView("done");
    } catch(e) { alert("שגיאה בשמירה, נסה שוב"); }
    setSaving(false);
  };

  const startAnswer = (idx) => {
    const existing = responses[idx];
    setSelectedIdx(idx);
    setChosenStatus(existing?.status || null);
    setReason(existing?.reason || "");
    setView("answer");
  };

  const answeredCount = Object.keys(responses).length;
  const pct = Math.round((answeredCount / players.length) * 100);
  const player = selectedIdx !== null ? players[selectedIdx] : null;
  const playerResp = selectedIdx !== null ? responses[selectedIdx] : null;
  const counts = Object.fromEntries(["כן","לא","תלוי"].map(s=>[s, players.filter((_,i)=>responses[i]?.status===s).length]));

  /* ── HOME ───────────────────────────────────────────────── */
  if (view === "home") return (
    <div dir="rtl" style={pg}>
      {/* Hero */}
      <div style={heroCard}>
        <GridPattern/>
        {/* decorative large icon */}
        <div style={{ position:"absolute", left:-20, bottom:-20, opacity:0.06, pointerEvents:"none" }}>
          <PlayerIcon color="#fff" size={180}/>
        </div>
        <div style={{ position:"relative", padding:"26px 20px 0" }}>
          <div style={badge}>נערים א׳ • עונה הבאה</div>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:14, marginBottom:20 }}>
            <div style={{ background:"rgba(249,115,22,0.2)", borderRadius:18, padding:"10px 12px", backdropFilter:"blur(8px)" }}>
              <PlayerIcon color="rgba(249,115,22,0.9)" size={52}/>
            </div>
            <div>
              <h1 style={{ color:"#fff", fontSize:22, fontWeight:900, margin:"0 0 4px", lineHeight:1.2 }}>
                האם אתה ממשיך<br/>עונה הבאה?
              </h1>
              <p style={{ color:"#94a3b8", margin:0, fontSize:12 }}>לחץ על שמך וענה</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ background:"rgba(0,0,0,0.25)", padding:"14px 20px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <span style={{ color:"#94a3b8", fontSize:12 }}>{answeredCount}/{players.length} שחקנים ענו</span>
            <span style={{ color: pct===100 ? "#4ade80" : "#f97316", fontSize:12, fontWeight:800 }}>{pct}%</span>
          </div>
          <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:999, height:7, overflow:"hidden" }}>
            <div style={{ background: pct===100 ? "linear-gradient(90deg,#22c55e,#4ade80)" : "linear-gradient(90deg,#f97316,#fb923c)", height:"100%", borderRadius:999, width:`${pct}%`, transition:"width 0.45s" }}/>
          </div>
        </div>
      </div>

      {/* Player list */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"48px 0", color:"#94a3b8", fontSize:14 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🏀</div>
          טוען...
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:9, marginTop:14 }}>
          {players.map((name, idx) => {
            const r = responses[idx];
            const done = !!r;
            const col = done ? C[r.status] : null;
            return (
              <button key={idx} onClick={() => startAnswer(idx)} style={{
                display:"flex", alignItems:"center", gap:12,
                background: done ? `linear-gradient(135deg, #fff 60%, ${col.light})` : "#fff",
                border: done ? `2px solid ${col.border}` : "2px solid #e8edf3",
                borderRadius:18, padding:"12px 14px",
                boxShadow: done ? `0 4px 20px ${col.glow}` : "0 2px 8px rgba(0,0,0,0.05)",
                cursor:"pointer", textAlign:"right", transition:"all 0.22s",
              }}>
                {/* Avatar */}
                <div style={{
                  width:46, height:46, borderRadius:999, flexShrink:0,
                  background: done ? `linear-gradient(135deg,${col.bg},${col.dark})` : "linear-gradient(135deg,#1e3a5f,#334155)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow: done ? `0 4px 14px ${col.glow}` : "0 2px 8px rgba(0,0,0,0.18)",
                  transition:"all 0.3s",
                }}>
                  <SmallPlayerIcon color="rgba(255,255,255,0.95)"/>
                </div>
                <div style={{ flex:1, textAlign:"right" }}>
                  <div style={{ fontWeight:900, fontSize:15, color:"#0f172a" }}>{name}</div>
                  {done
                    ? <div style={{ fontSize:11, color:col.text, fontWeight:700, marginTop:2 }}>✓ ענה • לחץ לעריכה</div>
                    : <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>לא ענה עדיין ›</div>
                  }
                </div>
                {done
                  ? <span style={{ background:col.bg, color:"#fff", borderRadius:999, padding:"5px 14px", fontSize:13, fontWeight:900, flexShrink:0, boxShadow:`0 2px 10px ${col.glow}` }}>{r.status}</span>
                  : <div style={{ width:28, height:28, borderRadius:999, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#94a3b8", fontSize:16 }}>›</div>
                }
              </button>
            );
          })}
        </div>
      )}

      <button onClick={() => { loadAll(); setView("summary"); }}
        style={{ width:"100%", marginTop:18, padding:"14px", background:"linear-gradient(135deg,#1e3a5f,#0f172a)", color:"#fff", border:"none", borderRadius:16, fontSize:14, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 18px rgba(15,23,42,0.3)" }}>
        📊 סיכום ויצוא לאקסל
      </button>
    </div>
  );

  /* ── ANSWER ─────────────────────────────────────────────── */
  if (view === "answer") {
    const needsReason = chosenStatus === "לא" || chosenStatus === "תלוי";
    const col = chosenStatus ? C[chosenStatus] : null;
    return (
      <div dir="rtl" style={pg}>
        <div style={heroCard}>
          <GridPattern/>
          <div style={{ position:"absolute", left:-10, bottom:-10, opacity:0.07, pointerEvents:"none" }}>
            <PlayerIcon color="#fff" size={160}/>
          </div>
          <div style={{ position:"relative", padding:"26px 20px 26px", textAlign:"center" }}>
            {/* Big avatar */}
            <div style={{
              width:84, height:84, borderRadius:999, margin:"0 auto 16px",
              background: col ? `linear-gradient(135deg,${col.bg},${col.dark})` : "linear-gradient(135deg,#1e3a5f,#334155)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: col ? `0 8px 30px ${col.glow}` : "0 4px 20px rgba(0,0,0,0.35)",
              border: col ? `3px solid rgba(255,255,255,0.25)` : "3px solid rgba(255,255,255,0.1)",
              transition:"all 0.35s cubic-bezier(.4,0,.2,1)",
            }}>
              <PlayerIcon color="rgba(255,255,255,0.95)" size={56}/>
            </div>
            <div style={badge}>נערים א׳</div>
            <h2 style={{ color:"#fff", fontSize:24, fontWeight:900, margin:"8px 0 4px" }}>{player}</h2>
            <p style={{ color:"#94a3b8", margin:0, fontSize:14 }}>האם אתה ממשיך עונה הבאה?</p>
          </div>
        </div>

        <div style={{ marginTop:18 }}>
          {/* Big 3 status buttons */}
          <div style={{ display:"flex", gap:10 }}>
            {["כן","לא","תלוי"].map(s => {
              const active = chosenStatus === s;
              return (
                <button key={s} onClick={() => setChosenStatus(active ? null : s)} style={{
                  flex:1, padding:"22px 6px",
                  borderRadius:20,
                  border: `2px solid ${active ? C[s].bg : C[s].border+"44"}`,
                  background: active ? `linear-gradient(155deg,${C[s].bg},${C[s].dark})` : "#fff",
                  color: active ? "#fff" : C[s].text,
                  fontWeight:900, fontSize:20, cursor:"pointer",
                  boxShadow: active ? `0 8px 24px ${C[s].glow}` : "0 2px 8px rgba(0,0,0,0.06)",
                  transform: active ? "translateY(-4px) scale(1.05)" : "scale(1)",
                  transition:"all 0.22s cubic-bezier(.4,0,.2,1)",
                }}>
                  {s}
                  {active && <div style={{ fontSize:10, marginTop:4, opacity:0.8 }}>✓ נבחר</div>}
                </button>
              );
            })}
          </div>

          {/* Reason */}
          {needsReason && (
            <div style={{ marginTop:14, background:"#fff", borderRadius:18, padding:"16px", boxShadow:`0 4px 20px ${col.glow}50`, border:`2px solid ${col.border}` }}>
              <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:800, color:col.text }}>
                {chosenStatus === "לא" ? "💬 למה לא ממשיך?" : "💬 מה זה תלוי בו?"}
              </p>
              <textarea
                autoFocus value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={chosenStatus === "לא" ? "כתוב את הסיבה..." : "מה מחליט לגביך?"}
                style={{ width:"100%", minHeight:80, padding:"11px 13px", border:`2px solid ${col.border}55`, borderRadius:12, fontSize:14, fontFamily:"inherit", color:"#0f172a", resize:"vertical", outline:"none", boxSizing:"border-box", background:"#fafafa" }}
                onFocus={e=>e.target.style.borderColor=col.bg}
                onBlur={e=>e.target.style.borderColor=`${col.border}55`}
              />
            </div>
          )}

          <button onClick={saveResponse} disabled={!chosenStatus||saving} style={{
            width:"100%", marginTop:14, padding:"17px",
            background: col ? `linear-gradient(135deg,${col.bg},${col.dark})` : "#e2e8f0",
            color: col ? "#fff" : "#94a3b8",
            border:"none", borderRadius:17, fontSize:16, fontWeight:900,
            cursor: col ? "pointer" : "not-allowed",
            boxShadow: col ? `0 8px 28px ${col.glow}` : "none",
            transition:"all 0.25s", opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "שומר..." : col ? "✅ שמור תשובה" : "בחר תחילה"}
          </button>

          <button onClick={() => setView("home")} style={{ width:"100%", marginTop:10, padding:"13px", background:"transparent", color:"#94a3b8", border:"2px solid #e2e8f0", borderRadius:16, fontSize:14, fontWeight:700, cursor:"pointer" }}>
            ← חזרה לרשימה
          </button>
        </div>
      </div>
    );
  }

  /* ── DONE ───────────────────────────────────────────────── */
  if (view === "done") {
    const r = responses[selectedIdx];
    const col = r ? C[r.status] : C["כן"];
    return (
      <div dir="rtl" style={{ ...pg, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <div style={{ background:"#fff", borderRadius:28, padding:"40px 28px", boxShadow:`0 12px 50px ${col.glow}`, border:`2px solid ${col.border}`, width:"100%", maxWidth:400, textAlign:"center" }}>
          <div style={{ width:90, height:90, borderRadius:999, background:`linear-gradient(135deg,${col.bg},${col.dark})`, margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 30px ${col.glow}` }}>
            <PlayerIcon color="rgba(255,255,255,0.95)" size={58}/>
          </div>
          <h2 style={{ color:"#0f172a", fontSize:26, fontWeight:900, margin:"0 0 6px" }}>תשובה נשמרה!</h2>
          <p style={{ color:"#64748b", margin:"0 0 22px", fontSize:14 }}>תודה {player} 🙌</p>

          <div style={{ background: col.light, borderRadius:16, padding:"16px 20px", border:`2px solid ${col.border}`, marginBottom:20 }}>
            <div style={{ fontWeight:900, fontSize:18, color:"#0f172a", marginBottom:10 }}>{player}</div>
            <span style={{ background:col.bg, color:"#fff", borderRadius:999, padding:"6px 20px", fontSize:16, fontWeight:900, boxShadow:`0 3px 14px ${col.glow}` }}>{r?.status}</span>
            {r?.reason && <div style={{ marginTop:12, fontSize:13, color:"#475569", background:"#fff", borderRadius:10, padding:"8px 12px" }}>{r.reason}</div>}
          </div>

          <div style={{ color:"#94a3b8", fontSize:13, marginBottom:22 }}>
            {answeredCount}/{players.length} שחקנים ענו עד כה
          </div>

          <button onClick={()=>{ loadAll(); setView("home"); }} style={{ width:"100%", padding:"14px", background:`linear-gradient(135deg,${col.bg},${col.dark})`, color:"#fff", border:"none", borderRadius:15, fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:`0 5px 20px ${col.glow}` }}>
            ← חזרה לרשימה
          </button>
        </div>
      </div>
    );
  }

  /* ── SUMMARY ────────────────────────────────────────────── */
  if (view === "summary") return (
    <div dir="rtl" style={pg}>
      <div style={heroCard}>
        <GridPattern/>
        <div style={{ position:"relative", padding:"24px 20px 22px", textAlign:"center" }}>
          <div style={badge}>נערים א׳</div>
          <h1 style={{ color:"#fff", fontSize:23, fontWeight:900, margin:"8px 0 4px" }}>סיכום</h1>
          <p style={{ color:"#94a3b8", margin:0, fontSize:13 }}>{answeredCount}/{players.length} שחקנים ענו</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, margin:"16px 0" }}>
        {["כן","לא","תלוי"].map(s => (
          <div key={s} style={{ background:"#fff", borderRadius:18, padding:"18px 8px", textAlign:"center", border:`2px solid ${C[s].border}`, boxShadow:`0 5px 20px ${C[s].glow}` }}>
            <div style={{ fontSize:36, fontWeight:900, color:C[s].text }}>{counts[s]}</div>
            <div style={{ width:26, height:3, background:C[s].bg, borderRadius:99, margin:"4px auto 6px" }}/>
            <div style={{ fontSize:13, fontWeight:800, color:C[s].text }}>{s}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {players.map((name, idx) => {
          const r = responses[idx];
          if (!r) return (
            <div key={idx} style={{ background:"#fff", borderRadius:14, padding:"12px 16px", border:"2px solid #f1f5f9", display:"flex", alignItems:"center", gap:10, opacity:0.6 }}>
              <div style={{ width:38, height:38, borderRadius:999, background:"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <SmallPlayerIcon color="#94a3b8"/>
              </div>
              <span style={{ fontWeight:700, fontSize:14, color:"#94a3b8", flex:1 }}>{name}</span>
              <span style={{ color:"#cbd5e1", fontSize:12, background:"#f8fafc", padding:"3px 10px", borderRadius:999 }}>לא ענה</span>
            </div>
          );
          const col = C[r.status];
          return (
            <div key={idx} style={{ background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:`0 3px 16px ${col.glow}44`, display:"flex" }}>
              <div style={{ width:5, background:col.bg, flexShrink:0 }}/>
              <div style={{ flex:1, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:999, background:`linear-gradient(135deg,${col.bg},${col.dark})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 2px 10px ${col.glow}` }}>
                  <SmallPlayerIcon color="rgba(255,255,255,0.95)"/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>{name}</div>
                  {r.reason && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{r.reason}</div>}
                </div>
                <span style={{ background:col.bg, color:"#fff", borderRadius:999, padding:"4px 13px", fontSize:12, fontWeight:900, boxShadow:`0 2px 8px ${col.glow}`, flexShrink:0 }}>{r.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:20 }}>
        <button onClick={() => exportCSV(responses)} style={{ width:"100%", padding:"15px", background:"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", border:"none", borderRadius:16, fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 5px 22px rgba(22,163,74,0.42)" }}>
          📊 יצוא לאקסל (CSV)
        </button>
        <button onClick={() => { loadAll(); setView("home"); }} style={{ width:"100%", padding:"13px", background:"transparent", color:"#64748b", border:"2px solid #e2e8f0", borderRadius:16, fontSize:14, fontWeight:700, cursor:"pointer" }}>
          ← חזרה
        </button>
      </div>
    </div>
  );

  return null;
}

const pg = { fontFamily:"'Segoe UI','Arial Hebrew',Arial,sans-serif", minHeight:"100vh", background:"#f1f5f9", padding:"20px 14px 48px", maxWidth:520, margin:"0 auto" };
const heroCard = { background:"linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%)", borderRadius:24, overflow:"hidden", position:"relative" };
const badge = { display:"inline-block", background:"rgba(249,115,22,0.22)", border:"1px solid rgba(249,115,22,0.5)", color:"#fb923c", borderRadius:999, padding:"3px 13px", fontSize:11, fontWeight:700, letterSpacing:0.8 };
