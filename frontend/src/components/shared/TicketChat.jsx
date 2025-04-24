import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import api from "@/utils/api";

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
  const [page, setPage] = useState(1);
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/ticket/${ticketId}/messages`);

        const formattedMessages = response.data.map((msg) => ({
          message_id: msg.messageId,
          message_content: msg.messageContent,
          sent_at: msg.sentAt,
          sender_type: msg.senderType,
          sender_id: msg.senderId,
          sender: {
            id: msg.senderId,
            name: msg.senderType === "customer" ? "Customer" : "Support Agent",
            avatar: `/avatars/${msg.senderType}.png`,
          },
        }));

        setMessages(formattedMessages);
        setHasMoreMessages(formattedMessages.length >= 20);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    if (ticketId && messages.length === 0) {
      fetchMessages();
    }
  }, [ticketId, messages.length]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (bottomRef.current && !loadingMore) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, loadingMore]);

  // Handle sending a new message
  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    // Create temporary message for UI feedback
    const tempMessage = {
      message_id: `temp-${Date.now()}`,
      message_content: content,
      sent_at: new Date().toISOString(),
      sender_type: currentUser.role,
      sender_id: currentUser.id,
      sender: {
        id: currentUser.id,
        name:
          currentUser.name ||
          (currentUser.role === "customer" ? "Customer" : "Support Agent"),
        avatar: currentUser.avatar || `/avatars/${currentUser.role}.png`,
      },
    };

    // Add temporary message to UI
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Send message to server
      const response = await api.post(`/ticket/${ticketId}/message`, {
        ticketId,
        content,
        senderType: currentUser.role,
        senderId: currentUser.id,
      });

      // Replace temporary message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === tempMessage.message_id
            ? {
                ...msg,
                message_id: response.data.messageId,
                sent_at: response.data.sentAt,
              }
            : msg
        )
      );

      if (onSendMessage) {
        onSendMessage(response.data);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove temporary message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.message_id !== tempMessage.message_id)
      );
    }
  };

  // Load older messages
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await api.get(
        `/ticket/${ticketId}/messages?page=${nextPage}`
      );

      const formattedMessages = response.data.map((msg) => ({
        message_id: msg.messageId,
        message_content: msg.messageContent,
        sent_at: msg.sentAt,
        sender_type: msg.senderType,
        sender_id: msg.senderId,
        sender: {
          id: msg.senderId,
          name: msg.senderType === "customer" ? "Customer" : "Support Agent",
          avatar: `/avatars/${msg.senderType}.png`,
        },
      }));

      if (formattedMessages.length > 0) {
        setMessages((prev) => [...formattedMessages, ...prev]);
        setPage(nextPage);
        setHasMoreMessages(formattedMessages.length >= 20);
      } else {
        setHasMoreMessages(false);
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

TicketChat.propTypes = {
  ticketId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    role: PropTypes.oneOf(["customer", "administrator"]).isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  initialMessages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      message_content: PropTypes.string.isRequired,
      sent_at: PropTypes.string.isRequired,
      sender_type: PropTypes.oneOf(["customer", "administrator"]).isRequired,
      sender_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      sender: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
      }),
    })
  ),
  onSendMessage: PropTypes.func,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default TicketChat;
