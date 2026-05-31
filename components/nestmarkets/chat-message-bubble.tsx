import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/nestmarkets";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.isSender;
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
          mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
