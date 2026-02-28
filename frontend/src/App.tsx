
import { Link, Route, Routes, useLocation } from "react-router-dom";
import CreateRecipePage from "./pages/CreateRecipePage";
import RecipesListPage from "./pages/RecipesListPage";
import { TwoColumnLayout } from "./components/TwoColumnLayout";




function App() {
  return (
    <>
      <nav className="nav-bar">
        <Link to="/" className="link">Recipes</Link>
        <Link to="/create" className="link">Create Recipe</Link>
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <TwoColumnLayout
              left={<RecipesListPage />}
              right={<CreateRecipePage />}
              leftHidden={false}
              rightHidden={false}
            />
          }
        />
        <Route path="/create" element={<CreateRecipePage />} />
      </Routes>
    </>
  );
}

export default App;
