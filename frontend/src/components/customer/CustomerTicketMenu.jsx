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
import CustomerTicketView from "./CustomerTicketView";
import AuthContext from "@/context/AuthContext";
import { api } from "@/utils/api";

// Update the status icons to match the database ENUM values
const statusIcons = {
  open: <Eye className="h-4 w-4 text-blue-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  resolved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  unresolved: <XCircle className="h-4 w-4 text-red-500" />,
};

export function CustomerTicketMenu() {
  const { currentUser } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchCustomerTickets = async () => {
      const response = await api.post("/ticket/getCustomerTickets", {
        customerId: currentUser?.id,
      });

      if (response.status === 200) {
        setTickets(response.data);
      }
      console.log(response.data);
    };

    fetchCustomerTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.ticket_title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.ticket_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTicketClick = (ticketId) => {
    setSelectedTicketId(ticketId);
  };

  const handleBackFromTicketView = () => {
    setSelectedTicketId(null);
  };

  if (selectedTicketId) {
    return (
      <CustomerTicketView
        ticketId={selectedTicketId}
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
          {/* Update the Select component options to match the database ENUM values */}
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
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow
                key={ticket.ticket_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleTicketClick(ticket.ticket_id)}
              >
                <TableCell className="font-medium">
                  {ticket.ticket_id}
                </TableCell>
                <TableCell>{ticket.ticket_title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {statusIcons[ticket.ticket_status]}
                    <span className="capitalize">{ticket.ticket_status}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">
                  {ticket.ticket_priority}
                </TableCell>
                <TableCell>
                  {new Date(ticket.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default CustomerTicketMenu;
