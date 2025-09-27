export type DirHandle = FileSystemDirectoryHandle;

export async function getDir(handle: DirHandle, name: string): Promise<DirHandle> {
  return await handle.getDirectoryHandle(name, { create: true });
}

export async function ensureDir(handle: DirHandle, path: string) {
  const parts = path.split("/").filter(Boolean);
  let cur = handle;
  for (const p of parts) cur = await getDir(cur, p);
  return cur;
}

export async function writeTextFile(dir: DirHandle, path: string, content: string) {
  const parentPath = path.split("/").slice(0, -1).join("/");
  const fileName = path.split("/").pop()!;
  const parent = parentPath ? await ensureDir(dir, parentPath) : dir;
  const fileHandle = await parent.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function entryExists(dir: DirHandle, path: string) {
  try {
    const parts = path.split("/").filter(Boolean);
    let cur: DirHandle = dir;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        try {
          await cur.getFileHandle(part, { create: false });
          return true;
        } catch {
          try {
            await cur.getDirectoryHandle(part, { create: false });
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

export async function ensurePermission(handle: any, mode: "read" | "readwrite" = "readwrite") {
  try {
    const opts = { mode } as const;
    if (await handle.queryPermission?.(opts) === "granted") return true;
    return (await handle.requestPermission?.(opts)) === "granted";
  } catch {
    // if the environment doesn't support permission queries, assume allowed after picker
    return true;
  }
}

