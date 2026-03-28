import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Menu, X, Bell, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: notifications } = useListNotifications({
    query: { enabled: isAuthenticated }
  });
  
  const markRead = useMarkNotificationRead();

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleNotificationClick = (id: number) => {
    markRead.mutate({ id });
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin";
    if (user.role === "donator") return "/donator";
    return "/ngo";
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <HeartHandshake className="h-8 w-8 text-primary" />
              </div>
              <span className="font-display font-bold text-2xl text-primary hidden sm:block">
                Share<span className="text-secondary">Bite</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href={getDashboardLink()} className={`text-sm font-medium transition-colors ${location.startsWith(getDashboardLink()) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                  Dashboard
                </Link>
                
                {user?.role === "donator" && (
                  <Link href="/donator/new-donation">
                    <Button variant="outline" className="rounded-full border-primary/20 hover:bg-primary/5">
                      + New Donation
                    </Button>
                  </Link>
                )}
                
                {user?.role === "ngo" && user.status === "verified" && (
                  <Link href="/ngo/donations" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Find Food
                  </Link>
                )}

                {/* Notifications Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <Bell className="h-5 w-5 text-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden border-border/50 shadow-xl">
                    <div className="p-4 bg-muted/30 border-b border-border/50 flex justify-between items-center">
                      <h3 className="font-semibold text-primary">Notifications</h3>
                      <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">{unreadCount} new</Badge>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!notifications?.length ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => !notif.isRead && handleNotificationClick(notif.id)}
                            className={`p-4 border-b border-border/50 transition-colors cursor-pointer hover:bg-muted/50 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`text-sm font-medium ${!notif.isRead ? 'text-primary' : 'text-foreground'}`}>{notif.title}</h4>
                              {!notif.isRead && <div className="h-2 w-2 rounded-full bg-secondary flex-shrink-0 mt-1" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full gap-2 pl-2 pr-4 bg-muted/50 hover:bg-muted">
                      <div className="bg-primary/10 p-1.5 rounded-full">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[100px]">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                        <Badge variant="outline" className="mt-2 w-fit capitalize">{user.role}</Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer hover:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && (
               <Button variant="ghost" size="icon" className="relative rounded-full">
                 <Bell className="h-5 w-5 text-foreground" />
                 {unreadCount > 0 && (
                   <span className="absolute top-0 right-0 h-4 w-4 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                     {unreadCount}
                   </span>
                 )}
               </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border/50 px-4 py-6 space-y-4">
          {!isAuthenticated ? (
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button variant="outline" className="w-full rounded-xl">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="w-full rounded-xl bg-primary">Sign Up</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="bg-primary/10 p-2 rounded-full">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link href={getDashboardLink()}>
                  <Button variant="ghost" className="w-full justify-start text-left">Dashboard</Button>
                </Link>
                {user?.role === "donator" && (
                  <Link href="/donator/new-donation">
                    <Button variant="ghost" className="w-full justify-start text-left">New Donation</Button>
                  </Link>
                )}
                {user?.role === "ngo" && user.status === "verified" && (
                  <Link href="/ngo/donations">
                    <Button variant="ghost" className="w-full justify-start text-left">Find Food</Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full justify-start text-left text-destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
