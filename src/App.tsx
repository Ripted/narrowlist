import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import LevelPage from "./pages/LevelPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import PlayerPage from "./pages/PlayerPage";
import FutureListPage from "./pages/FutureListPage";
import ExtendedListPage from "./pages/ExtendedListPage";
import ExtraListPage from "./pages/ExtraListPage";
import RecentRunsPage from "./pages/RecentRunsPage";
import ComparePage from "./pages/ComparePage";
import SubmitLevelPage from "./pages/SubmitLevelPage";
import GuidePage from "./pages/GuidePage";
import ThemesPage from "./pages/ThemesPage";
import StatisticsPage from "./pages/StatisticsPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import WatchlistPage from "./pages/WatchlistPage";
import PacksPage from "./pages/PacksPage";
import HubPage from "./pages/HubPage";

import LevelRoulettePage from "./pages/LevelRoulettePage";
import RecentlyAddedPage from "./pages/RecentlyAddedPage";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<HubPage />} />
              <Route path="/hub" element={<HubPage />} />
              <Route path="/main" element={<Index />} />
              <Route path="/main-list" element={<Index />} />
              <Route path="/level/:levelId" element={<LevelPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/future-list" element={<FutureListPage />} />
              <Route path="/extended-list" element={<ExtendedListPage />} />
              <Route path="/extra-list" element={<ExtraListPage />} />
              <Route path="/recent" element={<RecentRunsPage />} />
              <Route path="/recently-added" element={<RecentlyAddedPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/submit" element={<SubmitLevelPage />} />
              <Route path="/guide" element={<GuidePage />} />
              <Route path="/themes" element={<ThemesPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/roulette" element={<LevelRoulettePage />} />
              <Route path="/packs" element={<PacksPage />} />
              <Route path="/packs/:packId" element={<PacksPage />} />
              <Route path="/player/:username" element={<PlayerPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;