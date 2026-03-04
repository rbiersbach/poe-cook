
import { createContext, useRef, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Recipe } from "./api/generated/models/Recipe";
import { DivineChaosRate } from "./components/item/DivineChaosRate";
import { LeaguePicker } from "./components/ui/LeaguePicker";
import { TwoColumnLayout } from "./components/ui/TwoColumnLayout";
import { ExchangeRateProvider } from "./context/ExchangeRateContext";
import { LeagueProvider } from "./context/LeagueContext";
import CreateRecipePage from "./pages/CreateRecipePage";
import RecipesListPage from "./pages/RecipesListPage";

export const RecipesListRefetchContext = createContext<(() => void) | null>(null);
export const RecipeEditContext = createContext<{ selectedRecipe: Recipe | null; setSelectedRecipe: (recipe: Recipe | null) => void } | null>(null);




function App() {
  const refetchFn = useRef<() => void>(() => { });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  return (
    <LeagueProvider>
      <ExchangeRateProvider>
        <RecipeEditContext.Provider value={{ selectedRecipe, setSelectedRecipe }}>
          <RecipesListRefetchContext.Provider value={() => refetchFn.current()}>
            <nav className="nav-bar">
              <Link to="/" className="link">Recipes</Link>
              <Link to="/create" className="link">Create Recipe</Link>
              <LeaguePicker />
              <DivineChaosRate />
            </nav>
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
      </ExchangeRateProvider>
    </LeagueProvider>
  );
}

export default App;
