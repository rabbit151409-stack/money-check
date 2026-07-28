import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import {
  PiggyBank, Landmark, Home, Repeat, Wallet, Coins, Plus, Check, Pencil, X,
  ChevronDown, CalendarDays, TrendingUp, Trash2, Building2, ArrowRight,
  NotebookPen, ArrowLeft,
} from "lucide-react";

const C = {
  bg: "#EBEBEB", card: "#FFFFFF", ink: "#1A1A1A", sub: "#8E8E93",
  hero: "#161618", heroDeep: "#000000", accent: "#FFFFFF",
  line: "#E7E7EA", soft: "#F4F4F5",
};

const PALETTE = ["#FF524D", "#FF8637", "#FFDE5A", "#31B54C", "#43B4FB", "#DB95FD"];

const BANKS = [
  "한국은행",
  "국민은행", "신한은행", "우리은행", "하나은행",
  "대구은행", "경남은행", "광주은행", "제주은행", "부산은행", "전북은행",
  "씨티은행", "제일은행",
  "카카오뱅크", "케이뱅크", "토스뱅크",
  "기업은행", "농협은행", "산업은행", "수출입은행",
];
const ICON_MAP = { piggy: PiggyBank, landmark: Landmark, home: Home, repeat: Repeat, coins: Coins, wallet: Wallet };
const iconOf = (c) => ICON_MAP[c.iconKey] || (c.kind === "save" ? PiggyBank : Coins);
const tagOf = (c) => (c.kind === "save" ? "모으는 돈" : "나가는 돈");
const KIND_COLOR = { save: "#31B54C", out: "#FF524D" };

const INIT_CATS = [];

const won = (n) => Math.round(n).toLocaleString("ko-KR");
const sumItems = (items) => items.reduce((s, x) => s + (x.a || 0), 0);
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const fmtDate = (s) => { const [, m, d] = s.split("-"); return `${Number(m)}/${Number(d)}`; };

export default function App() {
  const [cats, setCats] = useState(INIT_CATS);
  const [payday, setPayday] = useState(25);
  const [payAccount, setPayAccount] = useState("");
  const [startSaved, setStartSaved] = useState(0);
  const [records, setRecords] = useState([]);

  const [open, setOpen] = useState({ save: true });
  const [edit, setEdit] = useState(null);
  const [editDraft, setEditDraft] = useState({ n: "", acc: "", a: "" });
  const [addingTo, setAddingTo] = useState(null);
  const [newItem, setNewItem] = useState({ n: "", acc: "", a: "" });
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", kind: "out" });
  const [recAmt, setRecAmt] = useState("");
  const [showRecords, setShowRecords] = useState(false);
  const [showAllocBar, setShowAllocBar] = useState(true);
  const [page, setPage] = useState("home");
  const [ledger, setLedger] = useState([]);
  const [ledgerForm, setLedgerForm] = useState({ type: "expense", memo: "", amount: "", date: todayStr() });
  const [tab, setTab] = useState("bank");
  const [editPayday, setEditPayday] = useState(false);
  const [paydayDraft, setPaydayDraft] = useState(String(payday));

  const salary = records.length ? records[0].amount : 0;

  const catTotals = useMemo(
    () => Object.fromEntries(cats.map((c) => [c.id, sumItems(c.items)])),
    [cats]
  );
  const saveSum = useMemo(() => cats.filter((c) => c.kind === "save").reduce((s, c) => s + sumItems(c.items), 0), [cats]);
  const outSum = useMemo(() => cats.filter((c) => c.kind === "out").reduce((s, c) => s + sumItems(c.items), 0), [cats]);
  const life = salary - saveSum - outSum;

  const ledgerExpense = useMemo(() => ledger.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0), [ledger]);
  const ledgerIncome = useMemo(() => ledger.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0), [ledger]);
  const ledgerLeft = life - ledgerExpense + ledgerIncome;

  const segments = [
    ...cats.map((c) => ({ id: c.id, label: c.name, amt: catTotals[c.id] || 0, color: c.color })),
    { id: "life", label: "생활비", amt: Math.max(0, life), color: "#FF524D" },
  ];

  // 은행(통장)별 이체 금액
  const bankRows = useMemo(() => {
    const m = {};
    cats.forEach((c) => c.items.forEach((it) => {
      const k = (it.acc || "-").trim() || "-";
      m[k] = (m[k] || 0) + (it.a || 0);
    }));
    return Object.entries(m).map(([acc, amount]) => ({ acc, amount })).sort((a, b) => b.amount - a.amount);
  }, [cats]);

  const chartData = useMemo(() => {
    const arr = [];
    const base = new Date(2026, 6, 1);
    for (let i = 0; i < 18; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      arr.push({
        m: `${String(d.getFullYear()).slice(2)}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        saved: startSaved + saveSum * i,
      });
    }
    return arr;
  }, [saveSum, startSaved]);

  // ---- actions ----
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const startEdit = (catId, idx, item) => { setEdit(`${catId}:${idx}`); setEditDraft({ n: item.n, acc: item.acc || "", a: String(item.a) }); };
  function saveEdit(catId, idx) {
    const v = parseInt(String(editDraft.a).replace(/[^0-9]/g, ""), 10) || 0;
    setCats((prev) => prev.map((c) => c.id === catId ? { ...c, items: c.items.map((it, i) => i === idx ? { ...it, n: editDraft.n.trim() || it.n, acc: editDraft.acc.trim() || "-", a: v } : it) } : c));
    setEdit(null);
  }
  function delItem(catId, idx) {
    setCats((prev) => prev.map((c) => c.id === catId ? { ...c, items: c.items.filter((_, i) => i !== idx) } : c));
    if (edit && edit.startsWith(`${catId}:`)) setEdit(null);
  }
  function startAdd(catId) { setAddingTo(catId); setNewItem({ n: "", acc: "", a: "" }); setOpen((o) => ({ ...o, [catId]: true })); }
  function confirmAdd(catId) {
    if (!newItem.n.trim()) return;
    const amt = parseInt(String(newItem.a).replace(/[^0-9]/g, ""), 10) || 0;
    setCats((prev) => prev.map((c) => c.id === catId ? { ...c, items: [...c.items, { n: newItem.n.trim(), acc: newItem.acc.trim() || "-", a: amt }] } : c));
    setAddingTo(null);
  }

  function addCategory() {
    if (!newCat.name.trim()) return;
    const used = cats.map((c) => c.color);
    const color = PALETTE.find((p) => !used.includes(p)) || PALETTE[cats.length % PALETTE.length];
    const id = `c${Date.now()}`;
    setCats((prev) => [...prev, { id, name: newCat.name.trim(), kind: newCat.kind, color, iconKey: newCat.kind === "save" ? "piggy" : "coins", items: [] }]);
    setOpen((o) => ({ ...o, [id]: true }));
    setShowAddCat(false);
    setNewCat({ name: "", kind: "out" });
  }
  function delCategory(catId) {
    setCats((prev) => prev.filter((c) => c.id !== catId));
  }

  function addRecord() {
    const amt = parseInt(recAmt.replace(/[^0-9]/g, ""), 10);
    if (!amt) return;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setRecords((prev) => [{ id: Date.now(), ym, day: payday, amount: amt }, ...prev]);
    setRecAmt("");
  }
  const delRecord = (id) => setRecords((prev) => prev.filter((r) => r.id !== id));
  const savePayday = () => { setPayday(parseInt(paydayDraft, 10) || 25); setEditPayday(false); };

  function addLedger() {
    const amt = parseInt(String(ledgerForm.amount).replace(/[^0-9]/g, ""), 10);
    if (!amt) return;
    setLedger((prev) => [{ id: Date.now(), type: ledgerForm.type, memo: ledgerForm.memo.trim() || (ledgerForm.type === "expense" ? "지출" : "수입"), amount: amt, date: ledgerForm.date || todayStr() }, ...prev]);
    setLedgerForm((f) => ({ ...f, memo: "", amount: "" }));
  }
  const delLedger = (id) => setLedger((prev) => prev.filter((e) => e.id !== id));

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        * { font-family: 'Noto Sans KR', system-ui, sans-serif; box-sizing: border-box; }
        .num { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
        .tap { transition: transform .12s ease; }
        .tap:active { transform: scale(0.97); }
        input:focus { outline: 2px solid ${C.hero}; outline-offset: 1px; }
        .chev { transition: transform .2s ease; }
        html, body { margin: 0; max-width: 100%; overflow-x: hidden; }
        * { max-width: 100%; }
        .app-container { width: 100%; max-width: 460px; margin: 0 auto; padding: 22px 18px 104px; }
        .hero-amt { font-size: clamp(34px, 11vw, 44px); }
        .bottom-nav { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); z-index: 50; }
        @media (max-width: 360px) {
          .app-container { padding: 16px 13px 100px; }
        }
        @media (min-width: 700px) {
          .app-container { max-width: 500px; padding-top: 32px; }
        }
      `}</style>

      <div className="app-container">
        {page === "home" && (<>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Money Check</div>
        </div>

        {/* HERO */}
        <div style={{ background: `linear-gradient(165deg, #26262A, ${C.heroDeep})`, borderRadius: 28, padding: "24px 24px 22px", color: "#FFFFFF", boxShadow: "0 20px 44px -20px rgba(0,0,0,0.45)", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>이번 달 쓸 수 있는 생활비</div>
          <div className="num" style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
            <span className="hero-amt" style={{ fontWeight: 900, color: C.accent, lineHeight: 1 }}>{won(life)}</span>
            <span style={{ fontSize: 19, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>원</span>
          </div>
          {(saveSum + outSum) > 0 && (<>
          <button onClick={() => setShowAllocBar((s) => !s)} className="tap flex items-center justify-between"
            style={{ width: "100%", marginTop: 18, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, padding: "10px 12px", cursor: "pointer" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>이번 달 배분 비율</span>
            <ChevronDown size={16} color="rgba(255,255,255,0.75)" className="chev" style={{ transform: showAllocBar ? "rotate(180deg)" : "none" }} />
          </button>
          {showAllocBar && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.14)" }}>
              {segments.map((s) => (<div key={s.id} title={s.label} style={{ width: `${salary > 0 ? (s.amt / salary) * 100 : 0}%`, background: s.color }} />))}
            </div>
            <div className="num flex" style={{ flexWrap: "wrap", gap: "4px 12px", fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 9 }}>
              {segments.map((s) => (
                <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color }} />{s.label} {won(s.amt)} ({salary > 0 ? Math.round((s.amt / salary) * 100) : 0}%)
                </span>
              ))}
            </div>
          </div>
          )}
          </>)}
        </div>

        {/* 월급 기록 + 급여통장 */}
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, padding: "16px 18px", marginBottom: 14 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div className="flex items-center" style={{ gap: 7 }}>
              <CalendarDays size={16} color={C.sub} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>월급날</span>
              {editPayday ? (
                <span className="flex items-center gap-1">
                  <input value={paydayDraft} onChange={(e) => setPaydayDraft(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className="num" style={{ width: 46, fontSize: 14, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 8, padding: "3px 6px", background: C.soft }} />
                  <span style={{ fontSize: 13 }}>일</span>
                  <button onClick={savePayday} className="tap" style={miniBtn(C.hero, "#fff")}><Check size={13} /></button>
                </span>
              ) : (
                <button onClick={() => { setPaydayDraft(String(payday)); setEditPayday(true); }} className="tap num" style={{ fontSize: 13, fontWeight: 700, color: C.hero, background: C.soft, border: "none", borderRadius: 8, padding: "3px 9px" }}>
                  매월 {payday}일 <Pencil size={11} style={{ display: "inline", marginLeft: 2 }} />
                </button>
              )}
            </div>
            <div className="flex items-center" style={{ gap: 7 }}>
              <Building2 size={16} color={C.sub} />
              <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>급여통장</span>
              <div style={{ width: 130 }}>
                <BankSelect value={payAccount} onChange={setPayAccount} placeholder="급여통장" />
              </div>
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: 8 }}>
            <input value={recAmt} onChange={(e) => setRecAmt(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="받은 월급" className="num" style={{ width: "100%", fontSize: 14, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 12px", background: C.soft }} />
            <button onClick={addRecord} className="tap flex items-center justify-center gap-1" style={{ width: "100%", background: C.hero, color: "#fff", border: "none", borderRadius: 11, padding: "12px 0", fontWeight: 700, fontSize: 14 }}><Plus size={16} /> 기록</button>
          </div>

          {records.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setShowRecords((s) => !s)} className="tap flex items-center justify-between" style={{ width: "100%", background: C.soft, border: "none", borderRadius: 11, padding: "10px 12px", cursor: "pointer" }}>
                <span className="flex items-center" style={{ gap: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub }}>월급 기록 {records.length}건</span>
                  <span className="num" style={{ fontSize: 12, color: C.sub }}>· 최근 {won(records[0].amount)}원</span>
                </span>
                <ChevronDown size={16} color={C.sub} className="chev" style={{ transform: showRecords ? "rotate(180deg)" : "none" }} />
              </button>
              {showRecords && (
                <div className="flex flex-col" style={{ gap: 2, marginTop: 6 }}>
                  {records.map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between" style={{ padding: "9px 4px", borderTop: `1px solid ${C.soft}` }}>
                      <div className="flex items-center" style={{ gap: 9 }}>
                        <span className="num" style={{ fontSize: 13, color: C.sub }}>{r.ym.replace("-", "/")} · {r.day}일</span>
                        {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, color: C.hero, background: C.soft, padding: "2px 6px", borderRadius: 6 }}>최근</span>}
                      </div>
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <span className="num" style={{ fontSize: 14, fontWeight: 700 }}>{won(r.amount)}원</span>
                        <button onClick={() => delRecord(r.id)} className="tap" style={{ background: "none", border: "none", color: C.sub, padding: 2 }}><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 탭 바 */}
        <div className="flex" style={{ gap: 4, background: C.soft, borderRadius: 13, padding: 4, marginBottom: 14 }}>
          {[["bank", "은행별 넣을 금액"], ["cats", "통장별 배분"], ["chart", "월별 누적 저축"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className="tap"
              style={{ flex: 1, fontSize: 12.5, fontWeight: 700, padding: "9px 4px", borderRadius: 10, border: "none", cursor: "pointer",
                background: tab === k ? C.card : "transparent", color: tab === k ? C.hero : C.sub,
                boxShadow: tab === k ? "0 2px 8px -3px rgba(0,0,0,0.15)" : "none" }}>
              {label}
            </button>
          ))}
        </div>

        {/* 통장별 배분 */}
        {tab === "cats" && (<>
        <div className="flex flex-col" style={{ gap: 10 }}>
          {cats.map((c) => {
            const Icon = iconOf(c);
            const total = catTotals[c.id];
            const isOpen = open[c.id];
            return (
              <div key={c.id} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, overflow: "hidden" }}>
                <button onClick={() => toggle(c.id)} className="flex items-center justify-between" style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: c.color }} />
                  <div className="flex items-center" style={{ gap: 11 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: c.color + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={19} color={c.color} /></div>
                    <div style={{ textAlign: "left" }}>
                      <div className="flex items-center gap-1.5" style={{ fontWeight: 700, fontSize: 15 }}>
                        {c.name}
                        <span style={{ fontSize: 10, fontWeight: 700, color: KIND_COLOR[c.kind], background: KIND_COLOR[c.kind] + "1A", padding: "2px 6px", borderRadius: 6 }}>{tagOf(c)}</span>
                      </div>
                      <div className="num" style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>{c.items.length}개 항목{c.day ? ` · 매월 ${c.day}일` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span className="num" style={{ fontWeight: 900, fontSize: 15 }}>{won(total)}<span style={{ fontSize: 11, fontWeight: 700, color: C.sub }}> 원</span></span>
                    <ChevronDown size={17} color={C.sub} className="chev" style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
                  </div>
                </button>

                {isOpen && (
                  <div style={{ borderTop: `1px solid ${C.soft}`, padding: "6px 16px 12px" }}>
                    {c.items.map((it, idx) => {
                      const editing = edit === `${c.id}:${idx}`;
                      if (editing) {
                        return (
                          <div key={idx} style={{ margin: "8px 0", background: C.soft, borderRadius: 12, padding: "12px" }}>
                            <div className="flex" style={{ gap: 6, marginBottom: 6 }}>
                              <input value={editDraft.n} onChange={(e) => setEditDraft((v) => ({ ...v, n: e.target.value }))} placeholder="항목 이름" autoFocus style={{ flex: 1.3, fontSize: 13, fontWeight: 500, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", background: "#fff" }} />
                              <BankSelect value={editDraft.acc} onChange={(val) => setEditDraft((v) => ({ ...v, acc: val }))} placeholder="어느 은행" />
                            </div>
                            <div className="flex" style={{ gap: 6 }}>
                              <input value={editDraft.a} onChange={(e) => setEditDraft((v) => ({ ...v, a: e.target.value.replace(/[^0-9]/g, "") }))} inputMode="numeric" placeholder="금액" className="num" style={{ flex: 1, fontSize: 13, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", background: "#fff" }} />
                              <button onClick={() => saveEdit(c.id, idx)} className="tap flex items-center gap-1" style={{ background: c.color, color: "#fff", border: "none", borderRadius: 9, padding: "0 14px", fontWeight: 700, fontSize: 13 }}><Check size={14} /> 저장</button>
                              <button onClick={() => setEdit(null)} className="tap" style={miniBtn(C.line, C.sub)}><X size={14} /></button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="flex items-center justify-between" style={{ padding: "9px 0", borderBottom: idx < c.items.length - 1 ? `1px solid ${C.soft}` : "none" }}>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.n}</div>
                            <div className="flex items-center" style={{ gap: 4, fontSize: 11, color: C.sub, marginTop: 2 }}>
                              <Building2 size={11} /><span>{it.acc}{it.day ? ` · ${it.day}일` : ""}</span>
                            </div>
                          </div>
                          <div className="flex items-center" style={{ gap: 4 }}>
                            <button onClick={() => startEdit(c.id, idx, it)} className="tap num flex items-center" style={{ gap: 5, background: "none", border: "none", cursor: "pointer" }}>
                              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{won(it.a)}원</span><Pencil size={12} color={C.sub} />
                            </button>
                            <button onClick={() => delItem(c.id, idx)} className="tap" style={{ background: "none", border: "none", color: "#C7CDCB", padding: 3, cursor: "pointer", display: "flex" }} title="삭제"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}

                    {addingTo === c.id ? (
                      <div style={{ marginTop: 10, background: C.soft, borderRadius: 12, padding: "12px" }}>
                        <div className="flex" style={{ gap: 6, marginBottom: 6 }}>
                          <input value={newItem.n} onChange={(e) => setNewItem((v) => ({ ...v, n: e.target.value }))} placeholder="항목 이름" autoFocus style={{ flex: 1.3, fontSize: 13, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", background: "#fff" }} />
                          <BankSelect value={newItem.acc} onChange={(val) => setNewItem((v) => ({ ...v, acc: val }))} placeholder="어느 은행" />
                        </div>
                        <div className="flex" style={{ gap: 6 }}>
                          <input value={newItem.a} onChange={(e) => setNewItem((v) => ({ ...v, a: e.target.value.replace(/[^0-9]/g, "") }))} inputMode="numeric" placeholder="금액" className="num" style={{ flex: 1, fontSize: 13, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", background: "#fff" }} />
                          <button onClick={() => confirmAdd(c.id)} className="tap flex items-center gap-1" style={{ background: c.color, color: "#fff", border: "none", borderRadius: 9, padding: "0 14px", fontWeight: 700, fontSize: 13 }}><Check size={14} /> 추가</button>
                          <button onClick={() => setAddingTo(null)} className="tap" style={miniBtn(C.line, C.sub)}><X size={14} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
                        <button onClick={() => startAdd(c.id)} className="tap flex items-center justify-center gap-1.5" style={{ flex: 1, background: "none", border: `1.5px dashed ${C.line}`, borderRadius: 11, padding: "10px 0", color: c.color, fontWeight: 700, fontSize: 13, cursor: "pointer" }}><Plus size={15} /> 항목 추가</button>
                        <button onClick={() => delCategory(c.id)} className="tap flex items-center gap-1" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px", color: C.sub, fontWeight: 500, fontSize: 12.5, cursor: "pointer" }}><Trash2 size={13} /> 카테고리 삭제</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 카테고리 추가 */}
          {showAddCat ? (
            <div style={{ background: C.card, borderRadius: 16, border: `1.5px dashed ${C.line}`, padding: "14px 16px" }}>
              <input value={newCat.name} onChange={(e) => setNewCat((v) => ({ ...v, name: e.target.value }))} placeholder="카테고리 이름 (예: 비상금, 투자)" autoFocus style={{ width: "100%", fontSize: 14, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 11px", background: C.soft, marginBottom: 8 }} />
              <div className="flex" style={{ gap: 6, marginBottom: 10 }}>
                {[["save", "모으는 돈"], ["out", "나가는 돈"]].map(([k, label]) => (
                  <button key={k} onClick={() => setNewCat((v) => ({ ...v, kind: k }))} className="tap" style={{ flex: 1, fontSize: 13, fontWeight: 700, padding: "9px 0", borderRadius: 10, border: `1px solid ${newCat.kind === k ? KIND_COLOR[k] : C.line}`, background: newCat.kind === k ? KIND_COLOR[k] + "12" : "#fff", color: newCat.kind === k ? KIND_COLOR[k] : C.sub }}>{label}</button>
                ))}
              </div>
              <div className="flex" style={{ gap: 6 }}>
                <button onClick={addCategory} className="tap flex items-center justify-center gap-1" style={{ flex: 1, background: C.hero, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 13.5 }}><Check size={15} /> 카테고리 추가</button>
                <button onClick={() => setShowAddCat(false)} className="tap" style={miniBtn(C.line, C.sub, 40)}><X size={16} /></button>
              </div>
              <div style={{ fontSize: 11.5, color: C.sub, marginTop: 8 }}>모으는 돈은 저축 그래프에, 나가는 돈은 생활비 차감에 반영돼요</div>
            </div>
          ) : (
            <button onClick={() => setShowAddCat(true)} className="tap flex items-center justify-center gap-1.5" style={{ width: "100%", background: "none", border: `1.5px dashed ${C.line}`, borderRadius: 16, padding: "14px 0", color: C.hero, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}><Plus size={16} /> 카테고리 추가</button>
          )}
        </div>
        </>)}

        {/* 은행별 넣을 금액 */}
        {tab === "bank" && (
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, padding: "18px 16px 14px" }}>
          <div className="flex items-center" style={{ gap: 7, marginBottom: 4 }}>
            <Building2 size={16} color={C.hero} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>은행별 넣을 금액</span>
          </div>
          <div className="flex items-center" style={{ gap: 6, fontSize: 11.5, color: C.sub, marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: C.hero }}>{payAccount || "급여통장"}</span><ArrowRight size={12} /> 아래 통장으로 매달 이체
          </div>
          <div className="flex flex-col" style={{ gap: 2 }}>
            {bankRows.map((b) => (
              <div key={b.acc} className="flex items-center justify-between" style={{ padding: "10px 4px", borderTop: `1px solid ${C.soft}` }}>
                <div className="flex items-center" style={{ gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: C.hero }}>{b.acc.slice(0, 1)}</div>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{b.acc}</span>
                </div>
                <span className="num" style={{ fontSize: 14, fontWeight: 700 }}>{won(b.amount)}원</span>
              </div>
            ))}
            <div className="flex items-center justify-between num" style={{ padding: "11px 4px 2px", borderTop: `1.5px solid ${C.line}`, marginTop: 4 }}>
              <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 700 }}>이체 합계</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: C.hero }}>{won(saveSum + outSum)}원</span>
            </div>
          </div>
        </div>
        )}

        {/* 월별 누적 저축 */}
        {tab === "chart" && (
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, padding: "18px 16px 12px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <div className="flex items-center" style={{ gap: 7 }}><TrendingUp size={16} color={C.hero} /><span style={{ fontSize: 14, fontWeight: 700 }}>월별 누적 저축</span></div>
            <span className="num" style={{ fontSize: 12, color: C.sub }}>매월 +{won(saveSum)}원</span>
          </div>
          <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 10 }}>'모으는 돈' 카테고리가 매달 쌓이는 추이예요</div>
          <div style={{ width: "100%", height: 190 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 6, right: 8, left: 6, bottom: 0 }}>
                <CartesianGrid stroke={C.soft} vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 10, fill: C.sub }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(v / 10000)}만`} tick={{ fontSize: 10, fill: C.sub }} width={44} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${won(v)}원`, "누적 저축"]} labelFormatter={(l) => `20${l}`} contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }} />
                <Line type="monotone" dataKey="saved" stroke={C.hero} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: C.hero }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: 8, background: C.soft, borderRadius: 10, padding: "9px 12px" }}>
            <span style={{ fontSize: 12.5, color: C.sub }}>현재 모은 돈(시작값)</span>
            <div className="flex items-center" style={{ gap: 6 }}>
              <input value={startSaved} onChange={(e) => setStartSaved(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)} inputMode="numeric" className="num" style={{ width: 116, fontSize: 13, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 8px", background: "#fff", textAlign: "right" }} />
              <span style={{ fontSize: 12.5, color: C.sub }}>원</span>
            </div>
          </div>
          <div className="num flex justify-between" style={{ fontSize: 12, marginTop: 10, padding: "0 2px" }}>
            <span style={{ color: C.sub }}>1년 뒤</span><span style={{ fontWeight: 700 }}>{won(startSaved + saveSum * 12)}원</span>
          </div>
        </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: C.sub, marginTop: 22 }}>프로토타입 · 항목·카테고리를 자유롭게 추가/삭제할 수 있어요</div>
        </>)}

        {page === "ledger" && (<>
        {/* 가계부 헤더 */}
        <div className="flex items-center" style={{ gap: 10, marginBottom: 16 }}>
          <button onClick={() => setPage("home")} className="tap" style={{ width: 38, height: 38, borderRadius: 12, background: C.card, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={18} color={C.ink} />
          </button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>가계부</div>
          </div>
        </div>

        {/* 가계부 히어로 */}
        <div style={{ background: `linear-gradient(165deg, #26262A, ${C.heroDeep})`, borderRadius: 28, padding: "24px 24px 22px", color: "#FFFFFF", boxShadow: "0 20px 44px -20px rgba(0,0,0,0.45)", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>이번 달 남은 생활비</div>
          <div className="num" style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
            <span className="hero-amt" style={{ fontWeight: 900, color: ledgerLeft >= 0 ? C.accent : "#FF8A8A", lineHeight: 1 }}>{won(ledgerLeft)}</span>
            <span style={{ fontSize: 19, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>원</span>
          </div>
          <div className="num flex" style={{ gap: 10, marginTop: 18 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>이번 달 예산</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{won(life)}원</div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>쓴 돈</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: "#FF9A9A" }}>{won(ledgerExpense)}원</div>
            </div>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>들어온 돈</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: "#9BE8B4" }}>{won(ledgerIncome)}원</div>
            </div>
          </div>
        </div>

        {/* 입력 폼 */}
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, padding: "16px 18px", marginBottom: 14 }}>
          <div className="flex" style={{ gap: 6, marginBottom: 10 }}>
            {[["expense", "지출", "#FF524D"], ["income", "수입", "#31B54C"]].map(([t, label, col]) => (
              <button key={t} onClick={() => setLedgerForm((f) => ({ ...f, type: t }))} className="tap"
                style={{ flex: 1, fontSize: 13.5, fontWeight: 700, padding: "10px 0", borderRadius: 11, cursor: "pointer",
                  border: `1px solid ${ledgerForm.type === t ? col : C.line}`,
                  background: ledgerForm.type === t ? col + "14" : "#fff", color: ledgerForm.type === t ? col : C.sub }}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex" style={{ gap: 8, marginBottom: 8 }}>
            <input type="date" value={ledgerForm.date} onChange={(e) => setLedgerForm((f) => ({ ...f, date: e.target.value }))}
              className="num" style={{ flex: 1, fontSize: 13, fontWeight: 600, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 11px", background: C.soft, color: C.ink }} />
          </div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            <input value={ledgerForm.memo} onChange={(e) => setLedgerForm((f) => ({ ...f, memo: e.target.value }))} placeholder="어디에 썼나요?"
              style={{ width: "100%", fontSize: 14, border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 12px", background: C.soft }} />
            <input value={ledgerForm.amount} onChange={(e) => setLedgerForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, "") }))} inputMode="numeric" placeholder="금액" className="num"
              style={{ width: "100%", fontSize: 14, fontWeight: 700, border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 12px", background: C.soft }} />
            <button onClick={addLedger} className="tap flex items-center justify-center" style={{ width: "100%", gap: 6, background: C.hero, color: "#fff", border: "none", borderRadius: 11, padding: "12px 0", fontWeight: 700, fontSize: 14 }}><Plus size={17} /> 추가</button>
          </div>
        </div>

        {/* 내역 리스트 */}
        <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, padding: "16px 18px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>이번 달 내역</span>
            <span className="num" style={{ fontSize: 12, color: C.sub }}>{ledger.length}건</span>
          </div>
          {ledger.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: C.sub, fontSize: 13 }}>
              <NotebookPen size={26} color={C.line} style={{ marginBottom: 8 }} />
              <div>아직 기록이 없어요.<br />위에서 지출·수입을 적어보세요.</div>
            </div>
          ) : (
            <div className="flex flex-col">
              {ledger.map((e, i) => {
                const isExp = e.type === "expense";
                const col = isExp ? "#FF524D" : "#31B54C";
                return (
                  <div key={e.id} className="flex items-center justify-between" style={{ padding: "11px 0", borderTop: i > 0 ? `1px solid ${C.soft}` : "none" }}>
                    <div className="flex items-center" style={{ gap: 11 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: col + "14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: col }}>
                        {isExp ? "−" : "+"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{e.memo}</div>
                        <div className="num" style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>{fmtDate(e.date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <span className="num" style={{ fontSize: 14.5, fontWeight: 700, color: col }}>{isExp ? "-" : "+"}{won(e.amount)}</span>
                      <button onClick={() => delLedger(e.id)} className="tap" style={{ background: "none", border: "none", color: "#C7CDCB", padding: 3, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </>)}
      </div>

      {/* 하단 네비게이션 */}
      <div className="bottom-nav" style={{ display: "flex", gap: 6, background: C.hero, borderRadius: 999, padding: 6, boxShadow: "0 12px 30px -8px rgba(0,0,0,0.4)" }}>
        {[["home", "홈", Home], ["ledger", "가계부", NotebookPen]].map(([p, label, Icon]) => {
          const active = page === p;
          return (
            <button key={p} onClick={() => setPage(p)} className="tap flex items-center" style={{
              gap: 7, padding: active ? "11px 20px" : "11px 16px", borderRadius: 999, border: "none", cursor: "pointer",
              background: active ? "#FFFFFF" : "transparent", color: active ? C.ink : "rgba(255,255,255,0.6)",
              fontWeight: 700, fontSize: 13.5 }}>
              <Icon size={18} /> {active && label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BankSelect({ value, onChange, flex = 1, placeholder = "은행 선택" }) {
  const opts = value && !BANKS.includes(value) ? [value, ...BANKS] : BANKS;
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)}
      style={{ flex, width: "100%", fontSize: 13, fontWeight: value ? 600 : 400, color: value ? C.ink : C.sub,
        border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", background: "#fff",
        appearance: "none", WebkitAppearance: "none", cursor: "pointer",
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236E7C77' stroke-width='2.5'><polyline points='6 9 12 15 18 9'/></svg>\")",
        backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center", paddingRight: 26 }}>
      <option value="" disabled>{placeholder}</option>
      {opts.map((b) => <option key={b} value={b}>{b}</option>)}
    </select>
  );
}

function miniBtn(bg, color, size = 28) {
  return { width: size, height: size, minWidth: size, borderRadius: 8, background: bg, color, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
}
