import { Link, useRouterState } from "@tanstack/react-router";
import { FilePlus2, Files, LayoutGrid, Settings, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Props = { docCount?: number };

export function AppSidebar({ docCount }: Props) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => pathname === p || pathname.startsWith(`${p}/`);

  const main = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
    { title: "New Document", url: "/documents/new", icon: FilePlus2 },
    { title: "All Documents", url: "/documents", icon: Files, badge: docCount },
  ];
  const team = [
    { title: "Team Members", url: "/team", icon: Users },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <span className="brand">LedgerLeaf</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge != null && (
                        <span className="text-xs text-primary">{item.badge}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {team.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
