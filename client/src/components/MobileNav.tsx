import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onOpenGoalModal: () => void;
}

const MobileNav = ({ onOpenGoalModal }: MobileNavProps) => {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Goals", href: "/goals", icon: "flag" },
    { name: "Profile", href: "/profile", icon: "account_circle" },
    { name: "Insights", href: "/insights", icon: "insights" },
  ];

  return (
    <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-10">
      <div className="grid grid-cols-5 h-16">
        {navigation.slice(0, 2).map((item, index) => (
          <Link 
            key={index}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center",
              location === item.href ? "text-primary" : "text-gray-500"
            )}
          >
            <span className="material-icons text-xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
        
        <button 
          onClick={onOpenGoalModal}
          className="flex flex-col items-center justify-center"
        >
          <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center text-white">
            <span className="material-icons">add</span>
          </div>
        </button>
        
        {navigation.slice(2).map((item, index) => (
          <Link 
            key={index + 2}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center",
              location === item.href ? "text-primary" : "text-gray-500"
            )}
          >
            <span className="material-icons text-xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
