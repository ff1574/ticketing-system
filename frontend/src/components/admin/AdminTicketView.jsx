import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/context/AlertContext";
import AuthContext from "@/context/AuthContext";
import TicketChat from "../shared/TicketChat";
import api from "@/utils/api";

const statusIcons = {
  open: <Clock className="h-4 w-4 text-blue-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  resolved: <CheckCircle className="h-4 w-4 text-green-500" />,
  unresolved: <XCircle className="h-4 w-4 text-red-500" />,
};

const priorityColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

export function AdminTicketView({ ticket, onBack }) {
  const { currentUser } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");

  // Fetch messages for this ticket
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        if (!ticket?.ticketId) {
          setLoading(false);
          return;
        }

        const response = await api.get(`/ticket/${ticket.ticket_id}/message`);

        // Transform message data to match our component's format
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
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        showAlert("Failed to load conversation", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [ticket, showAlert]);

  // Handle sending a message
  const handleSendMessage = async (content) => {
    console.log("Message content received from input:", content);
  };

  // Handle ticket status change
  const handleStatusChange = async (status) => {
    if (!ticket?.ticket_id) {
      showAlert("Invalid ticket data", "error");
      return;
    }

    try {
      await api.put(`/ticket/${ticket.ticket_id}/status`, {
        status,
      });

      // Update local ticket status (assuming we want immediate UI feedback)
      ticket.ticket_status = status;

      // Force component re-render
      setActiveTab(activeTab);

      showAlert(`Ticket marked as ${status}`, "success");

      // If resolved or unresolved, notify user that chat is disabled
      if (status === "resolved" || status === "unresolved") {
        showAlert("Chat has been disabled for this ticket", "info");
      }
    } catch (error) {
      console.error("Failed to change ticket status:", error);
      showAlert("Failed to update ticket status", "error");
    }
  };

  // Safely access ticket properties with defaults
  const ticketTitle = ticket?.ticket_title || "Unknown Title";
  const ticketId = ticket?.ticket_id || "N/A";
  const ticketStatus = ticket?.ticket_status || "open";
  const ticketPriority = ticket?.ticket_priority || "medium";
  const ticketExp = ticket?.ticket_exp || 0;
  const customerName = ticket?.customer_name || "Unknown Customer";
  const customerEmail = ticket?.customerEmail || "N/A";
  const createdAt = ticket?.created_at
    ? new Date(ticket.created_at).toLocaleString()
    : "Unknown";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>

          <div>
            <h1 className="text-xl font-semibold">{ticketTitle}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Ticket #{ticketId}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                {statusIcons[ticketStatus]}
                <span className="capitalize">{ticketStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={priorityColors[ticketPriority]}>
            {ticketPriority.charAt(0).toUpperCase() + ticketPriority.slice(1)}
          </Badge>

          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 mr-1 text-amber-400" />
            <span>{ticketExp} XP</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange("resolved")}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Mark as Resolved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("pending")}>
                <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                Mark as Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("unresolved")}
              >
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Mark as Unresolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b">
          <TabsList className="mx-4">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 p-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading conversation...
                </p>
              </motion.div>
            </div>
          ) : (
            <TicketChat
              ticketId={ticket?.ticket_id}
              currentUser={currentUser}
              initialMessages={messages}
              onSendMessage={handleSendMessage}
              isLoading={false}
              disabled={
                ticketStatus === "resolved" || ticketStatus === "unresolved"
              }
            />
          )}
        </TabsContent>

        <TabsContent value="details" className="p-4 overflow-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Ticket Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {statusIcons[ticketStatus]}
                    <span className="capitalize">{ticketStatus}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <div className="mt-1">
                    <Badge className={priorityColors[ticketPriority]}>
                      {ticketPriority.charAt(0).toUpperCase() +
                        ticketPriority.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="mt-1">{createdAt}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{createdAt}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-2">
                Customer Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="mt-1">{customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="mt-1">{customerEmail}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-2">Actions</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("resolved")}
                  disabled={ticketStatus === "resolved"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("unresolved")}
                  disabled={ticketStatus === "unresolved"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Unresolved
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

AdminTicketView.propTypes = {
  ticket: PropTypes.shape({
    ticket_id: PropTypes.number,
    ticket_title: PropTypes.string,
    ticket_description: PropTypes.string,
    ticket_urgency: PropTypes.oneOf(["low", "medium", "high"]),
    ticket_impact: PropTypes.oneOf(["low", "medium", "high"]),
    ticket_priority: PropTypes.oneOf(["low", "medium", "high"]),
    ticket_status: PropTypes.oneOf([
      "open",
      "pending",
      "resolved",
      "unresolved",
    ]),
    ticket_exp: PropTypes.number,
    customer_name: PropTypes.string,
    customerEmail: PropTypes.string,
    created_at: PropTypes.string,
  }),
  onBack: PropTypes.func.isRequired,
};

export default AdminTicketView;
