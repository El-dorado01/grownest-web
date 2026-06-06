"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatComposer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <div className="flex items-center gap-2 border-t border-border p-3">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Type a message..."
        disabled={disabled}
        className="rounded-full bg-card h-11 border-border"
      />
      <Button onClick={submit} disabled={disabled || !text.trim()} size="icon" className="rounded-full shrink-0">
        <Send className="size-4" />
      </Button>
    </div>
  );
}
