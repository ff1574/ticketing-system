import { useState, useEffect, useRef, useContext } from "react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Check,
  X,
  User,
  ChevronUp,
  Maximize2,
  Star,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import api from "@/utils/api";
import AuthContext from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";

export default function TicketCard() {
  const { currentUser } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showDetail, setShowDetail] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showXpAnimation, setShowXpAnimation] = useState(false);

  const { showAlert } = useAlert();

  const contentRef = useRef(null);

  // Motion values for drag gesture
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();

  // Transform x motion into rotation and scale
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const scaleX = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8]);
  const scaleY = useTransform(y, [-200, 0, 200], [0.9, 1, 1]);
  const scale = useTransform([scaleX, scaleY], ([latestX, latestY]) =>
    Math.min(latestX, latestY)
  );

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get("/ticket/getAllOpenTickets");
        setTickets(response.data);
      } catch (error) {
        console.log(error);
        showAlert("Failed to load tickets", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Update scroll check when tickets load
  useEffect(() => {
    if (contentRef.current && tickets.length > 0) {
      setIsScrollable(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  }, [tickets, currentIndex]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[400px] w-full max-w-md items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-56"></div>
        </div>
      </div>
    );
  }

  // Empty state (keep existing but update text)
  if (currentIndex >= tickets.length) {
    return (
      <div className="flex h-[400px] w-full max-w-md items-center justify-center ...">
        All open tickets have been processed 🎉
      </div>
    );
  }

  const currentTicket = tickets[currentIndex];

  const handleDragEnd = async (event, info) => {
    const offset = info.offset;
    const velocity = info.velocity;

    // Vertical swipe detection (upwards)
    if (offset.y < -50 || velocity.y < -300) {
      await controls.start({
        y: -100,
        scale: 0.95,
        transition: { duration: 0.2 },
      });
      setShowDetail(true);
      controls.start({ y: 0, scale: 1 });
      return;
    }

    // Horizontal swipe handling
    const isHorizontalSwipe = Math.abs(offset.x) > Math.abs(offset.y);
    if (isHorizontalSwipe) {
      if (offset.x > 100 || velocity.x > 500) {
        await controls.start({ x: 500, opacity: 0 });
        handleSwipe(true);
      } else if (offset.x < -100 || velocity.x < -500) {
        await controls.start({ x: -500, opacity: 0 });
        handleSwipe(false);
      } else {
        controls.start({ x: 0, y: 0, opacity: 1 });
      }
    } else {
      controls.start({ x: 0, y: 0 }); // Reset position for non-swipes
    }
  };

  const handleSwipe = async (isAccepted) => {
    try {
      // Show XP animation if accepted
      if (isAccepted) {
        await api.put(`/ticket/assignTicketToAgent/${currentTicket.ticketId}`, {
          administratorId: currentUser.id,
        });

        setShowXpAnimation(true);
        setTimeout(() => {
          setShowXpAnimation(false);
          advanceTicket();
        }, 2000);
      } else {
        await api.put(`/ticket/declineTicket/${currentTicket.ticketId}`);  
        advanceTicket();
      }
    } catch (error) {
      showAlert("Failed to update ticket status", "error");
    }
  };

  const advanceTicket = () => {
    if (currentIndex < tickets.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      controls.start({ x: 0, y: 0, opacity: 1 });
    }
  };

  const handleButtonClick = async (isAccepted) => {
    await controls.start({
      x: isAccepted ? 500 : -500,
      opacity: 0,
      transition: { duration: 0.3 },
    });
    handleSwipe(isAccepted);
  };

  const priorityColors = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  };

  if (currentIndex >= tickets.length) {
    return (
      <div className="flex h-[400px] w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-gray-500">
        No more tickets to review
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md touch-none mx-auto h-[500px]">
      {/* XP Animation */}
      <AnimatePresence>
        {showXpAnimation && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 0.3, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: 1,
                  repeatType: "loop",
                }}
              />
              <motion.div
                className="flex flex-col items-center justify-center bg-background rounded-xl p-6 shadow-lg border border-primary/20"
                animate={{
                  y: [0, -20, 0],
                  rotateZ: [0, -5, 5, 0],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <motion.div
                  className="flex items-center gap-2 text-2xl font-bold text-primary mb-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: 1 }}
                >
                  <Award className="h-8 w-8" />
                  <span>+{currentTicket.xp} XP</span>
                </motion.div>
                <motion.div
                  className="text-sm text-muted-foreground"
                  animate={{ opacity: [0, 1] }}
                  transition={{ delay: 0.5 }}
                >
                  Ticket resolved successfully!
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <h3 className="font-semibold">{currentTicket.username}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {currentTicket.ticketId}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={priorityColors[currentTicket.priority]}>
                {currentTicket.priority.charAt(0).toUpperCase() +
                  currentTicket.priority.slice(1)}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="h-3 w-3 mr-1 text-amber-400" />
                <span>{currentTicket.xp} XP</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              {currentTicket.title}
            </h2>
            <div
              ref={contentRef}
              className="relative max-h-[120px] overflow-hidden"
            >
              <p className="text-sm">{currentTicket.ticketDescription}</p>
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
              Submitted:{" "}
              {new Date(currentTicket.timestamp).toLocaleDateString()}
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

      {/* Modal Dialog for Ticket Details */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">{currentTicket.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-sm">
              <span>Ticket ID: {currentTicket.ticketId}</span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 mt-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Description</h4>
                <p className="text-sm text-justify">
                  {currentTicket.ticketDescription}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Ticket Details</h4>
                <dl className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                  <dt className="text-muted-foreground">Submitted by</dt>
                  <dd className="font-medium">{currentTicket.username}</dd>

                  <dt className="text-muted-foreground">Priority</dt>
                  <dd>
                    <Badge className={priorityColors[currentTicket.priority]}>
                      {currentTicket.priority}
                    </Badge>
                  </dd>

                  <dt className="text-muted-foreground">Submitted on</dt>
                  <dd className="font-medium">
                    {new Date(currentTicket.timestamp).toLocaleDateString()}
                  </dd>

                  <dt className="text-muted-foreground">Experience reward</dt>
                  <dd className="font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1 text-amber-400" />
                    <span>{currentTicket.xp} XP</span>
                  </dd>
                </dl>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Actions</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setShowDetail(false);
                      handleButtonClick(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      setShowDetail(false);
                      handleButtonClick(true);
                    }}
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
