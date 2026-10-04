import { useNavigate } from "react-router-dom";
import "./RoleSelection.css";

function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="role-selection-page">

      <div className="role-selection-container">

        <div className="role-header">
          <h1>🌾 KisanFlow</h1>

          <p>
            Smart Procurement Queue Management System
          </p>

          <h2>Choose Your Role</h2>
        </div>

        <div className="role-grid">

          {/* Farmer */}

          <div
            className="role-card"
            onClick={() => navigate("/farmer")}
          >
            <div className="role-icon">
              👨‍🌾
            </div>

            <h2>Farmer Portal</h2>

            <p>
              Book procurement slots, track queue position,
              view ETA and receive notifications.
            </p>

            <button className="role-button">
              Enter Farmer Portal →
            </button>
          </div>

          {/* Operator */}

          <div
            className="role-card"
            onClick={() => navigate("/operator")}
          >
            <div className="role-icon">
              👨‍💼
            </div>

            <h2>Operator Portal</h2>

            <p>
              Manage procurement queues, start tokens,
              complete visits and monitor activities.
            </p>

            <button className="role-button">
              Enter Operator Portal →
            </button>
          </div>

          {/* Admin */}

          <div
            className="role-card"
            onClick={() => navigate("/admin")}
          >
            <div className="role-icon">
              🛡️
            </div>

            <h2>Admin Portal</h2>

            <p>
              Monitor centres, view analytics, track
              performance and manage the entire system.
            </p>

            <button className="role-button">
              Enter Admin Portal →
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default RoleSelection;