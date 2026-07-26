import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface SharedList {
  id: string;
  username: string;
  champion: string;
  nemesis?: string;
  topSongs: string[];
  comment: string;
  timestamp: string;
}

// Pre-seeded shared list database fallback to make the wall feel warm and alive immediately!
let memoryDb: SharedList[] = [
  {
    id: "seed_1",
    username: "嵩哥一生推",
    champion: "如果当时",
    nemesis: "有何不可",
    topSongs: ["如果当时", "庐州月", "灰色头像", "雅俗共赏", "山水之间"],
    comment: "红雨瓢泼洒在山谷，那年的夏天终究一去不返，但歌声永远回荡在有线耳机里。",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "seed_2",
    username: "格洛米的夏天",
    champion: "雅俗共赏",
    nemesis: "医生",
    topSongs: ["雅俗共赏", "幻听", "惊鸿一面", "多余的解释", "清明雨上"],
    comment: "俗的无畏，雅的轻狂。雅俗共赏不仅是一首歌，更是一种追求真实的人生哲学！",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
  },
];

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "shared-lists.json");

// Helper to load shared lists from disk or fallback to memory
async function loadSharedLists() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = await fs.promises.readFile(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Merge memory pre-seeds with disk data to prevent duplicates
        const merged = [...parsed];
        memoryDb.forEach((mem) => {
          if (!merged.some((d) => d.id === mem.id)) {
            merged.push(mem);
          }
        });
        return merged.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    }
  } catch (err) {
    console.warn(
      "[Vae Shared API] Failed to load data from disk, using memory storage fallback:",
      err
    );
  }
  return [...memoryDb].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Helper to save shared lists to disk, falling back to memory only
async function saveSharedLists(lists: SharedList[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(lists, null, 2), "utf-8");
    console.log("[Vae Shared API] Data successfully written to disk.");
  } catch (err) {
    console.warn("[Vae Shared API] Disk write failed. Operating in serverless memory mode:", err);
  }
}

export async function GET() {
  const data = await loadSharedLists();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, champion, nemesis, topSongs, comment } = body;

    if (!champion || !topSongs) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newItem = {
      id: "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      username: username?.trim() || "匿名的嵩迷",
      champion,
      nemesis: nemesis || "暂无",
      topSongs,
      comment: comment?.trim() || "“ 册封神作，绝代风华。回忆在有线耳机里慢慢流淌。 ”",
      timestamp: new Date().toISOString(),
    };

    // Load existing
    const currentList = await loadSharedLists();

    // Add new to start
    const updatedList = [newItem, ...currentList];

    // Persist
    await saveSharedLists(updatedList);

    // Also save in local memory cache to keep serverless warm state synced
    memoryDb = [newItem, ...memoryDb];

    return NextResponse.json({ success: true, item: newItem });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
