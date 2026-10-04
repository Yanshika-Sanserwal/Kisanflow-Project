import { useEffect, useState } from "react";
import translations from "./translations";
import API_URL from "../services/api";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const t =
    translations[language] ||
    translations.English;

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(
          `${WS_URL}/ws`
        );

        socket.onopen = () => {
          console.log(
            "Alerts WebSocket connected"
          );

          setConnected(true);
        };

        socket.onmessage = (event) => {
          console.log(
            "Alert received:",
            event.data
          );

          setAlerts((prev) => [
            {
              id:
                Date.now() +
                Math.random(),

              message:
                event.data,

              time:
                new Date().toLocaleTimeString(),

              type: "queue",
            },

            ...prev,
          ]);
        };

        socket.onerror = (error) => {
          console.error(
            "WebSocket error:",
            error
          );

          setConnected(false);
        };

        socket.onclose = () => {
          console.log(
            "Alerts WebSocket disconnected"
          );

          setConnected(false);

          // Try to reconnect after 5 seconds
          reconnectTimer =
            setTimeout(() => {
              connectWebSocket();
            }, 5000);
        };
      } catch (error) {
        console.error(
          "Alert WebSocket error:",
          error
        );

        setConnected(false);
      }
    };

    connectWebSocket();

    // ========================================
    // LANGUAGE CHANGE
    // ========================================

    const handleLanguageChange = () => {
      const savedLanguage =
        localStorage.getItem(
          "language"
        ) || "English";

      setLanguage(
        translations[savedLanguage]
          ? savedLanguage
          : "English"
      );
    };

    window.addEventListener(
      "languageChanged",
      handleLanguageChange
    );

    window.addEventListener(
      "storage",
      handleLanguageChange
    );

    return () => {
      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer
        );
      }

      if (socket) {
        socket.close();
      }

      window.removeEventListener(
        "languageChanged",
        handleLanguageChange
      );

      window.removeEventListener(
        "storage",
        handleLanguageChange
      );
    };
  }, []);

  // ========================================
  // CLEAR ALERTS
  // ========================================

  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <div
      style={{
        padding: "30px",
        backgroundColor:
          "#f5f7fb",
        minHeight: "100vh",
      }}
    >

      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <div
        style={{
          marginBottom: "25px",
        }}
      >
        <h1
          style={{
            color: "#2e7d32",
            margin: 0,
            fontSize: "30px",
          }}
        >
          🔔{" "}
          {t.alerts ||
            "Alerts"}
        </h1>

        <p
          style={{
            color: "#666",
            marginTop: "8px",
            fontSize: "15px",
          }}
        >
          Stay updated with
          real-time procurement
          and queue notifications.
        </p>
      </div>

      {/* =====================================
          CONNECTION STATUS
      ====================================== */}

      <div
        style={{
          background:
            connected
              ? "#e8f5e9"
              : "#ffebee",

          borderLeft:
            connected
              ? "5px solid #2e7d32"
              : "5px solid #c62828",

          padding: "14px 18px",

          borderRadius: "10px",

          marginBottom: "20px",

          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap: "10px",

          flexWrap: "wrap",
        }}
      >
        <div>
          <strong
            style={{
              color:
                connected
                  ? "#2e7d32"
                  : "#c62828",
            }}
          >
            {connected
              ? "🟢 Live Connection"
              : "🔴 Connection Lost"}
          </strong>

          <p
            style={{
              margin:
                "4px 0 0",
              color: "#666",
              fontSize: "13px",
            }}
          >
            {connected
              ? "Real-time queue notifications are active."
              : "Trying to reconnect to the notification service..."}
          </p>
        </div>
      </div>

      {/* =====================================
          ALERT SUMMARY
      ====================================== */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",

          gap: "15px",

          marginBottom: "25px",
        }}
      >

        {/* TOTAL NOTIFICATIONS */}

        <div
          style={{
            background:
              "#ffffff",

            padding:
              "20px",

            borderRadius:
              "12px",

            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "26px",
            }}
          >
            🔔
          </div>

          <h2
            style={{
              margin:
                "8px 0 3px",

              color:
                "#2e7d32",
            }}
          >
            {
              alerts.length
            }
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            Total Notifications
          </p>
        </div>

        {/* CONNECTION */}

        <div
          style={{
            background:
              "#ffffff",

            padding:
              "20px",

            borderRadius:
              "12px",

            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "26px",
            }}
          >
            📡
          </div>

          <h2
            style={{
              margin:
                "8px 0 3px",

              color:
                connected
                  ? "#2e7d32"
                  : "#c62828",
            }}
          >
            {connected
              ? "Live"
              : "Offline"}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            Real-Time Connection
          </p>
        </div>
      </div>

      {/* =====================================
          NOTIFICATIONS PANEL
      ====================================== */}

      <div
        style={{
          background:
            "#ffffff",

          padding:
            "22px",

          borderRadius:
            "14px",

          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >

        {/* PANEL HEADER */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            marginBottom:
              "20px",

            gap: "15px",

            flexWrap:
              "wrap",
          }}
        >
          <div>
            <h2
              style={{
                color:
                  "#2e7d32",

                margin: 0,
              }}
            >
              📢 Notifications
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",

                color:
                  "#888",

                fontSize:
                  "13px",
              }}
            >
              Live updates from
              KisanFlow
            </p>
          </div>

          {alerts.length > 0 && (
            <button
              onClick={
                clearAlerts
              }
              style={{
                border:
                  "1px solid #ddd",

                background:
                  "#ffffff",

                color:
                  "#555",

                padding:
                  "8px 14px",

                borderRadius:
                  "8px",

                cursor:
                  "pointer",

                fontWeight:
                  "600",
              }}
            >
              🧹 Clear All
            </button>
          )}
        </div>

        {/* =====================================
            EMPTY STATE
        ====================================== */}

        {alerts.length ===
        0 ? (
          <div
            style={{
              padding:
                "45px 20px",

              textAlign:
                "center",

              background:
                "#f5f7fb",

              borderRadius:
                "10px",
            }}
          >
            <div
              style={{
                fontSize:
                  "45px",

                marginBottom:
                  "10px",
              }}
            >
              🔕
            </div>

            <h3
              style={{
                margin:
                  "5px 0",

                color:
                  "#333",
              }}
            >
              No alerts yet
            </h3>

            <p
              style={{
                color:
                  "#777",

                margin:
                  "8px 0 0",

                maxWidth:
                  "500px",

                marginLeft:
                  "auto",

                marginRight:
                  "auto",
              }}
            >
              You will receive
              live notifications
              when there are
              updates to your
              procurement queue.
            </p>
          </div>
        ) : (

          /* =====================================
             ALERT LIST
          ====================================== */

          alerts.map(
            (alert, index) => (
              <div
                key={
                  alert.id ||
                  index
                }
                style={{
                  display:
                    "flex",

                  alignItems:
                    "flex-start",

                  gap: "15px",

                  padding:
                    "16px",

                  marginBottom:
                    "12px",

                  border:
                    index === 0
                      ? "1px solid #c8e6c9"
                      : "1px solid #e0e0e0",

                  borderRadius:
                    "10px",

                  background:
                    index === 0
                      ? "#f1f8e9"
                      : "#fafafa",
                }}
              >

                {/* ICON */}

                <div
                  style={{
                    width:
                      "42px",

                    height:
                      "42px",

                    borderRadius:
                      "50%",

                    background:
                      "#e8f5e9",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "21px",

                    flexShrink:
                      0,
                  }}
                >
                  🔔
                </div>

                {/* MESSAGE */}

                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "center",

                      gap:
                        "10px",

                      flexWrap:
                        "wrap",
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#2e7d32",
                      }}
                    >
                      Queue Update
                    </strong>

                    <span
                      style={{
                        color:
                          "#999",

                        fontSize:
                          "12px",
                      }}
                    >
                      🕐{" "}
                      {
                        alert.time
                      }
                    </span>
                  </div>

                  <p
                    style={{
                      margin:
                        "6px 0 0",

                      color:
                        "#555",

                      lineHeight:
                        "1.5",
                    }}
                  >
                    {
                      alert.message
                    }
                  </p>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

export default Alerts;