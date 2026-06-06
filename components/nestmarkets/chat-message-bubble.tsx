import { Check, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/nestmarkets";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.isSender;
  // Status (own messages only): optimistic temp id = sending; isRead = seen; else sent.
  const sending = message.id.startsWith("tmp-");
  const seen = !sending && message.isRead;

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
          mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          <span>{timeLabel(message.createdAt)}</span>
          {mine && (
            sending ? (
              <Loader2 className="size-3 animate-spin" aria-label="Sending" />
            ) : seen ? (
              // Seen: full-opacity double tick (stands out vs the dimmed 'sent' tick on the gold bubble)
              <CheckCheck className="size-3.5 text-primary-foreground" aria-label="Seen" />
            ) : (
              <Check className="size-3.5" aria-label="Sent" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
