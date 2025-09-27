"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { type Node } from "@xyflow/react";

type BlockKind = "input" | "prompt" | "llm" | "tool" | "output";
type BlockData = { kind: BlockKind; label: string; config: Record<string, unknown> };
type BlockRFNode = Node<BlockData, "block">;

export default function Inspector({
  nodes, setNodes, selectedId, onClose
}: {
  nodes: BlockRFNode[];
  setNodes: React.Dispatch<React.SetStateAction<BlockRFNode[]>>;
  selectedId: string | null;
  onClose: () => void;
}) {
  const n = nodes.find(x => x.id === selectedId);
  const kind = n?.data?.kind;

  const setData = (patch: Partial<BlockData["config"]>) => {
    if (!n) return;
    setNodes((nds) =>
      nds.map((nn) =>
        nn.id === n.id
          ? { ...nn, data: { ...nn.data, config: { ...(nn.data?.config ?? {}), ...patch } } }
          : nn
      )
    );
  };

  return (
    <Sheet open={!!n} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="sm:w-[380px]">
        <SheetHeader>
          <SheetTitle>Inspector</SheetTitle>
        </SheetHeader>

        {!n ? null : (
          <div className="mt-4 space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                value={n.data.label ?? ""}
                onChange={(e) =>
                  setNodes((nds) => nds.map(nn => nn.id === n.id ? { ...nn, data: { ...nn.data, label: e.target.value } } : nn))
                }
              />
            </div>

            {kind === "input" && (
              <div>
                <Label>Variable Name</Label>
                <Input
                  value={String(n.data.config?.var ?? "input")}
                  onChange={(e) => setData({ var: e.target.value })}
                />
              </div>
            )}

            {kind === "prompt" && (
              <div>
                <Label>Template</Label>
                <Textarea
                  rows={6}
                  value={String(n.data.config?.template ?? "")}
                  onChange={(e) => setData({ template: e.target.value })}
                />
              </div>
            )}

            {kind === "llm" && (
              <>
                <div>
                  <Label>Model</Label>
                  <Input
                    value={String(n.data.config?.model ?? "gpt-4o-mini")}
                    onChange={(e) => setData({ model: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="block mb-2">Temperature: {Number(n.data.config?.temperature ?? 0)}</Label>
                  <Slider
                    defaultValue={[Number(n.data.config?.temperature ?? 0)]}
                    min={0} max={1} step={0.1}
                    onValueChange={([v]) => setData({ temperature: v })}
                  />
                </div>
              </>
            )}

            {kind === "tool" && (
              <>
                <div>
                  <Label>Tool Name</Label>
                  <Input
                    value={String(n.data.config?.name ?? "search")}
                    onChange={(e) => setData({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Args (JSON)</Label>
                  <Textarea
                    rows={4}
                    value={String(n.data.config?.args ?? "{}")}
                    onChange={(e) => setData({ args: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
