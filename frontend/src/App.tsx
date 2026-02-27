import { Link, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CreateRecipePage from "./pages/CreateRecipePage";
import RecipesListPage from "./pages/RecipesListPage";

function App() {
  return (
    <Router>
      <nav className="nav-bar">
        <Link to="/" className="link">Recipes</Link>
        <Link to="/create" className="link">Create Recipe</Link>
      </nav>
      <Routes>
        <Route path="/" element={<RecipesListPage />} />
        <Route path="/create" element={<CreateRecipePage />} />
      </Routes>
    </Router>
  );
}

export default App;
