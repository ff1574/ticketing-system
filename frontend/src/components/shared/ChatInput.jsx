import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ChatInput({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !attachment) || disabled) return;

    try {
      if (attachment && !attachment.url) {
        setIsUploading(true);
        // Mock file upload - in a real app, you'd upload to your server/cloud storage
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Mock response with URL
        attachment.url = URL.createObjectURL(attachment.file);
        setIsUploading(false);
      }

      await onSendMessage(message.trim(), attachment);
      setMessage("");
      setAttachment(null);
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachment({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t p-4">
      {attachment && (
        <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm truncate">
            <Paperclip className="h-4 w-4" />
            <span className="truncate max-w-[200px]">{attachment.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={removeAttachment}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Attach file</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </Button>

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
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={handleSendMessage}
            disabled={
              disabled || isUploading || (!message.trim() && !attachment)
            }
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
