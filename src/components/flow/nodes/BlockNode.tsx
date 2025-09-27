"use client";
import { Card } from "@/components/ui/card";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

type BlockData = { kind: "input"|"prompt"|"llm"|"tool"|"output"; label: string; config: Record<string, unknown> };
type BlockRFNode = Node<BlockData, "block">;

export default function BlockNode({ data }: NodeProps<BlockRFNode>) {
  return (
    <Card className="px-3 py-2 border-2 shadow-sm min-w-44">
      <div className="text-sm font-medium">{data.label}</div>
      <div className="text-[10px] text-muted-foreground truncate max-w-64">
        {Object.keys(data.config || {}).length ? JSON.stringify(data.config) : "No config"}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </Card>
  );
}
