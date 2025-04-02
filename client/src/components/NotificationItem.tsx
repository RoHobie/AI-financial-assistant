import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationItemProps {
  notification: {
    id: number;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  };
}

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const queryClient = useQueryClient();
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "goal_update":
        return "flag";
      case "insight":
        return "lightbulb";
      case "reminder":
        return "notifications";
      default:
        return "info";
    }
  };
  
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/notifications/${notification.id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
  
  const handleClick = () => {
    if (!notification.read) {
      markAsReadMutation.mutate();
    }
  };
  
  return (
    <div 
      className={cn(
        "p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer",
        !notification.read && "bg-blue-50"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <span className={cn(
            "material-icons",
            notification.type === "goal_update" ? "text-primary" :
            notification.type === "insight" ? "text-accent" :
            "text-warning"
          )}>
            {getTypeIcon(notification.type)}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <p className="font-medium text-sm">{notification.title}</p>
            <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
              {formatTime(notification.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
