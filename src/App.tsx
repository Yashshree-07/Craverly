import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/AppRoutes";
import { SupabaseAuthListener } from "./components/auth/SupabaseAuthListener";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseAuthListener />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;