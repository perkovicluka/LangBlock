"use client";

import { create } from "zustand";

export type DirHandle = FileSystemDirectoryHandle | null;

type State = {
  dir: DirHandle;
  setDir: (dir: DirHandle) => void;
};

export const useProjectStore = create<State>((set) => ({
  dir: null,
  setDir: (dir) => set({ dir }),
}));

