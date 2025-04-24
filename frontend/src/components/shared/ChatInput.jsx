import { useState } from "react";
import PropTypes from "prop-types";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ChatInput({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (disabled || !message.trim()) {
      return;
    }

    try {
      await onSendMessage(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className={cn(
              "min-h-[80px] resize-none pr-12",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          />
          <Button
            type="button"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={handleSendMessage}
            disabled={disabled || !message.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default ChatInput;
