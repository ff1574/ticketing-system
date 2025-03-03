import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { User, ChevronUp, Maximize2, Star, X, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TicketDetail from "@/components/admin/TicketDetail";

export default function TicketCard({
  ticket,
  onAccept,
  onDecline,
  processing,
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const contentRef = useRef(null);

  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const scaleX = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8]);
  const scaleY = useTransform(y, [-200, 0, 200], [0.9, 1, 1]);
  const scale = useTransform([scaleX, scaleY], ([latestX, latestY]) =>
    Math.min(latestX, latestY)
  );

  const priorityColors = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  };

  useEffect(() => {
    controls.start({ x: 0, y: 0, opacity: 1, scale: 1 });
    setShowDetail(false);
    checkScrollable();
  }, [ticket, controls]);

  const checkScrollable = () => {
    if (contentRef.current) {
      setIsScrollable(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  };

  const handleDragEnd = async (_, info) => {
    if (processing) return;

    const offset = info.offset;
    const velocity = info.velocity;

    if (offset.y < -50 || velocity.y < -300) {
      await controls.start({ y: -100, scale: 0.95 });
      setShowDetail(true);
      controls.start({ y: 0, scale: 1 });
      return;
    }

    const isHorizontal = Math.abs(offset.x) > Math.abs(offset.y);
    if (!isHorizontal) return;

    if (offset.x > 100 || velocity.x > 500) {
      await swipeOut(500);
      onAccept();
    } else if (offset.x < -100 || velocity.x < -500) {
      await swipeOut(-500);
      onDecline();
    } else {
      controls.start({ x: 0, y: 0 });
    }
  };

  const swipeOut = async (direction) => {
    await controls.start({
      x: direction,
      opacity: 0,
      transition: { duration: 0.3 },
    });
  };

  const handleButtonClick = async (isAccepted) => {
    if (processing) return;
    await swipeOut(isAccepted ? 500 : -500);
    isAccepted ? onAccept() : onDecline();
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      drag="x"
      className="absolute w-full"
    >
      <motion.div
        drag="x y"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, y, rotate, scale }}
        className="cursor-grab active:cursor-grabbing"
      >
        <Card className="p-6 shadow-xl">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-gray-100 p-2">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{ticket.username}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {ticket.ticketId}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={priorityColors[ticket.priority]}>
                {ticket.priority.charAt(0).toUpperCase() +
                  ticket.priority.slice(1)}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="h-3 w-3 mr-1 text-amber-400" />
                <span>{ticket.xp} XP</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">{ticket.title}</h2>
            <div
              ref={contentRef}
              className="relative max-h-[120px] overflow-hidden"
            >
              <p className="text-sm">{ticket.ticketDescription}</p>
              {isScrollable && (
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center bg-gradient-to-t from-white to-transparent pt-8 pb-2 dark:from-background">
                  <ChevronUp className="h-4 w-4 animate-bounce" />
                  <span className="text-xs text-muted-foreground">
                    Swipe up for more
                  </span>
                </div>
              )}
            </div>
            {isScrollable && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setShowDetail(true)}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                View Full Details
              </Button>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Submitted: {new Date(ticket.timestamp).toLocaleDateString()}
            </p>
          </div>

          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleButtonClick(false)}
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => handleButtonClick(true)}
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
          </div>
        </Card>
      </motion.div>

      <TicketDetail
        ticket={ticket}
        open={showDetail}
        onOpenChange={setShowDetail}
        onAccept={onAccept}
        onDecline={onDecline}
        priorityColors={priorityColors}
      />
    </motion.div>
  );
}

TicketCard.propTypes = {
  ticket: PropTypes.object.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  processing: PropTypes.bool,
};
