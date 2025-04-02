import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import Dashboard from "@/pages/Dashboard";
import Goals from "@/pages/Goals";
import GoalDetails from "@/pages/GoalDetails";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/lib/auth";

function App() {
  const [location] = useLocation();
  const isAuthPage = location === "/login" || location === "/register";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isAuthPage ? (
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route component={NotFound} />
          </Switch>
        ) : (
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/goals" component={Goals} />
              <Route path="/goals/:id" component={GoalDetails} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
