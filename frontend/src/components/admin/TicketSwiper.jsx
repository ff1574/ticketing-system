import { useState, useEffect, useContext, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import AuthContext from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import TicketCard from "./TicketCard";
import XpAnimation from "@/components/XpAnimation";
import AdminTicketView from "./AdminTicketView";

export default function TicketSwiper() {
  const { currentUser } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [reservedTickets, setReservedTickets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [noTicketsAvailable, setNoTicketsAvailable] = useState(false);
  const [acceptedTicketId, setAcceptedTicketId] = useState(null);

  // Use refs to track tickets and prevent duplicate requests
  const ticketIdsRef = useRef([]);
  const fetchingRef = useRef(false);

  // Keep ref updated with latest ticket IDs
  useEffect(() => {
    ticketIdsRef.current = reservedTickets.map((t) => t.ticket_id);
  }, [reservedTickets]);

  // Function to fetch reserved tickets with request deduplication
  const fetchReservedTickets = async (retryCount = 0) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log("[DEBUG] Skipping duplicate fetch request");
      return;
    }

    fetchingRef.current = true;

    try {
      setLoading(true);
      setNoTicketsAvailable(false);
      console.log(
        "[DEBUG] Requesting ticket reservations for agent:",
        currentUser?.id
      );

      const response = await api.post("/ticket/reserve", {
        administratorId: currentUser?.id,
      });

      console.log("[DEBUG] Received response:", response.data);

      if (response.data.tickets?.length > 0) {
        console.log(
          `[DEBUG] Setting ${response.data.tickets.length} reserved tickets:`,
          response.data.tickets.map((t) => t.ticketId)
        );
        setReservedTickets(response.data.tickets);
        setCurrentIndex(0);
        setNoTicketsAvailable(false);
      } else {
        console.log("[DEBUG] No tickets available");
        setReservedTickets([]);
        setNoTicketsAvailable(true);
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching tickets:", error);

      // Retry logic for deadlocks
      if (
        retryCount < 3 &&
        (error.response?.data?.message?.includes("deadlock") ||
          error.message?.includes("deadlock"))
      ) {
        const delay = 300 * Math.pow(2, retryCount);

        console.log(
          `[DEBUG] Retrying reservation in ${delay}ms (attempt ${
            retryCount + 1
          }/3)`
        );
        setTimeout(() => fetchReservedTickets(retryCount + 1), delay);
        return;
      }

      showAlert("Failed to reserve tickets", "error");
      setNoTicketsAvailable(true);
    } finally {
      setLoading(false);
      // Allow new fetch requests after a small delay
      // to prevent rapid consecutive requests
      setTimeout(() => {
        fetchingRef.current = false;
      }, 300);
    }
  };

  // Helper function to release tickets
  const releaseAllTickets = async () => {
    const ticketIds = ticketIdsRef.current;
    if (ticketIds.length > 0) {
      try {
        console.log("[DEBUG] Attempting to release tickets:", ticketIds);
        const response = await api.post("/ticket/release", { ticketIds });
        console.log("[DEBUG] Release response:", response.data);
        // Clear the reference after release
        ticketIdsRef.current = [];
        return response.data.releasedCount || 0;
      } catch (error) {
        console.error("[DEBUG] Failed to release tickets on cleanup:", error);
        return 0;
      }
    } else {
      console.log("[DEBUG] No tickets to release");
      return 0;
    }
  };

  // Single effect for initial load with cleanup
  useEffect(() => {
    let isMounted = true;

    if (currentUser?.id && isMounted) {
      fetchReservedTickets();
    }

    // Set up heartbeat to keep tickets reserved
    const heartbeatInterval = setInterval(() => {
      const ticketIds = ticketIdsRef.current;
      if (ticketIds.length > 0 && currentUser?.id) {
        api
          .post("/ticket/heartbeat", {
            administratorId: currentUser.id,
            ticketIds,
          })
          .catch((err) => console.error("[DEBUG] Heartbeat failed:", err));
      }
    }, 30000); // Every 30 seconds

    // Only one useEffect for setup and cleanup
    return () => {
      isMounted = false;
      clearInterval(heartbeatInterval);
      releaseAllTickets();
      console.log("[DEBUG] Component unmounted, cleanup complete");
    };
  }, [currentUser?.id]); // Only depend on currentUser.id

  // Handle page unload events separately
  useEffect(() => {
    const handlePageUnload = (event) => {
      const ticketIds = ticketIdsRef.current;
      if (ticketIds.length > 0) {
        console.log("[DEBUG] Page unload event, releasing tickets:", ticketIds);

        if (event.type === "beforeunload") {
          event.preventDefault();
          event.returnValue = "";

          // Try to release tickets synchronously
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/ticket/release", false); // Include full path
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(JSON.stringify({ ticketIds }));
        } else if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ ticketIds })], {
            type: "application/json",
          });
          navigator.sendBeacon("/api/ticket/release", blob);
        }
      }
    };

    window.addEventListener("beforeunload", handlePageUnload);
    window.addEventListener("unload", handlePageUnload);

    return () => {
      window.removeEventListener("beforeunload", handlePageUnload);
      window.removeEventListener("unload", handlePageUnload);
    };
  }, []);

  // Update the handleSwipeResult function to match the database structure
  const handleSwipeResult = async (isAccepted) => {
    if (!reservedTickets[currentIndex] || processing) return;

    setProcessing(true);
    const currentTicket = reservedTickets[currentIndex];

    try {
      // Handle current ticket action
      const endpoint = isAccepted
        ? `/ticket/assignTicketToAgent/${currentTicket.ticket_id}`
        : `/ticket/declineTicket/${currentTicket.ticket_id}`;

      console.log(
        `[DEBUG] Processing ticket ${currentTicket.ticket_id} with action: ${
          isAccepted ? "accept" : "decline"
        }`
      );

      const response = await api.put(endpoint, {
        administrator_id: currentUser.id,
      });

      // Update our local state to remove processed ticket
      const updatedTickets = [...reservedTickets];
      updatedTickets.splice(currentIndex, 1);

      // Show feedback for declined tickets
      if (!isAccepted && response.data.cooldown) {
        const hours = Math.floor(response.data.cooldown / 3600);
        const minutes = Math.floor((response.data.cooldown % 3600) / 60);
        const cooldownMsg =
          hours > 0
            ? `${hours} hour${hours > 1 ? "s" : ""}`
            : `${minutes} minute${minutes > 1 ? "s" : ""}`;

        showAlert(
          `Ticket declined. It will be hidden for ${cooldownMsg}.`,
          "info"
        );
      }

      // If accepted, navigate to the ticket chat view
      if (isAccepted) {
        setAcceptedTicketId(currentTicket.ticket_id);
      }

      // Check if we need to fetch more tickets
      if (updatedTickets.length <= 1 && !isAccepted) {
        try {
          // Make sure we're not already fetching
          if (!fetchingRef.current) {
            fetchingRef.current = true;
            console.log("[DEBUG] Fetching additional tickets after processing");

            // Fetch additional tickets if we're running low
            const newTicketsResponse = await api.post("/ticket/reserve", {
              administrator_id: currentUser.id,
            });

            fetchingRef.current = false;

            if (newTicketsResponse.data.tickets?.length > 0) {
              // Append new tickets, avoiding duplicates
              const existingIds = new Set(
                updatedTickets.map((t) => t.ticket_id)
              );
              const newTickets = newTicketsResponse.data.tickets.filter(
                (t) => !existingIds.has(t.ticket_id)
              );

              console.log(
                `[DEBUG] Adding ${newTickets.length} new tickets to the existing ${updatedTickets.length}`
              );

              setReservedTickets([...updatedTickets, ...newTickets]);
            } else {
              // No more tickets to fetch
              setReservedTickets(updatedTickets);
              if (updatedTickets.length === 0) {
                setNoTicketsAvailable(true);
              }
            }
          } else {
            // Just update with what we have
            setReservedTickets(updatedTickets);
            if (updatedTickets.length === 0) {
              setNoTicketsAvailable(true);
            }
          }
        } catch (error) {
          console.error("[DEBUG] Failed to get new tickets:", error);
          setReservedTickets(updatedTickets);
          if (updatedTickets.length === 0) {
            setNoTicketsAvailable(true);
          }
          fetchingRef.current = false;
        }
      } else if (!isAccepted) {
        // Still have enough tickets, just update the state
        setReservedTickets(updatedTickets);
      }

      // Reset current index if needed
      if (currentIndex >= updatedTickets.length) {
        setCurrentIndex(0);
      }

      // Show XP animation for accepted tickets or when XP is added for declines
      const xpValue = isAccepted
        ? response.data.xp || currentTicket.ticket_exp || 100
        : response.data.xpAdded || 0;

      if (xpValue > 0) {
        setXpEarned(xpValue);
        setShowXpAnimation(true);
        setTimeout(() => setShowXpAnimation(false), 2000);
      }
    } catch (error) {
      console.error("[DEBUG] Error processing ticket:", error);
      showAlert(
        `Failed to process ticket: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );

      // Reset reservations on error
      await releaseAllTickets();
      fetchReservedTickets();
    } finally {
      setProcessing(false);
    }
  };

  const handleBackFromTicketView = () => {
    setAcceptedTicketId(null);
    fetchReservedTickets();
  };

  if (acceptedTicketId) {
    return (
      <AdminTicketView
        ticketId={acceptedTicketId}
        onBack={handleBackFromTicketView}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading tickets...</p>
      </div>
    );
  }

  if (noTicketsAvailable || reservedTickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">
          All open tickets have been processed 🎉
        </h3>
        <p className="text-gray-600 mb-4">
          There are currently no open tickets waiting for your review.
        </p>
        <button
          onClick={() => fetchReservedTickets()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {showXpAnimation && <XpAnimation xp={xpEarned} />}

      <AnimatePresence>
        {reservedTickets.length > 0 && (
          <TicketCard
            key={reservedTickets[currentIndex]?.ticket_id}
            ticket={reservedTickets[currentIndex]}
            onAccept={() => handleSwipeResult(true)}
            onDecline={() => handleSwipeResult(false)}
            processing={processing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
