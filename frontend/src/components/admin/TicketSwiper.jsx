import { useState, useEffect, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import AuthContext from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import TicketCard from "./TicketCard";
import XpAnimation from "@/components/XpAnimation";

export default function TicketSwiper() {
  const { currentUser } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [tickets, setTickets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showXpAnimation, setShowXpAnimation] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get("/ticket/getAllOpenTickets");
        setTickets(response.data);
      } catch (error) {
        showAlert("Failed to load tickets", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleSwipeResult = async (isAccepted) => {
    setProcessing(true);
    const currentTicket = tickets[currentIndex];

    try {
      const endpoint = isAccepted
        ? `/ticket/assignTicketToAgent/${currentTicket.ticketId}`
        : `/ticket/declineTicket/${currentTicket.ticketId}`;

      await api.put(endpoint, { administratorId: currentUser.id });

      if (isAccepted) {
        setShowXpAnimation(true);
        setTimeout(() => {
          setShowXpAnimation(false);
          setCurrentIndex((prev) => prev + 1);
        }, 2000);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      showAlert(
        `Failed to ${isAccepted ? "accept" : "decline"} ticket`,
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

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

  if (currentIndex >= tickets.length) {
    return (
      <div className="flex h-[400px] w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-gray-500">
        All open tickets have been processed 🎉
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[500px]">
      <AnimatePresence mode="wait">
        {showXpAnimation && (
          <XpAnimation key="xp-animation" xp={tickets[currentIndex].xp} />
        )}
        <TicketCard
          key={tickets[currentIndex].ticketId}
          ticket={tickets[currentIndex]}
          onAccept={() => handleSwipeResult(true)}
          onDecline={() => handleSwipeResult(false)}
          processing={processing}
        />
      </AnimatePresence>
    </div>
  );
}
