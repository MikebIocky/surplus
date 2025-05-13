// src/components/AppSidebar.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Clock, Users, ShoppingBag, Plus, User, ChevronDown, LogOut, LogIn, Settings, FileText, Bell, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/useAuth';
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

// --- UI Imports ---
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// --- Menu Item Definitions ---
const allMenuItems = [
    { title: "Listings", url: "/listings", icon: Home, requiresLogin: null },
    { title: "Messages", url: "/messages", icon: MessageSquare, requiresLogin: true },
    { title: "History", url: "/history", icon: Clock, requiresLogin: true },
    { title: "Following", url: "/following", icon: Users, requiresLogin: true },
    { title: "Orders", url: "/ordering", icon: ShoppingBag, requiresLogin: true },
    { title: "Create", url: "/create", icon: Plus, isSpecial: true, requiresLogin: true },
];

// --- Helper Components ---
const MenuSkeletons: React.FC = () => (
    <>
        {[...Array(5)].map((_, i) => (
            <div key={`skel-menu-${i}`} className="flex items-center gap-3 py-2.5 md:py-3 px-4 h-10 md:h-12">
                <Skeleton className="h-6 w-6 rounded-md flex-shrink-0 bg-green-200/50" />
                <Skeleton className="h-5 w-3/4 rounded bg-green-200/50" />
            </div>
        ))}
    </>
);
MenuSkeletons.displayName = 'MenuSkeletons';

const FooterSkeleton: React.FC = () => (
    <>
        <div className="flex items-center justify-between gap-3 py-2 px-3 h-10 md:h-11">
            <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full bg-green-200/50" />
                <Skeleton className="h-5 w-24 rounded bg-green-200/50" />
            </div>
            <Skeleton className="h-5 w-5 rounded bg-green-200/50" />
        </div>
    </>
);
FooterSkeleton.displayName = 'FooterSkeleton';

type Notification = {
  _id: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => setNotifications(data.notifications || []));
    }
  }, [open]);

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}>
        <Bell className="w-6 h-6" />
        {/* Show dot if there are unread notifications */}
        {notifications.some(n => !n.read) && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
          <div className="p-2 font-bold border-b">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            notifications.map(n => (
              <a
                key={n._id}
                href={n.link || "#"}
                className={`block px-4 py-2 hover:bg-muted ${n.read ? "" : "font-bold"}`}
              >
                {n.message}
                <span className="block text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export function AppSidebar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
      console.log("[AppSidebar EFFECT] Auth State Update:", { isLoading, userId: user?.id });
  }, [isLoading, user]);

  const userProfileUrl = '/profile';

  const handleLogoutClick = () => {
    logout();
  };

  const baseBg = "bg-green-100";
  const baseText = "text-green-900";
  const hoverBg = "hover:bg-green-200";
  const hoverText = "hover:text-green-950";
  const specialBg = "bg-green-600";
  const specialText = "text-white";
  const borderColor = "border-green-200";

  const displayItems = !isLoading
    ? allMenuItems.filter(item =>
        item.requiresLogin === null ||
        (item.requiresLogin === true && !!user)
      )
    : [];

  return (
    <Sidebar className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out font-[Geist]",
        baseBg, baseText
    )}>
        <SidebarHeader className={cn("p-4 md:p-6 border-b", borderColor)}>
            <Link href={"/listings"} className="text-2xl font-semibold tracking-tight text-green-950 hover:opacity-80 transition-opacity">
                Surplus<span className="text-green-600">.</span>
            </Link>
            <NotificationBell />
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto py-4 md:py-6">
            <SidebarMenu className="space-y-2 md:space-y-3 px-3 md:px-4">
                {isLoading ? (
                    <MenuSkeletons />
                ) : (
                    displayItems.length > 0 ? displayItems.map((item) => (
                        <SidebarMenuItem key={item.title} className="group">
                            <SidebarMenuButton
                                asChild
                                className={cn(
                                    "text-base md:text-lg font-medium py-2.5 md:py-3 px-4 transition-all duration-200 hover:scale-[1.01] w-full",
                                    item.isSpecial
                                    ? `${specialBg} ${specialText} rounded-lg shadow-sm hover:bg-green-700`
                                    : `${baseText} ${hoverBg} ${hoverText} rounded-md`
                                )}
                            >
                                <Link href={item.url} className="flex items-center gap-3">
                                    <item.icon className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                                    <span className="flex-grow text-left">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">No menu items to display.</div>
                    )
                )}
            </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className={cn("border-t p-3 md:p-4", borderColor)}>
            {isLoading ? (
                <FooterSkeleton />
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="group w-full">
                            <SidebarMenuButton
                                className={cn(
                                    "w-full flex justify-between items-center text-base md:text-lg py-2 px-3 transition-colors duration-200 rounded-md",
                                    baseText, hoverBg, hoverText
                                )}
                                aria-label="Account options"
                            >
                                <div className="flex items-center gap-3 truncate">
                                    {user && user.avatar ? (
                                        <Avatar className="h-8 w-8 border">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback className="text-xs">
                                                {user.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <User className="h-5 w-5 flex-shrink-0" />
                                    )}
                                    <span className="truncate font-medium">{user ? user.name : "Account"}</span>
                                </div>
                                <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0" />
                            </SidebarMenuButton>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 mb-2 animate-in slide-in-from-bottom-2 fade-in-20 bg-popover text-popover-foreground font-[Geist]"
                        align="end"
                        side="top"
                        sideOffset={8}
                    >
                        {user ? (
                            <>
                                <DropdownMenuLabel className="px-3 py-1.5 text-sm font-semibold text-muted-foreground">
                                    {user.name}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="text-base py-2 px-3 cursor-pointer hover:bg-accent">
                                    <Link href={userProfileUrl}><User className="mr-2 h-4 w-4"/> My Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="text-base py-2 px-3 cursor-pointer hover:bg-accent">
                                    <Link href="/settings"><Settings className="mr-2 h-4 w-4"/> Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="text-base py-2 px-3 cursor-pointer hover:bg-accent">
                                    <Link href="/subscription"><FileText className="mr-2 h-4 w-4"/> Subscription</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogoutClick}
                                    className="text-base py-2 px-3 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground hover:bg-destructive/10"
                                >
                                    <LogOut className="mr-2 h-4 w-4" /> Log out
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <>
                                <DropdownMenuItem asChild className="text-base py-2 px-3 cursor-pointer hover:bg-accent">
                                    <Link href="/log-in"><LogIn className="mr-2 h-4 w-4"/> Log In</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="text-base py-2 px-3 cursor-pointer hover:bg-accent">
                                    <Link href="/sign-up"><User className="mr-2 h-4 w-4"/> Sign Up</Link>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </SidebarFooter>
    </Sidebar>
  );
}