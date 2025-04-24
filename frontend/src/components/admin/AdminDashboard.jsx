import { useState } from "react";
import {
  LayoutGrid,
  Users,
  Settings,
  Ticket,
  BarChart3,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketSwiper from "./TicketSwiper";
import AdminTicketMenu from "./AdminTicketMenu";

const stats = [
  {
    title: "Total Tickets",
    value: "256",
    icon: Ticket,
  },
  {
    title: "Active Users",
    value: "132",
    icon: Users,
  },
  {
    title: "Response Time",
    value: "1.2h",
    icon: Bell,
  },
  {
    title: "Resolution Rate",
    value: "94%",
    icon: BarChart3,
  },
];

const actions = [
  {
    title: "Review Tickets",
    description: "Review and process support tickets",
    icon: Ticket,
    href: "#tickets",
  },
  {
    title: "User Management",
    description: "Manage user accounts and permissions",
    icon: Users,
    href: "#users",
  },
  {
    title: "System Settings",
    description: "Configure system preferences",
    icon: Settings,
    href: "#settings",
  },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const handleActionClick = (href) => {
    if (href === "#tickets") {
      setActiveTab("tickets");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              My Tickets
            </TabsTrigger>
            <TabsTrigger value="new-tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              New Tickets
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 space-y-4">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => (
              <Card key={action.title} className="hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <action.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleActionClick(action.href)}
                  >
                    Access {action.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">My Assigned Tickets</h2>
              <p className="text-sm text-muted-foreground">
                View and respond to tickets assigned to you
              </p>
            </div>
          </div>
          <AdminTicketMenu />
        </TabsContent>

        <TabsContent value="new-tickets" className="mt-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">New Tickets</h2>
              <p className="text-sm text-muted-foreground">
                Process and respond to new support tickets
              </p>
            </div>
          </div>
          <div className="w-full max-w-md mx-auto">
            <TicketSwiper />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
