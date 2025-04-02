import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import CreateGoalModal from "./CreateGoalModal";
import { useAuth } from "@/lib/auth";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Close mobile sidebar when route changes
    setSidebarOpen(false);
  }, [location]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header 
        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
        onOpenGoalModal={() => setGoalModalOpen(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav onOpenGoalModal={() => setGoalModalOpen(true)} />
      
      <CreateGoalModal 
        isOpen={isGoalModalOpen} 
        onClose={() => setGoalModalOpen(false)} 
      />
    </div>
  );
};

export default Layout;
