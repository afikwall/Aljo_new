import React from "react";
import { useUser, useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { Link, useLocation, useNavigate } from "react-router";
import { getPageUrl, logOut } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  User,
  Building2,
  Users,
  LogOut as LogOutIcon,
  CalendarPlus,
  Briefcase,
  Clock,
  FileText,
  HeartPulse,
  UserCircle,
  CalendarDays,
  CalendarCheck,
  MessageCircle,
  BarChart2,
  DollarSign,
  Receipt,
  HelpCircle,
  ClipboardCheck,
  FileSpreadsheet,
  Wallet,
} from "lucide-react";
import {
  ProfilePage,
  LoginPage,
  AdminDashboardPage,
  AdminStaffManagementPage,
  AdminFacilityManagementPage,
  AdminSettingsPage,
  AdminMessagesPage,
  AdminReportsPage,
  AdminPayrollPage,
  AdminInvoicesPage,
  AdminShiftManagementPage,
  AdminApplicationsPage,
  StaffDashboardPage,
  FacilityDashboardPage,
  FacilityPostShiftPage,
  StaffAvailableShiftsPage,
  StaffMyShiftsPage,
  StaffMyProfilePage,
  StaffMyDocumentsPage,
  StaffMyPayrollsPage,
  StaffCareerPathPage,
  StaffSchedulePage,
  StaffMessagesPage,
  FMMessagesPage,
  FMInvoicesPage,
  FMTimesheetPage,
  AdminHelpPage,
  FacilityManagerHelpPage,
  StaffHelpPage,
  StaffTimesheetPage,
  MessagesEntity,
  StaffProfilesEntity,
  FacilityManagerProfilesEntity,
} from "@/product-types";
import { useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Settings, TrendingUp } from "lucide-react";
import {
  type MessageInstance,
  countUnreadDirect,
  countUnreadBroadcasts,
  formatUnreadCount,
} from "@/utils/messageUtils";
import { NotificationBell } from "@/components/NotificationBell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const loginPageUrl = getPageUrl(LoginPage);
  const isLoginPage = location.pathname === loginPageUrl;

  const { data: allMessages } = useEntityGetAll(MessagesEntity);
  const { data: staffProfilesData } = useEntityGetAll(
    StaffProfilesEntity,
    { email: user.email },
    { enabled: user.isAuthenticated && user.role === "staff" }
  );
  const { data: fmProfilesData } = useEntityGetAll(
    FacilityManagerProfilesEntity,
    { email: user.email },
    { enabled: user.isAuthenticated && user.role === "facility_manager" }
  );

  const adminDashboardUrl = getPageUrl(AdminDashboardPage);
  const profilePageUrl = getPageUrl(ProfilePage);

  useEffect(() => {
    if (!user.isAuthenticated && !isLoginPage) {
      navigate(loginPageUrl);
      return;
    }

    if (
      user.isAuthenticated &&
      user.role === "admin" &&
      (location.pathname === "/" || location.pathname === profilePageUrl)
    ) {
      navigate(adminDashboardUrl, { replace: true });
    }
  }, [user.isAuthenticated, user.role, isLoginPage, navigate, loginPageUrl, adminDashboardUrl, profilePageUrl, location.pathname]);

  const unreadCount = useMemo(() => {
    if (!user.isAuthenticated || !allMessages) return 0;
    const messages = (allMessages as unknown as MessageInstance[]) || [];

    if (user.role === "staff") {
      const myProfile = staffProfilesData?.[0] as any;
      const directUnread = countUnreadDirect(messages, user.email);
      const broadcastUnread = countUnreadBroadcasts(
        messages,
        myProfile?.lastViewedMessagesDate,
        undefined
      );
      return directUnread + broadcastUnread;
    }

    if (user.role === "facility_manager") {
      const fmProfile = fmProfilesData?.[0] as any;
      const directUnread = countUnreadDirect(messages, user.email);
      const broadcastUnread = countUnreadBroadcasts(
        messages,
        fmProfile?.lastViewedMessagesDate,
        fmProfile?.facilityProfileId
      );
      return directUnread + broadcastUnread;
    }

    if (user.role === "admin") {
      return countUnreadDirect(messages, user.email);
    }

    return 0;
  }, [user, allMessages, staffProfilesData, fmProfilesData]);

  const unreadBadgeText = useMemo(
    () => formatUnreadCount(unreadCount),
    [unreadCount]
  );

  const navigationItems = useMemo(() => {
    if (!user.isAuthenticated) return [];

    if (user.role === "admin") {
      return [
        { title: "Dashboard", url: getPageUrl(AdminDashboardPage), icon: LayoutDashboard, badge: "" },
        { title: "Staff Management", url: getPageUrl(AdminStaffManagementPage), icon: Users, badge: "" },
        { title: "Facility Management", url: getPageUrl(AdminFacilityManagementPage), icon: Building2, badge: "" },
        { title: "Shift Management", url: getPageUrl(AdminShiftManagementPage), icon: CalendarCheck, badge: "" },
        { title: "Applications", url: getPageUrl(AdminApplicationsPage), icon: ClipboardCheck, badge: "" },
        { title: "Payroll", url: getPageUrl(AdminPayrollPage), icon: DollarSign, badge: "" },
        { title: "Invoices", url: getPageUrl(AdminInvoicesPage), icon: Receipt, badge: "" },
        { title: "Reports", url: getPageUrl(AdminReportsPage), icon: BarChart2, badge: "" },
        { title: "Messages", url: getPageUrl(AdminMessagesPage), icon: MessageCircle, badge: unreadBadgeText },
        { title: "Settings", url: getPageUrl(AdminSettingsPage), icon: Settings, badge: "" },
        { title: "Profile", url: getPageUrl(ProfilePage), icon: UserCircle, badge: "" },
        { title: "Help", url: getPageUrl(AdminHelpPage), icon: HelpCircle, badge: "" },
      ];
    }

    if (user.role === "facility_manager") {
      return [
        { title: "Dashboard", url: getPageUrl(FacilityDashboardPage), icon: LayoutDashboard, badge: "" },
        { title: "Post Shift", url: getPageUrl(FacilityPostShiftPage), icon: CalendarPlus, badge: "" },
        { title: "Timesheet", url: getPageUrl(FMTimesheetPage), icon: FileSpreadsheet, badge: "" },
        { title: "Invoices", url: getPageUrl(FMInvoicesPage), icon: Receipt, badge: "" },
        { title: "Messages", url: getPageUrl(FMMessagesPage), icon: MessageCircle, badge: unreadBadgeText },
        { title: "Help", url: getPageUrl(FacilityManagerHelpPage), icon: HelpCircle, badge: "" },
      ];
    }

    if (user.role === "staff") {
      return [
        { title: "Dashboard", url: getPageUrl(StaffDashboardPage), icon: LayoutDashboard, badge: "" },
        { title: "Available Shifts", url: getPageUrl(StaffAvailableShiftsPage), icon: Briefcase, badge: "" },
        { title: "My Shifts", url: getPageUrl(StaffMyShiftsPage), icon: Clock, badge: "" },
        { title: "My Timesheet", url: getPageUrl(StaffTimesheetPage), icon: FileSpreadsheet, badge: "" },
        { title: "My Schedule", url: getPageUrl(StaffSchedulePage), icon: CalendarDays, badge: "" },
        { title: "My Documents", url: getPageUrl(StaffMyDocumentsPage), icon: FileText, badge: "" },
        { title: "My Payrolls", url: getPageUrl(StaffMyPayrollsPage), icon: Wallet, badge: "" },
        { title: "Career Path", url: getPageUrl(StaffCareerPathPage), icon: TrendingUp, badge: "" },
        { title: "Messages", url: getPageUrl(StaffMessagesPage), icon: MessageCircle, badge: unreadBadgeText },
        { title: "My Profile", url: getPageUrl(StaffMyProfilePage), icon: UserCircle, badge: "" },
        { title: "Help", url: getPageUrl(StaffHelpPage), icon: HelpCircle, badge: "" },
      ];
    }

    return [];
  }, [user.role, user.isAuthenticated, unreadBadgeText]);

  const userInitials = useMemo(() => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.name) {
      const parts = user.name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return "U";
  }, [user.firstName, user.lastName, user.name]);

  const getRoleBadgeColor = (role?: string) => {
    if (role === "admin") return "bg-chart-1/20 text-chart-1";
    if (role === "facility_manager") return "bg-chart-4/20 text-chart-4";
    if (role === "staff") return "bg-accent/20 text-accent";
    return "bg-muted text-muted-foreground";
  };

  if (!user.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col pb-16">
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background px-4">
          <span className="text-sm font-semibold">ALJO CareCrew</span>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar - first 5 items */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-lg">
          <div className="flex h-16 items-center justify-around px-2">
            {navigationItems.slice(0, 5).map((item) => {
              const isActive = location.pathname?.startsWith(item.url) && item.url !== "#";
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                    {item.badge && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs font-medium">{item.title}</span>
                </Link>
              );
            })}

            {/* More Tab */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground">
                  <div className="relative">
                    <User className="h-5 w-5 shrink-0" />
                    {navigationItems.slice(5).some((i) => i.badge) && (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {navigationItems.slice(5).find((i) => i.badge)?.badge}
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs font-medium">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user.firstName || user.name || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      <Badge className={cn("mt-1 w-fit text-xs", getRoleBadgeColor(user.role))}>
                        {user.role === "facility_manager" ? "Facility Manager" : user.role}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {navigationItems.slice(5).map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.title} asChild>
                      <Link to={item.url} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {item.title}
                        </div>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}

                {navigationItems.length > 5 && <DropdownMenuSeparator />}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logOut()}>
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <HeartPulse className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">ALJO CareCrew</span>
              <span className="text-xs text-muted-foreground">Healthcare Staffing</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems?.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname?.startsWith(item.url) && item.url !== "#"}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-auto py-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">
                        {user.firstName || user.name || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      <Badge className={cn("mt-1 text-xs", getRoleBadgeColor(user.role))}>
                        {user.role === "facility_manager" ? "Facility Manager" : user.role}
                      </Badge>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={
                      user.role === "staff"
                        ? getPageUrl(StaffMyProfilePage)
                        : getPageUrl(ProfilePage)
                    }>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logOut()}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}