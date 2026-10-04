import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";
import translations from "./translations";
import API_URL from "../services/api";
const WS_URL = API_URL.replace(/^http/, "ws");

function FarmerDashboard() {
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [eta, setEta] = useState(null);
  const [liveMessage, setLiveMessage] = useState("");

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const [myTokenId, setMyTokenId] = useState(() => {
    const savedTokenId =
      localStorage.getItem("myTokenId");

    return savedTokenId
      ? Number(savedTokenId)
      : null;
  });

  const [myBooking, setMyBooking] = useState(() => {
    const savedBooking =
      localStorage.getItem("myBooking");

    if (!savedBooking) {
      return null;
    }

    try {
      return JSON.parse(savedBooking);
    } catch (error) {
      console.error(
        "Error reading booking:",
        error
      );

      return null;
    }
  });

  const t =
    translations[language] ||
    translations.English;

  // =========================================
  // LANGUAGE
  // =========================================

  useEffect(() => {
    const handleLanguageChange = () => {
      const newLanguage =
        localStorage.getItem("language") ||
        "English";

      setLanguage(
        translations[newLanguage]
          ? newLanguage
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

  // =========================================
  // BOOKING UPDATE
  // =========================================

  useEffect(() => {
    const updateBooking = () => {
      const savedBooking =
        localStorage.getItem("myBooking");

      if (!savedBooking) {
        setMyBooking(null);
        return;
      }

      try {
        setMyBooking(
          JSON.parse(savedBooking)
        );
      } catch (error) {
        console.error(
          "Error reading booking:",
          error
        );

        setMyBooking(null);
      }

      const savedTokenId =
        localStorage.getItem("myTokenId");

      setMyTokenId(
        savedTokenId
          ? Number(savedTokenId)
          : null
      );
    };

    updateBooking();

    window.addEventListener(
      "bookingUpdated",
      updateBooking
    );

    window.addEventListener(
      "storage",
      updateBooking
    );

    return () => {
      window.removeEventListener(
        "bookingUpdated",
        updateBooking
      );

      window.removeEventListener(
        "storage",
        updateBooking
      );
    };
  }, []);

  // =========================================
  // LOAD QUEUE
  // =========================================

  const loadQueue = async (
    tokenId = myTokenId
  ) => {
    try {
      const response =
        await axios.get(
          `${API_URL}/queue`,
          {
            params: {
              time: Date.now(),
            },
          }
        );

      console.log(
        "Fresh Queue:",
        response.data
      );

      const myToken =
        tokenId !== null &&
        tokenId !== undefined
          ? response.data.find(
              (token) =>
                Number(token.id) ===
                Number(tokenId)
            )
          : null;

      console.log(
        "My Token From Backend:",
        myToken
      );

      setQueue(
        response.data || []
      );
    } catch (error) {
      console.error(
        "Error loading queue:",
        error
      );
    }
  };

  // =========================================
  // LOAD ETA
  // =========================================

  const loadEta = async (
    tokenId
  ) => {
    if (!tokenId) {
      setEta(null);
      return;
    }

    try {
      const response =
        await axios.get(
          `${API_URL}/eta/${tokenId}`
        );

      console.log(
        "ETA from backend:",
        response.data
      );

      setEta(
        response.data
      );
    } catch (error) {
      console.error(
        "Error loading ETA:",
        error
      );

      setEta(null);
    }
  };

  // =========================================
  // ETA WHEN QUEUE CHANGES
  // =========================================

  useEffect(() => {
    if (myTokenId) {
      loadEta(myTokenId);
    } else {
      setEta(null);
    }
  }, [myTokenId, queue]);

  // =========================================
  // INITIAL QUEUE
  // =========================================

  useEffect(() => {
    loadQueue();
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
          `${WS_URL}/ws`
        );

        socket.onopen = () => {
          console.log(
            "Dashboard WebSocket connected"
          );
        };

        socket.onmessage = (
          event
        ) => {
          console.log(
            "Live update:",
            event.data
          );

          setLiveMessage(
            event.data
          );

          loadQueue();
        };

        socket.onerror = (
          error
        ) => {
          console.error(
            "WebSocket error:",
            error
          );
        };

        socket.onclose = () => {
          console.log(
            "Dashboard WebSocket disconnected"
          );

          reconnectTimer =
            setTimeout(() => {
              connectWebSocket();
            }, 5000);
        };
      } catch (error) {
        console.error(
          "WebSocket connection error:",
          error
        );
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
  // ACTIVE TOKEN
  // =========================================

  const activeToken =
    myTokenId
      ? queue.find(
          (token) =>
            Number(token.id) ===
            Number(myTokenId)
        ) || null
      : null;

  // =========================================
  // TOKEN STATUS
  // =========================================

  const getTokenStatus = () => {
    if (!activeToken) {
      return (
        t.noActiveToken ||
        "No Active Token"
      );
    }

    if (
      activeToken.status ===
      "in_progress"
    ) {
      return (
        t.inProgress ||
        "In Progress"
      );
    }

    if (
      activeToken.status ===
      "completed"
    ) {
      return (
        t.completed ||
        "Completed"
      );
    }

    return (
      t.waiting ||
      "Waiting"
    );
  };

  // =========================================
  // ACTIVE TOKEN COUNT
  // =========================================

  const activeQueueCount =
    queue.filter(
      (token) =>
        (token.status ===
          "waiting" ||
          token.status ===
            "in_progress") &&
        Number(token.id) ===
          Number(myTokenId)
    ).length;

  // =========================================
  // DASHBOARD
  // =========================================

  return (
    <div className="dashboard">

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="sidebar">

        <div className="logo">
          🌾{" "}
          <span>
            KisanFlow
          </span>
        </div>

        <div className="sidebar-menu">

          {/* DASHBOARD */}

          <div
            className="menu-item active"
            onClick={() =>
              navigate("/")
            }
          >
            📊{" "}
            <span>
              {t.dashboard}
            </span>
          </div>

          {/* PROCUREMENT CENTRES */}

          <div
            className="menu-item"
            onClick={() =>
              navigate(
                "/procurement-centres"
              )
            }
          >
            🏢{" "}
            <span>
              {t.centres}
            </span>
          </div>

          {/* SMART RECOMMENDATION */}

          <div
            className="menu-item"
            onClick={() =>
              navigate(
                "/smart-recommendation"
              )
            }
          >
            🧠{" "}
            <span>
              {
                t.smartRecommendation
              }
            </span>
          </div>

          {/* QUEUE */}

          <div
            className="menu-item"
            onClick={() =>
              navigate(
                "/queue-eta"
              )
            }
          >
            ⏱️{" "}
            <span>
              {t.queue}
            </span>
          </div>

          {/* MY PROCUREMENT */}

          <div
            className="menu-item"
            onClick={() =>
              navigate(
                "/my-procurement"
              )
            }
          >
            📦{" "}
            <span>
              {t.procurement}
            </span>
          </div>

          {/* ALERTS */}

          <div
            className="menu-item"
            onClick={() =>
              navigate(
                "/alerts"
              )
            }
          >
            🔔{" "}
            <span>
              {t.alerts}
            </span>
          </div>

          {/* SETTINGS */}

          <div
            className="menu-item"
            onClick={() =>
              navigate(
                "/settings"
              )
            }
          >
            ⚙️{" "}
            <span>
              {t.settings}
            </span>
          </div>

        </div>

        {/* SIDEBAR FOOTER */}

        <div className="sidebar-footer">

          <div
            className="farmer-profile"
            onClick={() =>
              navigate(
                "/farmer-profile"
              )
            }
            style={{
              cursor:
                "pointer",
            }}
          >

            <div className="farmer-avatar">
              👨‍🌾
            </div>

            <div className="farmer-details">

              <strong>
                {t.farmer}
              </strong>

              <small>
                {
                  t.kisanFlowUser
                }
              </small>

            </div>

          </div>

        </div>

      </aside>

      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="main-content">

        {/* HEADER */}

        <header className="top-header">

          <div>

            <h1>
              {t.greeting}
            </h1>

            <p>
              {t.subtitle}
            </p>

          </div>

          <div className="header-actions">

            <button
              onClick={() =>
                navigate(
                  "/alerts"
                )
              }
              style={{
                border:
                  "none",
                background:
                  "transparent",
                fontSize:
                  "20px",
                cursor:
                  "pointer",
              }}
            >
              🔔
            </button>

            <div className="language">
              🌐{" "}
              {language}
            </div>

          </div>

        </header>

        {/* =====================================
            LIVE UPDATE
        ====================================== */}

        {liveMessage && (
          <div
            style={{
              background:
                "#e8f5e9",
              color:
                "#2e7d32",
              padding:
                "10px 15px",
              borderRadius:
                "8px",
              marginBottom:
                "20px",
              fontSize:
                "14px",
            }}
          >
            🔄{" "}
            {liveMessage}
          </div>
        )}

        {/* =====================================
            STATS
        ====================================== */}

        <section className="stats-grid">

          {/* TOTAL BOOKINGS */}

          <div className="stat-card">

            <div className="stat-icon">
              📅
            </div>

            <div>

              <p>
                {
                  t.totalBookings
                }
              </p>

              <h2>
                {myBooking
                  ? 1
                  : 0}
              </h2>

              <span>
                {
                  t.allProcurementVisits
                }
              </span>

            </div>

          </div>

          {/* ACTIVE TOKEN */}

          <div className="stat-card">

            <div className="stat-icon">
              🎫
            </div>

            <div>

              <p>
                {
                  t.activeTokens
                }
              </p>

              <h2>
                {
                  activeQueueCount
                }
              </h2>

              <span>
                {
                  t.currentlyInQueue
                }
              </span>

            </div>

          </div>

          {/* ETA */}

          <div className="stat-card">

            <div className="stat-icon">
              ⏱️
            </div>

            <div>

              <p>
                {
                  t.averageETA
                }
              </p>

              <h2>

                {activeToken &&
                activeToken.status !==
                  "completed"
                  ? `${
                      eta?.estimated_wait_minutes ??
                      "--"
                    } ${
                      t.minutes ||
                      "min"
                    }`
                  : "--"}

              </h2>

              <span>
                {
                  t.estimatedWaitingTime
                }
              </span>

            </div>

          </div>

          {/* ALERTS */}

          <div
            className="stat-card"
            onClick={() =>
              navigate(
                "/alerts"
              )
            }
            style={{
              cursor:
                "pointer",
            }}
          >

            <div className="stat-icon">
              🔔
            </div>

            <div>

              <p>
                {t.alerts}
              </p>

              <h2>
                {t.view}
              </h2>

              <span>
                {
                  t.openNotifications
                }
              </span>

            </div>

          </div>

        </section>

        {/* =====================================
            CONTENT GRID
        ====================================== */}

        <section className="content-grid">

          {/* ===================================
              CURRENT TOKEN
          ==================================== */}

          <div className="content-card">

            <div className="card-header">

              <div>

                <h2>
                  🎫{" "}
                  {
                    t.currentToken
                  }
                </h2>

                <p>
                  {
                    t.activeProcurementVisit
                  }
                </p>

              </div>

              <span className="status-badge">
                {
                  getTokenStatus()
                }
              </span>

            </div>

            {/* TOKEN */}

            <div className="token-display">

              <span>
                {
                  t.tokenNumber
                }:
              </span>

              <strong>
                {activeToken
                  ? activeToken.token_number
                  : "--"}
              </strong>

            </div>

            {/* QUEUE INFO */}

            <div className="queue-info">

              <div>

                <span>
                  {
                    t.queuePosition
                  }:
                </span>

                <strong>

                  {activeToken &&
                  activeToken.status !==
                    "completed"
                    ? eta?.queue_position ??
                      "--"
                    : "--"}

                </strong>

              </div>

              <div>

                <span>
                  {
                    t.estimatedWait
                  }:
                </span>

                <strong>

                  {activeToken &&
                  activeToken.status !==
                    "completed"
                    ? `${
                        eta?.estimated_wait_minutes ??
                        "--"
                      } ${
                        t.minutes ||
                        "min"
                      }`
                    : "--"}

                </strong>

              </div>

            </div>

            {/* BOOKING DETAILS */}

            {myBooking && (
              <div
                style={{
                  marginTop:
                    "15px",
                  padding:
                    "12px",
                  background:
                    "#f5f7fb",
                  borderRadius:
                    "8px",
                }}
              >

                <p>

                  <strong>
                    {
                      t.procurementCentre ||
                      "Procurement Centre"
                    }:
                  </strong>{" "}

                  {
                    myBooking
                      .centre?.name ||
                    "--"
                  }

                </p>

                <p>

                  <strong>
                    {
                      t.bookingDate ||
                      "Date"
                    }:
                  </strong>{" "}

                  {
                    myBooking
                      .bookingDate ||
                    "--"
                  }

                </p>

                <p>

                  <strong>
                    {
                      t.slotTime ||
                      "Time"
                    }:
                  </strong>{" "}

                  {
                    myBooking
                      .slotTime ||
                    "--"
                  }

                </p>

              </div>
            )}

            {/* VIEW QUEUE */}

            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  "/queue-eta"
                )
              }
            >
              {
                t.viewLiveQueue
              }{" "}
              →
            </button>

          </div>

          {/* ===================================
              SMART RECOMMENDATION
          ==================================== */}

          <div className="content-card">

            <div className="card-header">

              <div>

                <h2>
                  🧠{" "}
                  {
                    t.smartRecommendation
                  }
                </h2>

                <p>
                  {
                    t.aiProcurementGuidance
                  }
                </p>

              </div>

            </div>

            <div className="recommendation">

              <div className="recommendation-icon">
                💡
              </div>

              <div>

                <strong>

                  {activeToken &&
                  activeToken.status !==
                    "completed"
                    ? t.planYourArrival
                    : t.procurementCompleted}

                </strong>

                <p>

                  {activeToken &&
                  activeToken.status !==
                    "completed"
                    ? `${t.basedOnQueue} ${
                        eta?.estimated_wait_minutes ??
                        "--"
                      } ${
                        t.minutes ||
                        "min"
                      }.`
                    : t.completedVisitMessage}

                </p>

              </div>

            </div>

            <button
              className="secondary-button"
              onClick={() =>
                navigate(
                  "/smart-recommendation"
                )
              }
            >
              {
                t.viewRecommendation
              }
            </button>

          </div>

        </section>

        {/* =====================================
            BOOKING SECTION
        ====================================== */}

        <section className="booking-section">

          <div className="section-title">

            <div>

              <h2>
                📅{" "}
                {t.bookSlot}
              </h2>

              <p>
                {
                  t.selectAvailableCentre
                }
              </p>

            </div>

          </div>

          {myBooking ? (

            <div className="slot-card">

              <div className="slot-info">

                <div className="slot-icon">
                  🏢
                </div>

                <div>

                  <h3>
                    {
                      myBooking
                        .centre?.name ||
                      "Procurement Centre"
                    }
                  </h3>

                  <p>

                    {
                      t.bookingDate ||
                      "Booking Date"
                    }:{" "}

                    {
                      myBooking
                        .bookingDate ||
                      "--"
                    }

                  </p>

                  <p>

                    {
                      t.slotTime ||
                      "Slot Time"
                    }:{" "}

                    {
                      myBooking
                        .slotTime ||
                      "--"
                    }

                  </p>

                  <small>

                    {
                      t.tokenNumber ||
                      "Token Number"
                    }:{" "}

                    {
                      myBooking
                        .tokenNumber ||
                      "--"
                    }

                  </small>

                </div>

              </div>

              <button
                className="primary-button slot-button"
                onClick={() =>
                  navigate(
                    "/queue-eta"
                  )
                }
              >
                {t.queue} →
              </button>

            </div>

          ) : (

            <div
              style={{
                background:
                  "#ffffff",
                padding:
                  "25px",
                borderRadius:
                  "12px",
                textAlign:
                  "center",
              }}
            >

              <div
                style={{
                  fontSize:
                    "40px",
                  marginBottom:
                    "10px",
                }}
              >
                📅
              </div>

              <h3>
                No active
                procurement
                booking
              </h3>

              <p
                style={{
                  color:
                    "#666",
                }}
              >
                Book a
                procurement
                slot to start
                tracking your
                visit.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  navigate(
                    "/procurement-centres"
                  )
                }
              >
                {
                  t.bookSlot
                }{" "}
                →
              </button>

            </div>

          )}

        </section>

        {/* =====================================
            QUICK ACTIONS
        ====================================== */}

        <section className="quick-section">

          <h2>
            {
              t.quickActions
            }
          </h2>

          <div className="quick-grid">

            {/* FIND CENTRE */}

            <button
              className="quick-card"
              onClick={() =>
                navigate(
                  "/procurement-centres"
                )
              }
            >

              <span>
                🏢
              </span>

              <strong>
                {
                  t.findCentre
                }
              </strong>

              <small>
                {
                  t.locateNearbyCentres
                }
              </small>

            </button>

            {/* BOOK SLOT */}

            <button
              className="quick-card"
              onClick={() =>
                navigate(
                  "/procurement-centres"
                )
              }
            >

              <span>
                📅
              </span>

              <strong>
                {
                  t.bookSlot
                }
              </strong>

              <small>
                {
                  t.reserveProcurementSlot
                }
              </small>

            </button>

            {/* MY TOKEN */}

            <button
              className="quick-card"
              onClick={() =>
                navigate(
                  "/my-procurement"
                )
              }
            >

              <span>
                🎫
              </span>

              <strong>
                {
                  t.myToken
                }
              </strong>

              <small>
                {
                  t.trackCurrentToken
                }
              </small>

            </button>

            {/* NOTIFICATIONS */}

            <button
              className="quick-card"
              onClick={() =>
                navigate(
                  "/alerts"
                )
              }
            >

              <span>
                🔔
              </span>

              <strong>
                {
                  t.notifications
                }
              </strong>

              <small>
                {
                  t.viewImportantAlerts
                }
              </small>

            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default FarmerDashboard;