"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Sidebar({
  onAdd, onSave, code
}: {
  onAdd: (k: "input" | "prompt" | "llm" | "tool" | "output") => void;
  onSave: () => void;
  code: string;
}) {
  const [saved, setSaved] = useState(false);
  
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="text-sm font-medium">Blocks</div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => onAdd("input")}>Input</Button>
            <Button variant="secondary" onClick={() => onAdd("prompt")}>Prompt</Button>
            <Button variant="secondary" onClick={() => onAdd("llm")}>LLM</Button>
            <Button variant="secondary" onClick={() => onAdd("tool")}>Tool</Button>
            <Button variant="secondary" onClick={() => onAdd("output")}>Output</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="text-sm font-medium">Export</div>
            <Button
              onClick={() => {
                onSave();
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
            >
              {saved ? "Saved!" : "Save as Python"}
            </Button>
          <div className="text-xs text-muted-foreground">
            Exports <code>agent.py</code> mapped from the current graph.
          </div>
        </CardContent>
      </Card>

      {code ? (
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Preview (read-only):</div>
            <pre className="mt-2 max-h-48 overflow-auto text-xs whitespace-pre-wrap">{code}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}