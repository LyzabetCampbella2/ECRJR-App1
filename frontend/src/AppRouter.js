import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/dashboard";
import Results from "./pages/results";
import Constellation from "./pages/constellation";
import ArchetypeLore from "./pages/ArchetypeLore";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/lore/:name" element={<ArchetypeLore />} />
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/results" element={<Results />} />
        <Route path="/constellation" element={<Constellation />} />
      </Routes>
    </BrowserRouter>
  );
}
