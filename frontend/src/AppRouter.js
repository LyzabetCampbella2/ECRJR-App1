// src/AppRouter.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Access / auth
import Access from "./pages/Access";
import AccessCodeLogin from "./pages/AccessCodeLogin";
import Consent from "./pages/Consent";

// Core
import Dashboard from "./pages/Dashboard";
import TestsHub from "./pages/TestsHub";
import TestStart from "./pages/TestStart";
import TestRunner from "./pages/TestRunner";
import TestResults from "./pages/TestResults";

// Mini suite
import MiniSuiteHub from "./pages/MiniSuiteHub";
import MiniSuite from "./pages/MiniSuite";
import MiniTestRunner from "./pages/MiniTestRunner";
import MiniResults from "./pages/MiniResults";
import MiniSuiteResults from "./pages/MiniSuiteResults";

// Major
import MajorTest from "./pages/MajorTest";
import MajorResults from "./pages/MajorResults";

// Archetypes / constellation
import ArchetypePage from "./pages/ArchetypePage";
import ArchetypeDetail from "./pages/ArchetypeDetail";
import ArchetypeResults from "./pages/ArchetypeResults";
import ArchetypeTest from "./pages/ArchetypeTest";
import ConstellationDashboard from "./pages/ConstellationDashboard";
import ConstellationPage from "./pages/ConstellationPage";

// Magic Library / Lore
import MagicLibraryPage from "./pages/MagicLibraryPage";
import LoreIndexPage from "./pages/LoreIndexPage";
import LoreEntriesPage from "./pages/LoreEntriesPage";
import LoreEntryViewPage from "./pages/LoreEntryViewPage";
import LoreEntryPage from "./pages/LoreEntryPage";
import PilotCodeGen from "./pages/PilotCodeGen";

// Luminary / Shadow
import LuminaryTest from "./pages/LuminaryTest";
import ShadowTest from "./pages/ShadowTest";
import LuminaryLore from "./pages/LuminaryLore";
import ShadowLore from "./pages/ShadowLore";

// Guard
import PilotRoute from "./components/PilotRoute";

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: 0 }}>Not Found</h2>
      <p style={{ opacity: 0.75 }}>That page doesn’t exist.</p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/pilot-codes" element={<PilotCodeGen />} />

      {/* Start */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public */}
      <Route path="/access" element={<Access />} />
      <Route path="/login" element={<AccessCodeLogin />} />
      <Route path="/consent" element={<Consent />} />

      {/* ✅ Magic Library + Lore (UNGARDED so it never flashes from PilotRoute) */}
      <Route path="/magic" element={<MagicLibraryPage />} />
      <Route path="/lore" element={<LoreIndexPage />} />
      <Route path="/lore/entries" element={<LoreEntriesPage />} />
      <Route path="/lore/entry/:id" element={<LoreEntryViewPage />} />
      {/* You already have LoreEntryPage — keep it if your old system uses it */}
      <Route path="/lore/edit/:id" element={<LoreEntryPage />} />

      {/* Guarded app */}
      <Route
        path="/dashboard"
        element={
          <PilotRoute>
            <Dashboard />
          </PilotRoute>
        }
      />

      {/* Tests */}
      <Route
        path="/tests"
        element={
          <PilotRoute>
            <TestsHub />
          </PilotRoute>
        }
      />
      <Route
        path="/test"
        element={
          <PilotRoute>
            <TestStart />
          </PilotRoute>
        }
      />
      <Route
        path="/test/start"
        element={
          <PilotRoute>
            <TestStart />
          </PilotRoute>
        }
      />
      <Route
        path="/test/:testId"
        element={
          <PilotRoute>
            <TestRunner />
          </PilotRoute>
        }
      />
      <Route
        path="/results"
        element={
          <PilotRoute>
            <TestResults />
          </PilotRoute>
        }
      />
      <Route
        path="/results/:attemptId"
        element={
          <PilotRoute>
            <TestResults />
          </PilotRoute>
        }
      />

      {/* Mini suite */}
      <Route
        path="/mini"
        element={
          <PilotRoute>
            <MiniSuiteHub />
          </PilotRoute>
        }
      />
      <Route
        path="/mini/suite"
        element={
          <PilotRoute>
            <MiniSuite />
          </PilotRoute>
        }
      />
      <Route
        path="/mini/run"
        element={
          <PilotRoute>
            <MiniTestRunner />
          </PilotRoute>
        }
      />
      <Route
        path="/mini/results"
        element={
          <PilotRoute>
            <MiniResults />
          </PilotRoute>
        }
      />
      <Route
        path="/mini/suite-results"
        element={
          <PilotRoute>
            <MiniSuiteResults />
          </PilotRoute>
        }
      />

      {/* Major */}
      <Route
        path="/major-test"
        element={
          <PilotRoute>
            <MajorTest />
          </PilotRoute>
        }
      />
      <Route
        path="/major-results"
        element={
          <PilotRoute>
            <MajorResults />
          </PilotRoute>
        }
      />

      {/* Archetypes + Constellation */}
      <Route
        path="/archetypes"
        element={
          <PilotRoute>
            <ArchetypePage />
          </PilotRoute>
        }
      />
      <Route
        path="/archetype/:id"
        element={
          <PilotRoute>
            <ArchetypeDetail />
          </PilotRoute>
        }
      />
      <Route
        path="/archetype-results"
        element={
          <PilotRoute>
            <ArchetypeResults />
          </PilotRoute>
        }
      />
      <Route
        path="/archetype-test"
        element={
          <PilotRoute>
            <ArchetypeTest />
          </PilotRoute>
        }
      />
      <Route
        path="/constellation"
        element={
          <PilotRoute>
            <ConstellationDashboard />
          </PilotRoute>
        }
      />
      <Route
        path="/constellation/map"
        element={
          <PilotRoute>
            <ConstellationPage />
          </PilotRoute>
        }
      />

      {/* Luminary / Shadow */}
      <Route
        path="/luminary-test"
        element={
          <PilotRoute>
            <LuminaryTest />
          </PilotRoute>
        }
      />
      <Route
        path="/shadow-test"
        element={
          <PilotRoute>
            <ShadowTest />
          </PilotRoute>
        }
      />
      <Route
        path="/luminary-lore"
        element={
          <PilotRoute>
            <LuminaryLore />
          </PilotRoute>
        }
      />
      <Route
        path="/shadow-lore"
        element={
          <PilotRoute>
            <ShadowLore />
          </PilotRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
