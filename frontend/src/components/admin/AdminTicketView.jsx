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

// Update the status icons to match the database ENUM values
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

  // Update the useEffect to create the initial message from ticket description
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        // Create initial message from ticket description
        const initialMessage = {
          message_id: `ticket-${ticket.ticket_id}`,
          message_content: ticket.ticket_description,
          sent_at: ticket.created_at,
          sender_type: "customer",
          sender_id: ticket.customer_id,
          sender: {
            name: ticket.customer_name || "Customer",
            avatar: ticket.customer_avatar,
          },
        };

        // Fetch messages
        const messagesResponse = await api.get(`/ticket/${ticketId}/messages`);
        const allMessages = [initialMessage, ...messagesResponse.data.messages];
        setMessages(allMessages);
      } catch (error) {
        console.error("Failed to fetch ticket:", error);
        showAlert("Failed to load ticket details", "error");
        onBack();
      } finally {
        setLoading(false);
      }
    };
  }, [ticket, showAlert, onBack]);

  // Update the handleSendMessage function to match the database structure
  const handleSendMessage = async (content, attachment) => {
    try {
      // In a real app, you'd send the message to your API
      const response = await api.post(`/ticket/${ticketId}/messages`, {
        ticket_id: ticketId,
        sender_type: "administrator",
        sender_id: currentUser.id,
        message_content: content,
        attachment,
      });

      return response.data.message;
    } catch (error) {
      console.error("Failed to send message:", error);
      showAlert("Failed to send message", "error");
      throw error;
    }
  };

  // Update the handleStatusChange function to match the database structure
  const handleStatusChange = async (newStatus) => {
    try {
      // In a real app, you'd update the ticket status via your API
      const response = await api.put(`/ticket/${ticket_ticketId}/status`, {
        ticket_status: newStatus,
        administrator_id: currentUser.id,
      });

      showAlert(`Ticket marked as ${newStatus}`, "success");
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      showAlert("Failed to update ticket status", "error");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>

          <div>
            {/* Update references to ticket properties throughout the component */}
            <h1 className="text-xl font-semibold">
              {ticket.ticket_title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {/* Update references to ticket properties throughout the component */}
              <span>Ticket #{ticket.ticket_id}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                {/* Update references to ticket properties throughout the component */}
                {statusIcons[ticket.ticket_status]}
                <span className="capitalize">
                  {ticket.ticket_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Update references to ticket properties throughout the component */}
          <Badge className={priorityColors[ticket.ticket_priority]}>
            {ticket.ticket_priority.charAt(0).toUpperCase() +
              ticket.ticket_priority.slice(1)}
          </Badge>

          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 mr-1 text-amber-400" />
            {/* Update references to ticket properties throughout the component */}
            <span>{ticket.ticket_exp} XP</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            {/* Update the dropdown menu items to match the database ENUM values */}
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
              ticketId={ticketId}
              currentUser={currentUser}
              initialMessages={messages}
              onSendMessage={handleSendMessage}
              isLoading={false}
              /* Update the disabled check for the chat */
              disabled={
                ticket.ticket_status === "resolved" ||
                ticket.ticket_status === "unresolved"
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
                    {statusIcons[ticket.ticket_status]}
                    <span className="capitalize">
                      {ticket.ticket_status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <div className="mt-1">
                    <Badge
                      className={priorityColors[ticket.ticket_priority]}
                    >
                      {ticket.ticket_priority.charAt(0).toUpperCase() +
                        ticket.ticket_priority.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="mt-1">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="mt-1">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
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
                  <p className="mt-1">{ticket.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="mt-1">{ticket.customerEmail || "N/A"}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-2">Actions</h2>
              <div className="flex gap-2">
                {/* Update the action buttons at the bottom */}
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("resolved")}
                  disabled={ticket.ticket_status === "resolved"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("unresolved")}
                  disabled={ticket.ticket_status === "unresolved"}
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
  ticket: PropTypes.object.isRequired,

  onBack: PropTypes.func.isRequired,
};

export default AdminTicketView;
