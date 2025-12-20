import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import TestStart from "./pages/TestStart";
import TestRunner from "./pages/TestRunner";
import TestResults from "./pages/TestResults";
import MiniTestRunner from "./pages/MiniTestRunner";
import MiniResults from "./pages/MiniResults";
import MiniSuite from "./pages/MiniSuite";
import ShadowTest from "./pages/ShadowTest";
import ArtistTest from "./pages/ArtistTest";
import ArchetypeTest from "./pages/ArchetypeTest";
import ArchetypePage from "./pages/ArchetypePage";
import ArchetypeDetail from "./pages/ArchetypeDetail";
import LoreEntryPage from "./pages/LoreEntryPage";
import LuminaryLore from "./pages/LuminaryLore";
import ShadowLore from "./pages/ShadowLore";
import ConstellationDashboard from "./pages/ConstellationDashboard";
import ArchetypeConstellation from "./pages/ArchetypeConstellation";
import Constellation from "./pages/constellation";
import DossierPrint from "./pages/DossierPrint";
import Archive from "./pages/Archive";
import AccessCodeLogin from "./pages/AccessCodeLogin";
import Access from "./pages/Access";
import Consent from "./pages/Consent";
import PilotCodeGen from "./pages/PilotCodeGen";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AccessCodeLogin />} />
<Route path="/access" element={<Access />} />
<Route path="/consent" element={<Consent />} />
<Route path="/pilot" element={<PilotCodeGen />} />

      <Route path="/mini/run" element={<MiniTestRunner />} />
<Route path="/mini/results" element={<MiniResults />} />
<Route path="/mini" element={<MiniSuite />} />
<Route path="/mini/shadow" element={<ShadowTest />} />
<Route path="/mini/artist" element={<ArtistTest />} />
<Route path="/archetype/test" element={<ArchetypeTest />} />
<Route path="/archetypes" element={<ArchetypePage />} />
<Route path="/archetypes/:id" element={<ArchetypeDetail />} />
<Route path="/lore/:tag" element={<LoreEntryPage />} />
<Route path="/lore/luminaries" element={<LuminaryLore />} />
<Route path="/lore/shadows" element={<ShadowLore />} />
<Route path="/constellation" element={<ConstellationDashboard />} />
<Route path="/archetypes/constellation" element={<ArchetypeConstellation />} />
<Route path="/constellation/view" element={<Constellation />} />
<Route path="/dossier/print" element={<DossierPrint />} />
<Route path="/archive" element={<Archive />} />

      <Route path="/" element={<Dashboard />} />
      <Route path="/start" element={<TestStart />} />
      <Route path="/run" element={<TestRunner />} />
      <Route path="/results" element={<TestResults />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
