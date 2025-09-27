"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Sidebar from "./Sidebar";
import BlockNode from "./nodes/BlockNode";
import Inspector from "./Inspector";
import { generatePython } from "@/lib/codegen/python";
import { useProjectStore } from "@/store/project";
import { writeTextFile, ensurePermission } from "@/lib/fs-access";

type BlockKind = "input" | "prompt" | "llm" | "tool" | "output";
type BlockData = { kind: BlockKind; label: string; config: Record<string, unknown> };
type BlockRFNode = Node<BlockData, "block">;

const STORAGE_KEY = "langblock-flow-v1";

const initialNodes: BlockRFNode[] = [
  { id: "n_input",  type: "block", position: { x: 120, y: 160 }, data: { kind: "input",  label: "Input",  config: { var: "input" } } },
  { id: "n_prompt", type: "block", position: { x: 420, y: 160 }, data: { kind: "prompt", label: "Prompt", config: { template: "You are helpful.\nAnswer: {input}" } } },
  { id: "n_llm",    type: "block", position: { x: 720, y: 160 }, data: { kind: "llm",    label: "ChatOpenAI", config: { model: "gpt-4o-mini", temperature: 0.2 } } },
  { id: "n_out",    type: "block", position: { x: 1020, y: 160 }, data: { kind: "output", label: "Output", config: {} } },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "n_input",  target: "n_prompt" },
  { id: "e2", source: "n_prompt", target: "n_llm" },
  { id: "e3", source: "n_llm",    target: "n_out" },
];

export default function FlowEditor() {
  const nodeTypes = useMemo(() => ({ block: BlockNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<BlockRFNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const projectDir = useProjectStore((s) => s.dir);

  // load persisted
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const { nodes, edges } = JSON.parse(raw);
      setNodes(nodes);
      setEdges(edges);
    } catch {}
  }, [setNodes, setEdges]);

  // persist
  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    }, 250);
    return () => clearTimeout(id);
  }, [nodes, edges]);

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge(c, eds)), [setEdges]);
  const onNodeClick = useCallback((_: React.MouseEvent, n: BlockRFNode) => setSelectedId(n.id), []);

  const addBlock = useCallback((kind: BlockKind) => {
    const id = `${kind}-${crypto.randomUUID().slice(0, 6)}`;
    const defaults: Record<BlockKind, Record<string, unknown>> = {
      input:  { var: "input" },
      prompt: { template: "Answer: {input}" },
      llm:    { model: "gpt-4o-mini", temperature: 0 },
      tool:   { name: "search", args: "{}" },
      output: {}
    };
    const newNode: BlockRFNode = {
      id,
      type: "block",
      position: { x: 240 + Math.random() * 600, y: 100 + Math.random() * 320 },
      data: { kind, label: kind.toUpperCase(), config: defaults[kind] },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const makeCode = useCallback(async () => {
    const py = generatePython(nodes, edges);
    setCode(py);

    // If we have a picked project directory, overwrite my_agent/agent.py
    if (projectDir) {
      try {
        const ok = await ensurePermission(projectDir, "readwrite");
        if (ok) {
          await writeTextFile(projectDir, "my_agent/agent.py", py);
          // Optional: provide quick UX feedback
          console.log("Saved to my_agent/agent.py");
          return;
        }
      } catch (e) {
        console.warn("Failed to save to project directory, falling back to download.", e);
      }
    }

    // Fallback: download as agent.py
    const blob = new Blob([py], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent.py";
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, projectDir]);

  return (
    <div className="flex h-dvh">
      <aside className="w-72 border-r bg-muted/30 p-3">
        <Sidebar onAdd={addBlock} onSave={makeCode} code={code} />
        <div className="mt-3 text-xs text-muted-foreground">Tip: click a node to edit it.</div>
      </aside>

      <div className="flex-1">
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>

      <Inspector
        nodes={nodes}
        setNodes={setNodes}
        selectedId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
