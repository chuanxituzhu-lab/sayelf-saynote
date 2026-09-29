export type RecordKind = "text" | "voice" | "image" | "drawing" | "video" | "file";

export type SayRecord = {
  id: string;
  kind: RecordKind;
  occurred_at: string;
  captured_at: string;
  source: string;
  raw_fact: { text: string };
  interpretation: null | {
    status: string;
    labels: string[];
    summary: string | null;
  };
  created_at: string;
};

const API_ROOT = "/api/v1";

function localDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`请求失败（${response.status}）`);
  }
  return (await response.json()) as T;
}

export async function listToday(): Promise<SayRecord[]> {
  return parseResponse<SayRecord[]>(
    await fetch(`${API_ROOT}/records?date=${localDateString()}`),
  );
}

export async function createTextRecord(content: string): Promise<SayRecord> {
  return parseResponse<SayRecord>(
    await fetch(`${API_ROOT}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, kind: "text", source: "manual" }),
    }),
  );
}
