import { } from "react";
import { Plus, Ticket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerTicketMenu } from "./CustomerTicketMenu";
import { TicketForm } from "./TicketForm";

export function CustomerDashboard() {

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      <Tabs
        defaultValue="tickets"
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Customer Dashboard</h1>
          <TabsList>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="new-ticket" className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tickets" className="mt-0">
          <CustomerTicketMenu />
        </TabsContent>

        <TabsContent value="new-ticket" className="mt-0">
          <TicketForm onSubmitSuccess={() => console.log("success")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CustomerDashboard;
