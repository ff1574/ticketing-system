import { useContext, useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminTicketView from "./AdminTicketView";
import AuthContext from "@/context/AuthContext";
import api from "@/utils/api";

// Status icons
const statusIcons = {
  open: <Eye className="h-4 w-4 text-blue-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  resolved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  unresolved: <XCircle className="h-4 w-4 text-red-500" />,
};

export function AdminTicketMenu() {
  const { currentUser } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminTickets = async () => {
      try {
        setLoading(true);
        const response = await api.post("/ticket/getAdminTickets", {
          administratorId: currentUser?.id,
        });

        if (response.status === 200) {
          setTickets(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch admin tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchAdminTickets();
    }
  }, [currentUser]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.ticket_title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.ticket_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
  };

  const handleBackFromTicketView = () => {
    // Refresh tickets when returning from ticket view
    setSelectedTicket(null);
    fetchAdminTickets();
  };

  if (selectedTicket) {
    return (
      <AdminTicketView
        ticket={selectedTicket}
        onBack={handleBackFromTicketView}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading tickets...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No tickets found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow
                  key={ticket.ticket_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleTicketClick(ticket)}
                >
                  <TableCell className="font-medium">
                    {ticket.ticket_id}
                  </TableCell>
                  <TableCell>{ticket.ticket_title}</TableCell>
                  <TableCell>{ticket.customer_name || "Unknown"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {statusIcons[ticket.ticket_status]}
                      <span className="capitalize">{ticket.ticket_status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {ticket.ticket_priority || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default AdminTicketMenu;
