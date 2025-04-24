import { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ChatMessage({
  message,
  isCurrentUser,
  showAvatar = true,
  animate = true,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const messageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const formattedTime = format(new Date(message.sent_at), "h:mm a");
  const formattedDate = format(new Date(message.sent_at), "MMM d, yyyy");

  return (
    <motion.div
      className={cn(
        "flex w-full gap-3 mb-4",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
      initial={animate ? "initial" : false}
      animate={animate ? "animate" : false}
      variants={messageVariants}
    >
      {!isCurrentUser && showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={message.sender.avatar || "/placeholder.svg"}
            alt={message.sender.name}
          />
          <AvatarFallback>
            {message.sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isCurrentUser ? "items-end" : "items-start"
        )}
      >
        {!isCurrentUser && (
          <span className="text-xs text-muted-foreground mb-1">
            {message.sender.name}
          </span>
        )}

        <div
          className={cn(
            "rounded-lg px-4 py-2 text-sm",
            isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.message_content}
          </div>

          {message.attachment && (
            <div className="mt-2">
              <div
                className={cn(
                  "rounded-md overflow-hidden bg-background/20 backdrop-blur-sm",
                  !imageLoaded && "animate-pulse h-32"
                )}
              >
                <img
                  src={message.attachment.url || "/placeholder.svg"}
                  alt={message.attachment.name || "Attachment"}
                  className="max-w-full h-auto object-contain"
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
              {message.attachment.name && (
                <div className="text-xs mt-1 opacity-80">
                  {message.attachment.name}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <span>{formattedTime}</span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {isCurrentUser && showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={message.sender.avatar || "/placeholder.svg"}
            alt={message.sender.name}
          />
          <AvatarFallback>
            {message.sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
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
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  showAvatar: PropTypes.bool,
  animate: PropTypes.bool,
};

export default ChatMessage;
