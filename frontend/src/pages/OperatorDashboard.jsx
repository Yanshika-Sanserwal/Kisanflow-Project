
import { useEffect, useState } from "react";
import axios from "axios";
import "./OperatorDashboard.css";

const API_URL = "http://127.0.0.1:8000";

function OperatorDashboard() {
  const [queue, setQueue] = useState([]);
  const [activities, setActivities] = useState([]);
  const [centres, setCentres] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [connectionStatus, setConnectionStatus] =
    useState("Connecting...");

  // =========================================
  // LOAD QUEUE
  // =========================================

  const loadQueue = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/queue`,
        {
          params: {
            time: Date.now(),
          },
        }
      );

      console.log("Fresh Queue:", response.data);

      setQueue(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error(
        "Error loading queue:",
        error
      );

      setLoading(false);
    }
  };

  // =========================================
  // LOAD PROCUREMENT CENTRES
  // =========================================

  const loadCentres = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/centres`
      );

      console.log(
        "Centres:",
        response.data
      );

      setCentres(response.data || []);
    } catch (error) {
      console.error(
        "Error loading centres:",
        error
      );
    }
  };

  // =========================================
  // INITIAL DATA
  // =========================================

  useEffect(() => {
    loadQueue();
    loadCentres();
  }, []);

  // =========================================
  // AUTO REFRESH
  // =========================================

  useEffect(() => {
    const interval = setInterval(() => {
      loadQueue();
      loadCentres();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================
  // WEBSOCKET
  // =========================================

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(
          "ws://127.0.0.1:8000/ws"
        );

        socket.onopen = () => {
          console.log(
            "Operator WebSocket connected"
          );

          setConnectionStatus("Live");
        };

        socket.onmessage = (event) => {
          console.log(
            "Live update:",
            event.data
          );

          const newActivity = {
            message: event.data,
            time: new Date(),
          };

          setActivities((prev) => [
            newActivity,
            ...prev,
          ].slice(0, 5));

          // Refresh queue immediately
          loadQueue();

          // Refresh centre statistics
          loadCentres();
        };

        socket.onerror = (error) => {
          console.error(
            "WebSocket error:",
            error
          );

          setConnectionStatus("Offline");
        };

        socket.onclose = () => {
          console.log(
            "Operator WebSocket disconnected"
          );

          setConnectionStatus("Offline");

          reconnectTimer = setTimeout(() => {
            setConnectionStatus(
              "Connecting..."
            );

            connectWebSocket();
          }, 5000);
        };
      } catch (error) {
        console.error(
          "WebSocket connection error:",
          error
        );

        setConnectionStatus("Offline");
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer
        );
      }

      if (socket) {
        socket.close();
      }
    };
  }, []);

  // =========================================
  // DASHBOARD CALCULATIONS
  // =========================================

  const totalTokens = queue.length;

  const waitingTokens = queue.filter(
    (token) =>
      token.status === "waiting"
  ).length;

  const inProgressTokens = queue.filter(
    (token) =>
      token.status === "in_progress"
  ).length;

  const completedTokens = queue.filter(
    (token) =>
      token.status === "completed"
  ).length;

  const farmersServed = completedTokens;

  // =========================================
  // ACTIVE QUEUE
  // =========================================

  const activeQueue = queue.filter(
    (token) =>
      token.status === "waiting" ||
      token.status === "in_progress"
  );

  // =========================================
  // AVERAGE WAIT TIME
  // =========================================

  const averageWaitTime =
    activeQueue.length > 0
      ? `${activeQueue.length * 10} min`
      : "0 min";

  // =========================================
  // ACTIVE CENTRE
  // =========================================

  const activeCentre =
    centres.length > 0
      ? centres[0].name
      : "No Centre";

  // =========================================
  // PROCESSED TOKENS
  // =========================================

  const processedTokens =
    totalTokens;

  // =========================================
  // START TOKEN
  // =========================================

  const startToken = async (tokenId) => {
    if (actionLoading) {
      return;
    }

    try {
      setActionLoading(tokenId);

      await axios.put(
        `${API_URL}/tokens/${tokenId}/start`
      );

      await loadQueue();

      setActivities((prev) => [
        {
          message: "Token started successfully",
          time: new Date(),
        },
        ...prev,
      ].slice(0, 5));
    } catch (error) {
      console.error(
        "Error starting token:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Unable to start token."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================
  // COMPLETE TOKEN
  // =========================================

  const completeToken = async (tokenId) => {
    if (actionLoading) {
      return;
    }

    try {
      setActionLoading(tokenId);

      const response = await axios.put(
        `${API_URL}/tokens/${tokenId}/complete`
      );

      console.log(
        "Token completed:",
        response.data
      );

      await loadQueue();

      setActivities((prev) => [
        {
          message: `Token ${response.data.token} completed`,
          time: new Date(),
        },
        ...prev,
      ].slice(0, 5));
    } catch (error) {
      console.error(
        "Error completing token:",
        error
      );

      alert(
        error.response?.data?.detail ||
          "Unable to complete token."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================
  // LOADING SCREEN
  // =========================================

  if (loading) {
    return (
      <div className="operator-dashboard">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h2>
            Loading Operator Dashboard...
          </h2>

          <p>
            Please wait while queue data
            is being loaded.
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="operator-dashboard">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="operator-header">

        <div>
          <h1>
            👨‍💼 Operator Dashboard
          </h1>

          <p>
            Monitor procurement activity
            and manage the live queue.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "20px",
            background:
              connectionStatus === "Live"
                ? "#e8f5e9"
                : "#fff3e0",
            color:
              connectionStatus === "Live"
                ? "#2e7d32"
                : "#ef6c00",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          {connectionStatus === "Live"
            ? "🟢"
            : "🟠"}

          {connectionStatus}
        </div>

      </div>

      {/* =====================================
          MAIN STATISTICS
      ====================================== */}

      <div className="operator-stats">

        <div className="operator-stat-card">

          <div className="operator-stat-icon">
            📊
          </div>

          <div>
            <p>Total Tokens</p>
            <h2>
              {totalTokens}
            </h2>
          </div>

        </div>

        <div className="operator-stat-card">

          <div className="operator-stat-icon">
            ⏳
          </div>

          <div>
            <p>Waiting</p>
            <h2>
              {waitingTokens}
            </h2>
          </div>

        </div>

        <div className="operator-stat-card">

          <div className="operator-stat-icon">
            ▶
          </div>

          <div>
            <p>In Progress</p>
            <h2>
              {inProgressTokens}
            </h2>
          </div>

        </div>

        <div className="operator-stat-card">

          <div className="operator-stat-icon">
            ✅
          </div>

          <div>
            <p>Completed</p>
            <h2>
              {completedTokens}
            </h2>
          </div>

        </div>

      </div>

      {/* =====================================
          RECENT ACTIVITY
      ====================================== */}

      <div className="operator-activity">

        <h2>
          🔔 Recent Activity
        </h2>

        {activities.length === 0 ? (

          <p
            style={{
              color: "#777",
            }}
          >
            No recent activity.
          </p>

        ) : (

          activities.map(
            (activity, index) => (

              <div
                className="activity-item"
                key={index}
              >

                <strong>
                  🔔{" "}
                  {activity.message}
                </strong>

                <small
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#9ca3af",
                  }}
                >
                  {activity.time.toLocaleTimeString()}
                </small>

              </div>

            )
          )

        )}

      </div>

      {/* =====================================
          SECONDARY STATISTICS
      ====================================== */}

      <div className="operator-secondary-stats">

        <div className="operator-secondary-card">

          <h3>
            👨‍🌾 Farmers Served
          </h3>

          <h2>
            {farmersServed}
          </h2>

        </div>

        <div className="operator-secondary-card">

          <h3>
            ⏱ Avg Wait Time
          </h3>

          <h2>
            {averageWaitTime}
          </h2>

        </div>

        <div className="operator-secondary-card">

          <h3>
            🏢 Active Centre
          </h3>

          <h2>
            {activeCentre}
          </h2>

        </div>

        <div className="operator-secondary-card">

          <h3>
            🎫 Processed Tokens
          </h3>

          <h2>
            {processedTokens}
          </h2>

        </div>

      </div>

      {/* =====================================
          LIVE QUEUE
      ====================================== */}

      <div className="operator-queue-section">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >

          <h2>
            📋 Live Queue
          </h2>

          <button
            onClick={loadQueue}
            style={{
              border: "none",
              background: "#e8f5e9",
              color: "#2e7d32",
              padding:
                "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            🔄 Refresh
          </button>

        </div>

        {activeQueue.length === 0 ? (

          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#777",
            }}
          >

            <div
              style={{
                fontSize: "40px",
                marginBottom: "10px",
              }}
            >
              🎉
            </div>

            <h3>
              No active tokens
            </h3>

            <p>
              The procurement queue is
              currently clear.
            </p>

          </div>

        ) : (

          <div className="operator-table-container">

            <table className="operator-table">

              <thead>

                <tr>
                  <th>
                    Token No
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>
                </tr>

              </thead>

              <tbody>

                {activeQueue.map(
                  (token) => (

                    <tr
                      key={token.id}
                    >

                      <td>
                        <strong>
                          {token.token_number}
                        </strong>
                      </td>

                      <td>

                        {token.status ===
                        "waiting" ? (

                          <span>
                            ⏳ Waiting
                          </span>

                        ) : (

                          <span>
                            ▶ In Progress
                          </span>

                        )}

                      </td>

                      <td>

                        {token.status ===
                          "waiting" && (

                          <button
                            className="operator-start-button"
                            disabled={
                              actionLoading !==
                              null
                            }
                            onClick={() =>
                              startToken(
                                token.id
                              )
                            }
                          >
                            {actionLoading ===
                            token.id
                              ? "Starting..."
                              : "▶ Start"}
                          </button>

                        )}

                        {token.status ===
                          "in_progress" && (

                          <button
                            className="operator-complete-button"
                            disabled={
                              actionLoading !==
                              null
                            }
                            onClick={() =>
                              completeToken(
                                token.id
                              )
                            }
                          >
                            {actionLoading ===
                            token.id
                              ? "Completing..."
                              : "✅ Complete"}
                          </button>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default OperatorDashboard;

