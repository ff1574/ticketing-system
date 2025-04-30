import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ChatMessage({
  message,
  isCurrentUser,
  showAvatar = true,
  animate = true,
}) {
  const messageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Format the dates safely
  let formattedTime = "Unknown time";
  let formattedDate = "Unknown date";

  if (message.sent_at) {
    try {
      const date = new Date(message.sent_at);
      if (isValid(date)) {
        formattedTime = format(date, "h:mm a");
        formattedDate = format(date, "MMM d, yyyy");
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }
  }

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
            alt={message.sender_type.charAt(0).toUpperCase()}
          />
          <AvatarFallback>
            {message.sender_type.charAt(0).toUpperCase()}
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
            {message.sender_type}
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
            alt={message.sender_type.charAt(0).toUpperCase()}
          />
          <AvatarFallback>
            {message.sender_type.charAt(0).toUpperCase()}
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
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  showAvatar: PropTypes.bool,
  animate: PropTypes.bool,
};

export default ChatMessage;
