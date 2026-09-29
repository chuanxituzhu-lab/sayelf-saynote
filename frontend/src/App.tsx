import { FormEvent, useEffect, useMemo, useState } from "react";
import { createTextRecord, listToday, SayRecord } from "./api";

const navigation = ["今天", "记录", "发现", "我的"] as const;

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function App() {
  const [records, setRecords] = useState<SayRecord[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    void refreshToday();
  }, []);

  async function refreshToday() {
    try {
      setLoading(true);
      setError(null);
      setRecords(await listToday());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "暂时无法读取今天的记录");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || saving) return;

    try {
      setSaving(true);
      setError(null);
      const created = await createTextRecord(content);
      setRecords((current) => [created, ...current]);
      setDraft("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "暂时无法保存这条记录");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">SAYNOTE</p>
          <h1>今天</h1>
        </div>
        <div className="date-chip">{todayLabel}</div>
      </header>

      <main>
        <section className="capture-card" aria-labelledby="capture-title">
          <div className="capture-heading">
            <span className="capture-dot" aria-hidden="true" />
            <div>
              <p className="eyebrow">QUICK CAPTURE</p>
              <h2 id="capture-title">记一下</h2>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="record-content">
              记录内容
            </label>
            <textarea
              id="record-content"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="此刻有什么想留下？"
              rows={4}
              maxLength={10000}
            />
            <div className="capture-actions">
              <span className="capture-hint">原始事实会保留在本地</span>
              <button type="submit" disabled={!draft.trim() || saving}>
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </form>
        </section>

        <section className="timeline" aria-labelledby="timeline-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TIMELINE</p>
              <h2 id="timeline-title">今天的记录</h2>
            </div>
            <span className="record-count">{records.length}</span>
          </div>

          {error && <p className="status-message error">{error}</p>}
          {loading && <p className="status-message">正在读取本地记录…</p>}
          {!loading && !error && records.length === 0 && (
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">✦</span>
              <p>今天还没有记录。</p>
              <span>写下第一句，留住此刻。</span>
            </div>
          )}
          {!loading && records.length > 0 && (
            <ul className="record-list">
              {records.map((record) => (
                <li key={record.id} className="record-item">
                  <time dateTime={record.occurred_at}>{formatTime(record.occurred_at)}</time>
                  <div className="record-body">
                    <span className="record-kind">原始记录 · {record.kind}</span>
                    <p>{record.raw_fact.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <nav className="bottom-nav" aria-label="主导航">
        {navigation.map((item) => (
          <button key={item} className={item === "今天" ? "active" : ""} disabled={item !== "今天"}>
            <span className="nav-icon" aria-hidden="true">{item === "今天" ? "●" : "○"}</span>
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
