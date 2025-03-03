import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Check, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PropTypes from "prop-types";

export default function TicketDetail({
  ticket,
  open,
  onOpenChange,
  onAccept,
  onDecline,
  priorityColors,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <span>Ticket ID: {ticket.ticketId}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 mt-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Description</h4>
              <p className="text-sm text-justify">{ticket.ticketDescription}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Ticket Details</h4>
              <dl className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">Submitted by</dt>
                <dd className="font-medium">{ticket.username}</dd>

                <dt className="text-muted-foreground">Priority</dt>
                <dd>
                  <Badge className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                </dd>

                <dt className="text-muted-foreground">Submitted on</dt>
                <dd className="font-medium">
                  {new Date(ticket.timestamp).toLocaleDateString()}
                </dd>

                <dt className="text-muted-foreground">Experience reward</dt>
                <dd className="font-medium flex items-center">
                  <Star className="h-4 w-4 mr-1 text-amber-400" />
                  <span>{ticket.xp} XP</span>
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
                    onOpenChange(false);
                    onDecline();
                  }}
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    onAccept();
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
  );
}

TicketDetail.propTypes = {
  ticket: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  priorityColors: PropTypes.object.isRequired,
};
