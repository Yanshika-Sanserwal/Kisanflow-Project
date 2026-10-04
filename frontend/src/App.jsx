import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import FarmerDashboard from "./pages/FarmerDashboard";
import FarmerCropInfo from "./pages/FarmerCropInfo";
import ProcurementCentres from "./pages/ProcurementCentres";
import SmartRecommendation from "./pages/SmartRecommendation";
import QueueETA from "./pages/QueueETA";
import MyProcurement from "./pages/MyProcurement";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import OperatorDashboard from "./pages/OperatorDashboard";
import FarmerProfile from "./pages/FarmerProfile";
import AdminDashboard from "./pages/AdminDashboard";
import RoleSelection from "./pages/RoleSelection";

function App() {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(localStorage.getItem("language") || "English");
    };

    window.addEventListener("languageChanged", handleLanguageChange);

    return () => {
      window.removeEventListener(
        "languageChanged",
        handleLanguageChange
      );
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
        path="/"
        element={<RoleSelection />}
        />

        {/* Front Page - Farmer Dashboard */}
        <Route
          path="/farmer"
          element={<FarmerDashboard language={language} />}
        />

        {/* Farmer Information */}
        <Route
          path="/farmer-info"
          element={<FarmerCropInfo language={language} />}
        />

        {/* Procurement Centres */}
        <Route
          path="/procurement-centres"
          element={<ProcurementCentres language={language} />}
        />

        {/* Smart Recommendation */}
        <Route
          path="/smart-recommendation"
          element={<SmartRecommendation language={language} />}
        />

        {/* Queue & ETA */}
        <Route
          path="/queue-eta"
          element={<QueueETA language={language} />}
        />

        {/* My Procurement */}
        <Route
          path="/my-procurement"
          element={<MyProcurement language={language} />}
        />

        {/* Alerts */}
        <Route
          path="/alerts"
          element={<Alerts language={language} />}
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={<Settings language={language} />}
        />

        {/* Operator Portal */}
        <Route
          path="/operator"
          element={<OperatorDashboard language={language} />}
        />

        {/* Farmer Profile */}
        <Route
          path="/farmer-profile"
          element={<FarmerProfile language={language} />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;