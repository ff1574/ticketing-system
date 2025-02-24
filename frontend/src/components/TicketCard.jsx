"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Check, X, User, ChevronUp, Maximize2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAlert } from "@/context/AlertContext";

export default function TicketCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

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

  // Sample ticket data - replace with your API data
  const tickets = [
    {
      title: "Email Client Access Issue",
      body: "After the recent system update, I'm unable to access my email client. When trying to open Outlook, it shows an error message saying 'Cannot connect to server'. After the recent system update, I'm unable to access my email client. When trying to open Outlook, it shows an error message saying 'Cannot connect to server'.After the recent system update, I'm unable to access my email client. When trying to open Outlook, it shows an error message saying 'Cannot connect to server'.After the recent system update, I'm unable to access my email client. When trying to open Outlook, it shows an error message saying 'Cannot connect to server'.After the recent system update, I'm unable to access my email client. When trying to open Outlook, it shows an error message saying 'Cannot connect to server'.",
      username: "Sarah Wilson",
      priority: "high",
      timestamp: "2024-02-22",
      ticketId: "TIC-001",
    },
    {
      title: "Printer Configuration Problem",
      body: "The network printer on floor 2 is not responding to print commands. All print jobs are stuck in the queue.",
      username: "Mike Johnson",
      priority: "medium",
      timestamp: "2024-02-22",
      ticketId: "TIC-002",
    },
    {
      title: "Software Installation Request",
      body: "Need Adobe Creative Suite installed on my workstation for the new marketing project.",
      username: "Emily Brown",
      priority: "low",
      timestamp: "2024-02-22",
      ticketId: "TIC-003",
    },
  ];

  const currentTicket = tickets[currentIndex];

  // Check if content is scrollable
  useEffect(() => {
    if (contentRef.current) {
      setIsScrollable(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    }
  }, []);

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

  const handleSwipe = (isAccepted) => {
    // Here you would handle the ticket action (accept/decline)
    // Show alert message
    showAlert(isAccepted ? "Ticket accepted" : "Ticket declined", "success");

    // Move to next ticket
    if (currentIndex < tickets.length - 1) {
      setCurrentIndex(currentIndex + 1);
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
            <Badge className={priorityColors[currentTicket.priority]}>
              {currentTicket.priority.charAt(0).toUpperCase() +
                currentTicket.priority.slice(1)}
            </Badge>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              {currentTicket.title}
            </h2>
            <div
              ref={contentRef}
              className="relative max-h-[120px] overflow-hidden"
            >
              <p className="text-sm">{currentTicket.body}</p>
              {isScrollable && (
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center bg-gradient-to-t from-white to-transparent pt-8 pb-2">
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

      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent
          className="w-full sm:max-w-md"
          aria-describedby="sheet-title"
        >
          <SheetHeader>
            <SheetTitle>{currentTicket.title}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4 p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Description</h4>
                <p className="text-sm text-justify">{currentTicket.body}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Ticket Details</h4>
                <dl className="text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <dt className="text-muted-foreground">Submitted by</dt>
                    <dd>{currentTicket.username}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <dt className="text-muted-foreground">Ticket ID</dt>
                    <dd>{currentTicket.ticketId}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <dt className="text-muted-foreground">Priority</dt>
                    <dd>
                      <Badge className={priorityColors[currentTicket.priority]}>
                        {currentTicket.priority}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">Submitted on</dt>
                    <dd>
                      {new Date(currentTicket.timestamp).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
        <SheetDescription className="sr-only">Detailed view of the ticket</SheetDescription>
      </Sheet>
    </div>
  );
}
