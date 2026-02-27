import { Link, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CreateRecipePage from "./pages/CreateRecipePage";

function App() {
  return (
    <Router>
      <nav className="nav-bar">
        <Link to="/create" className="link">Create Recipe</Link>
      </nav>
      <Routes>
        <Route path="/create" element={<CreateRecipePage />} />
      </Routes>
    </Router>
  );
}

export default App;
