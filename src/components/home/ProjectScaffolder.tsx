"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildTemplates } from "@/lib/fs-templates";
import { useProjectStore } from "@/store/project";

type DirHandle = FileSystemDirectoryHandle;

async function getDir(handle: DirHandle, name: string): Promise<DirHandle> {
  return await handle.getDirectoryHandle(name, { create: true });
}
async function ensureDir(handle: DirHandle, path: string) {
  const parts = path.split("/").filter(Boolean);
  let cur = handle;
  for (const p of parts) cur = await getDir(cur, p);
  return cur;
}
async function writeTextFile(dir: DirHandle, path: string, content: string) {
  const parentPath = path.split("/").slice(0, -1).join("/");
  const fileName = path.split("/").pop()!;
  const parent = parentPath ? await ensureDir(dir, parentPath) : dir;
  const fileHandle = await parent.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function entryExists(dir: DirHandle, path: string) {
  try {
    const parts = path.split("/").filter(Boolean);
    let cur: DirHandle = dir;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // last part could be file or directory
        try {
          await cur.getFileHandle(part, { create: false });
          return true;
        } catch {
          try {
            cur = await cur.getDirectoryHandle(part, { create: false });
            return true;
          } catch {
            return false;
          }
        }
      } else {
        cur = await cur.getDirectoryHandle(part, { create: false });
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function isLanggraphProject(root: DirHandle) {
  const mustHave = [
    "my_agent",
    "my_agent/utils",
    "my_agent/utils/__init__.py",
    "my_agent/utils/tools.py",
    "my_agent/utils/nodes.py",
    "my_agent/utils/state.py",
    "my_agent/__init__.py",
    "my_agent/agent.py",
    ".env",
    "requirements.txt",
    "langgraph.json",
  ];
  for (const p of mustHave) {
    const ok = await entryExists(root, p);
    if (!ok) return false;
  }
  return true;
}

export default function ProjectScaffolder() {
  const [msg, setMsg] = useState<string>("");
  const setDir = useProjectStore((s) => s.setDir);
  const router = useRouter();

  async function pickDirectory() {
    if (!("showDirectoryPicker" in window)) {
      setMsg("Your browser doesn’t support directory access. Use Chrome/Edge, or run with a backend.");
      return;
    }

    try {
      // 1) ask user for a folder
      type Picker = { showDirectoryPicker: (opts: { mode: "read" | "readwrite" }) => Promise<DirHandle> };
      const dir = await (window as unknown as Picker).showDirectoryPicker({ mode: "readwrite" });
      setDir(dir);

      // 2) check if already a LangGraph project
      if (await isLanggraphProject(dir)) {
        setMsg("Opened existing LangGraph project ✔️");
        router.push("/flow");
        return;
      }

      // 3) scaffold new project
      const t = buildTemplates();

      // Folders
      await ensureDir(dir, "my_agent/utils");

      // Files
      await writeTextFile(dir, "my_agent/__init__.py", t.pkgInit);
      await writeTextFile(dir, "my_agent/agent.py", t.agentPy);
      await writeTextFile(dir, "my_agent/utils/__init__.py", t.utilsInit);
      await writeTextFile(dir, "my_agent/utils/tools.py", t.toolsPy);
      await writeTextFile(dir, "my_agent/utils/nodes.py", t.nodesPy);
      await writeTextFile(dir, "my_agent/utils/state.py", t.statePy);
      await writeTextFile(dir, "requirements.txt", t.requirementsTxt);
      await writeTextFile(dir, ".env", t.envFile);
      await writeTextFile(dir, "langgraph.json", t.configJson);

      setMsg("Created LangGraph project scaffold ✔️");
      setDir(dir);
      router.push("/flow");
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="place-items-center overflow-hidden">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6 space-y-4 text-center">
          <h1 className="text-2xl font-semibold">LangBlock</h1>
          <p className="text-sm text-muted-foreground">
            Pick a folder to create/open a LangGraph project.
          </p>
          <Button onClick={pickDirectory}>Create / Open Project</Button>
          <p className="text-xs text-muted-foreground min-h-5">{msg}</p>
          <p className="text-xs text-muted-foreground">
            Tip: after creation, open the folder in your editor and run:
            <br />
            <code>pip install -r requirements.txt</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
