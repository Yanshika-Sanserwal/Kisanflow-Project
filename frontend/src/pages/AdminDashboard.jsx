
import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API_URL = "http://127.0.0.1:8000";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [centres, setCentres] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [congestion, setCongestion] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // LOAD ALL ADMIN DATA
  // =========================================

  const loadAdminData = async () => {
    try {
      setError("");

      const [
        dashboardResponse,
        farmersResponse,
        centresResponse,
        tokensResponse,
        congestionResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/admin/dashboard`),
        axios.get(`${API_URL}/admin/farmers`),
        axios.get(`${API_URL}/admin/centres`),
        axios.get(`${API_URL}/admin/tokens`),
        axios.get(`${API_URL}/congestion`),
      ]);

      setDashboard(dashboardResponse.data);
      setFarmers(farmersResponse.data || []);
      setCentres(centresResponse.data || []);
      setTokens(tokensResponse.data || []);
      setCongestion(congestionResponse.data);

      setLoading(false);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load admin dashboard."
      );

      setLoading(false);
    }
  };

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    loadAdminData();
  }, []);

  // =========================================
  // AUTO REFRESH
  // =========================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadAdminData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // =========================================
  // STATUS FORMATTER
  // =========================================

  const formatStatus = (status) => {
    if (status === "waiting") {
      return "⏳ Waiting";
    }

    if (status === "in_progress") {
      return "▶ In Progress";
    }

    if (status === "completed") {
      return "✅ Completed";
    }

    return status;
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <h2>Loading Admin Dashboard...</h2>
          <p>Please wait while system data is loading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="admin-header">
        <div>
          <h1>🛡️ Admin Dashboard</h1>

          <p>
            Monitor farmers, procurement centres,
            bookings, tokens and queue activity.
          </p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={loadAdminData}
        >
          🔄 Refresh
        </button>
      </div>

      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="admin-error">
          ❌ {error}
        </div>
      )}

      {/* =====================================
          MAIN STATISTICS
      ====================================== */}

      <div className="admin-stats-grid">

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            👨‍🌾
          </div>

          <div>
            <p>Total Farmers</p>

            <h2>
              {dashboard?.total_farmers ?? 0}
            </h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            🏢
          </div>

          <div>
            <p>Procurement Centres</p>

            <h2>
              {dashboard?.total_centres ?? 0}
            </h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            📅
          </div>

          <div>
            <p>Total Bookings</p>

            <h2>
              {dashboard?.total_bookings ?? 0}
            </h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            🎫
          </div>

          <div>
            <p>Total Tokens</p>

            <h2>
              {dashboard?.total_tokens ?? 0}
            </h2>
          </div>
        </div>

      </div>

      {/* =====================================
          TOKEN STATUS STATS
      ====================================== */}

      <div className="admin-status-grid">

        <div className="admin-status-card">
          <h3>⏳ Waiting</h3>

          <h2>
            {dashboard?.waiting_tokens ?? 0}
          </h2>
        </div>

        <div className="admin-status-card">
          <h3>▶ In Progress</h3>

          <h2>
            {dashboard?.in_progress_tokens ?? 0}
          </h2>
        </div>

        <div className="admin-status-card">
          <h3>✅ Completed</h3>

          <h2>
            {dashboard?.completed_tokens ?? 0}
          </h2>
        </div>

        <div className="admin-status-card">
          <h3>🚦 Congestion</h3>

          <h2>
            {congestion?.congestion_level || "Unknown"}
          </h2>

          <p>
            Queue Size: {congestion?.queue_size ?? 0}
          </p>
        </div>

      </div>

      {/* =====================================
          LIVE TOKEN MONITOR
      ====================================== */}

      <section className="admin-section">

        <div className="admin-section-header">
          <div>
            <h2>📋 Token Monitor</h2>

            <p>
              Monitor all procurement tokens.
            </p>
          </div>
        </div>

        {tokens.length === 0 ? (
          <div className="admin-empty">
            <div>🎫</div>

            <h3>No tokens found</h3>

            <p>
              Token activity will appear here.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Token No</th>
                  <th>Slot ID</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {tokens.map((token) => (
                  <tr key={token.id}>

                    <td>
                      {token.id}
                    </td>

                    <td>
                      <strong>
                        {token.token_number}
                      </strong>
                    </td>

                    <td>
                      {token.slot_id}
                    </td>

                    <td>
                      {formatStatus(
                        token.status
                      )}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* =====================================
          FARMERS
      ====================================== */}

      <section className="admin-section">

        <div className="admin-section-header">
          <div>
            <h2>👨‍🌾 Registered Farmers</h2>

            <p>
              View all farmer records.
            </p>
          </div>
        </div>

        {farmers.length === 0 ? (
          <div className="admin-empty">
            <div>👨‍🌾</div>

            <h3>No farmers found</h3>
          </div>
        ) : (
          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Village</th>
                  <th>Crop</th>
                </tr>
              </thead>

              <tbody>

                {farmers.map((farmer) => (
                  <tr key={farmer.id}>

                    <td>
                      {farmer.id}
                    </td>

                    <td>
                      <strong>
                        {farmer.name}
                      </strong>
                    </td>

                    <td>
                      {farmer.mobile}
                    </td>

                    <td>
                      {farmer.village}
                    </td>

                    <td>
                      {farmer.crop_type}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* =====================================
          PROCUREMENT CENTRES
      ====================================== */}

      <section className="admin-section">

        <div className="admin-section-header">
          <div>
            <h2>🏢 Procurement Centres</h2>

            <p>
              Monitor registered procurement centres.
            </p>
          </div>
        </div>

        {centres.length === 0 ? (
          <div className="admin-empty">
            <div>🏢</div>

            <h3>No centres found</h3>
          </div>
        ) : (
          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Centre Name</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Contact</th>
                </tr>
              </thead>

              <tbody>

                {centres.map((centre) => (
                  <tr key={centre.id}>

                    <td>
                      {centre.id}
                    </td>

                    <td>
                      <strong>
                        {centre.name}
                      </strong>
                    </td>

                    <td>
                      {centre.location}
                    </td>

                    <td>
                      {centre.capacity_per_day}
                    </td>

                    <td>
                      {centre.contact_number}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

export default AdminDashboard;

