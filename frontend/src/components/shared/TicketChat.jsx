import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export function TicketChat({
  ticketId,
  currentUser,
  initialMessages = [],
  onSendMessage,
  isLoading = false,
  disabled = false,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (bottomRef.current && !loadingMore) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, loadingMore]);

  // Update the handleSendMessage function to match the database structure
  const handleSendMessage = async (content, attachment) => {
    if (!content.trim() && !attachment) return;

    // Create a temporary message with a local ID
    const tempMessage = {
      message_id: `temp-${Date.now()}`,
      message_content: content,
      sent_at: new Date().toISOString(),
      sender_type:
        currentUser.role === "admin" || currentUser.role === "agent"
          ? "administrator"
          : "customer",
      sender_id: currentUser.id,
      sender: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      status: "sending",
      attachment: attachment,
    };

    // Add the temporary message to the UI
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Call the provided onSendMessage function (which would typically make an API call)
      const sentMessage = await onSendMessage(content, attachment);

      // Replace the temporary message with the actual message from the server
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === tempMessage.message_id
            ? { ...sentMessage, status: "sent" }
            : msg
        )
      );
    } catch (error) {
      // Mark the message as failed if there was an error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === tempMessage.message_id
            ? { ...msg, status: "failed" }
            : msg
        )
      );
      console.error("Failed to send message:", error);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages) return;

    setLoadingMore(true);
    try {
      // Mock API call to load more messages
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you'd fetch older messages from your API
      const olderMessages = []; // This would be the response from your API

      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages((prev) => [...olderMessages, ...prev]);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-4"
        viewportClassName="h-full"
      >
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="text-xs"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isCurrentUser = message.sender.id === currentUser.id;
            const showAvatar =
              index === 0 ||
              messages[index - 1].sender.id !== message.sender.id;

            return (
              <ChatMessage
                key={message.message_id}
                message={message}
                isCurrentUser={isCurrentUser}
                showAvatar={showAvatar}
              />
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center my-4"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </ScrollArea>

      <ChatInput onSendMessage={handleSendMessage} disabled={disabled} />
    </div>
  );
}

// Update the PropTypes to match the database structure
TicketChat.propTypes = {
  ticketId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  initialMessages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      message_content: PropTypes.string.isRequired,
      sent_at: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date),
      ]).isRequired,
      sender_type: PropTypes.oneOf(["customer", "administrator"]).isRequired,
      sender_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      sender: PropTypes.shape({
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
      }),
      attachment: PropTypes.shape({
        url: PropTypes.string.isRequired,
        name: PropTypes.string,
      }),
    })
  ),
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default TicketChat;
