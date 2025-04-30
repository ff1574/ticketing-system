import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
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

export function CustomerTicketView({ ticketId, onBack }) {
  const { currentUser } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [ticket, setTicket] = useState({});
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/ticket/${ticketId}`);
        setTicket(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Failed to fetch ticket:", error);
        showAlert("Failed to fetch ticket details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, showAlert]);

  const handleSendMessage = async (content) => {
    console.log("Message content received from input:", content);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">
            Loading ticket details...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>

          <div>
            <h1 className="text-xl font-semibold">{ticket.ticket_title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Ticket #{ticket.ticket_id}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                {statusIcons[ticket.ticket_status]}
                <span className="capitalize">{ticket.ticket_status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={priorityColors[ticket.ticket_priority]}>
            {ticket.ticket_priority.charAt(0).toUpperCase() +
              ticket.ticket_priority.slice(1)}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => showAlert("Feature not implemented", "info")}
              >
                Mark as Resolved
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => showAlert("Feature not implemented", "info")}
              >
                Cancel Ticket
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
                    <span className="capitalize">{ticket.ticket_status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <div className="mt-1">
                    <Badge className={priorityColors[ticket.ticket_priority]}>
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
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

CustomerTicketView.propTypes = {
  ticketId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onBack: PropTypes.func.isRequired,
};

export default CustomerTicketView;
