
import { createContext, useCallback, useRef, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import logoUrl from "../resources/assets/logo_dark.png";
import { Recipe } from "./api/generated/models/Recipe";
import { LeaguePicker } from "./components/ui/LeaguePicker";
import { TwoColumnLayout } from "./components/ui/TwoColumnLayout";
import { ExchangeRateProvider } from "./context/ExchangeRateContext";
import { LeagueProvider } from "./context/LeagueContext";
import { RateLimitContext } from "./context/RateLimitContext";
import CreateRecipePage from "./pages/CreateRecipePage";
import RecipesListPage from "./pages/RecipesListPage";

export const RecipesListRefetchContext = createContext<(() => void) | null>(null);
export const RecipeEditContext = createContext<{ selectedRecipe: Recipe | null; setSelectedRecipe: (recipe: Recipe | null) => void } | null>(null);




function App() {
  const refetchFn = useRef<() => void>(() => { });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | undefined>(undefined);
  const rateLimitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRateLimit = useCallback((message?: string) => {
    setRateLimited(true);
    setRateLimitMessage(message);
    if (rateLimitTimer.current) clearTimeout(rateLimitTimer.current);
    rateLimitTimer.current = setTimeout(() => { setRateLimited(false); setRateLimitMessage(undefined); }, 15000);
  }, []);

  return (
    <LeagueProvider>
      <ExchangeRateProvider>
        <RateLimitContext.Provider value={{ triggerRateLimit }}>
          <RecipeEditContext.Provider value={{ selectedRecipe, setSelectedRecipe }}>
            <RecipesListRefetchContext.Provider value={() => refetchFn.current()}>
              <nav className="nav-bar">
                <NavLink to="/" end className="flex items-center self-stretch px-4 lg:px-6 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <img src={logoUrl} alt="PoE Cook" className="h-16 w-auto" />
                </NavLink>
                <NavLink to="/" end className="nav-link">Recipes</NavLink>
                <NavLink to="/create" className="nav-link">Create Recipe</NavLink>
                <div className="ml-auto self-stretch">
                  <LeaguePicker />
                </div>
              </nav>
              {rateLimited && (
                <div
                  data-testid="rate-limit-banner"
                  className="flex items-center justify-between px-4 pt-2 pb-2 mb-4 text-sm bg-yellow-100 border-b border-yellow-300 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200"
                >
                  <span>⚠ {rateLimitMessage ?? "You are being rate limited by Path of Exile servers. Please slow down your requests."}</span>
                  <button
                    onClick={() => setRateLimited(false)}
                    className="text-yellow-700 dark:text-yellow-300 hover:underline text-xs shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <Routes>
                <Route
                  path="/"
                  element={
                    <TwoColumnLayout
                      left={<RecipesListPage refetchRef={refetchFn} />}
                      right={<CreateRecipePage />}
                    />
                  }
                />
                <Route path="/create" element={<CreateRecipePage />} />
              </Routes>
            </RecipesListRefetchContext.Provider>
          </RecipeEditContext.Provider>
        </RateLimitContext.Provider>
      </ExchangeRateProvider>
    </LeagueProvider>
  );
}

export default App;
