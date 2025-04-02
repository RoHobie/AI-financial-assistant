import { Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import NotificationItem from "./NotificationItem";

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenGoalModal: () => void;
}

const Header = ({ onToggleSidebar, onOpenGoalModal }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications.filter((notification: any) => !notification.read).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={onToggleSidebar}
            className="md:hidden mr-2 text-gray-600"
          >
            <span className="material-icons">menu</span>
          </button>
          <span className="material-icons text-primary mr-2">savings</span>
          <h1 className="text-xl font-bold text-gray-800">FinGoal Planner</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-10">
                <div className="p-3 border-b">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No notifications</p>
                  ) : (
                    notifications.map((notification: any) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImage} alt={user?.fullName} />
                  <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuItem 
                onClick={onOpenGoalModal}
                className="cursor-pointer"
              >
                <span className="material-icons mr-2 text-sm">add</span>
                Create New Goal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                <span className="material-icons mr-2 text-sm">logout</span>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
