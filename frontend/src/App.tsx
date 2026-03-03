
import { Link, Route, Routes, useLocation } from "react-router-dom";
import CreateRecipePage from "./pages/CreateRecipePage";
import RecipesListPage from "./pages/RecipesListPage";
import { TwoColumnLayout } from "./components/ui/TwoColumnLayout";
import React, { createContext, useRef } from "react";

export const RecipesListRefetchContext = createContext<(() => void) | null>(null);




function App() {
  const refetchFn = useRef<() => void>(() => {});
  return (
    <RecipesListRefetchContext.Provider value={() => refetchFn.current()}>
      <nav className="nav-bar">
        <Link to="/" className="link">Recipes</Link>
        <Link to="/create" className="link">Create Recipe</Link>
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
  );
}

export default App;
