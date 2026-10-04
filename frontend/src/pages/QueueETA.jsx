import { useEffect, useState } from "react";
import axios from "axios";
import translations from "./translations";

function QueueETA() {
  const [queue, setQueue] = useState([]);
  const [myETA, setMyETA] = useState(null);
  const [myTokenStatus, setMyTokenStatus] = useState(null);
  const [arrivalGuidance, setArrivalGuidance] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const t =
    translations[language] ||
    translations.English;

  // ========================================
  // GET MY TOKEN ID
  // ========================================

  const getMyTokenId = () => {
    const savedTokenId =
      localStorage.getItem("myTokenId");

    if (savedTokenId) {
      return Number(savedTokenId);
    }

    const savedBooking =
      localStorage.getItem("myBooking");

    if (savedBooking) {
      try {
        const booking =
          JSON.parse(savedBooking);

        if (booking.tokenId) {
          return Number(
            booking.tokenId
          );
        }
      } catch (error) {
        console.error(
          "Error reading saved booking:",
          error
        );
      }
    }

    return null;
  };

  // ========================================
  // LANGUAGE CHANGE
  // ========================================

  useEffect(() => {
    const updateLanguage = () => {
      const savedLanguage =
        localStorage.getItem("language") ||
        "English";

      setLanguage(
        translations[savedLanguage]
          ? savedLanguage
          : "English"
      );
    };

    updateLanguage();

    window.addEventListener(
      "languageChanged",
      updateLanguage
    );

    window.addEventListener(
      "storage",
      updateLanguage
    );

    return () => {
      window.removeEventListener(
        "languageChanged",
        updateLanguage
      );

      window.removeEventListener(
        "storage",
        updateLanguage
      );
    };
  }, []);

  // ========================================
  // LOAD QUEUE
  // ========================================

  const loadQueue = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      // Get all queue tokens
      const queueResponse =
        await axios.get(
          "http://127.0.0.1:8000/queue",
          {
            params: {
              time: Date.now(),
            },
          }
        );

      const queueData =
        queueResponse.data || [];

      console.log(
        "Queue from backend:",
        queueData
      );

      setQueue(queueData);

      // Get current farmer token
      const tokenId =
        getMyTokenId();

      console.log(
        "My stored token ID:",
        tokenId
      );

      if (!tokenId) {
        setMyETA(null);
        setMyTokenStatus(null);
        setArrivalGuidance(null);
        return;
      }

      // Find farmer's token
      const myToken =
        queueData.find(
          (token) =>
            Number(token.id) ===
            Number(tokenId)
        );

      console.log(
        "My token:",
        myToken
      );

      // Token not found
      if (!myToken) {
        setMyETA(null);
        setMyTokenStatus(null);
        setArrivalGuidance(null);

        setErrorMessage(
          `Token ${tokenId} was not found in the backend queue.`
        );

        return;
      }

      // Save status
      setMyTokenStatus(
        myToken.status
      );

      // Completed token
      if (
        myToken.status ===
        "completed"
      ) {
        console.log(
          "My token is completed."
        );

        setMyETA(null);
        setArrivalGuidance(null);

        return;
      }

      // ========================================
      // GET ETA
      // ========================================

      const etaResponse =
        await axios.get(
          `http://127.0.0.1:8000/eta/${tokenId}`
        );

      console.log(
        "ETA from backend:",
        etaResponse.data
      );

      setMyETA(
        etaResponse.data
      );

      // ========================================
      // GET ARRIVAL GUIDANCE
      // ========================================

      const guidanceResponse =
        await axios.get(
          `http://127.0.0.1:8000/arrival-guidance/${tokenId}`
        );

      console.log(
        "Arrival guidance:",
        guidanceResponse.data
      );

      setArrivalGuidance(
        guidanceResponse.data
      );

    } catch (error) {
      console.error(
        "Error loading queue:",
        error
      );

      if (error.response) {
        setErrorMessage(
          error.response.data?.detail ||
            error.response.data?.error ||
            "Unable to load queue."
        );
      } else {
        setErrorMessage(
          "Unable to connect to the backend."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // INITIAL LOAD + AUTO REFRESH
  // ========================================

  useEffect(() => {
    loadQueue();

    const interval =
      setInterval(() => {
        loadQueue();
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // ACTIVE QUEUE
  // ========================================

  const activeQueue =
    queue.filter(
      (token) =>
        token.status ===
          "waiting" ||
        token.status ===
          "in_progress"
    );

  const waitingCount =
    activeQueue.filter(
      (token) =>
        token.status ===
        "waiting"
    ).length;

  const inProgressCount =
    activeQueue.filter(
      (token) =>
        token.status ===
        "in_progress"
    ).length;

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          backgroundColor:
            "#f5f7fb",
          minHeight: "100vh",
        }}
      >
        <h2>
          ⏳ Loading queue...
        </h2>
      </div>
    );
  }

  // ========================================
  // MAIN PAGE
  // ========================================

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
          HEADER
      ====================================== */}

      <div
        style={{
          marginBottom: "25px",
        }}
      >
        <h1
          style={{
            color: "#2e7d32",
            marginBottom: "8px",
          }}
        >
          ⏱️{" "}
          {t.queue ||
            "Queue & ETA"}
        </h1>

        <p
          style={{
            color: "#666",
          }}
        >
          Track your procurement queue
          and estimated waiting time.
        </p>
      </div>

      {/* =====================================
          ERROR
      ====================================== */}

      {errorMessage && (
        <div
          style={{
            background: "#fff3e0",
            borderLeft:
              "5px solid #ef6c00",
            padding: "15px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <strong>
            ⚠️ Queue Information
          </strong>

          <p
            style={{
              marginBottom: 0,
              color: "#555",
            }}
          >
            {errorMessage}
          </p>
        </div>
      )}

      {/* =====================================
          COMPLETED
      ====================================== */}

      {myTokenStatus ===
        "completed" && (
        <div
          style={{
            background:
              "#e8f5e9",
            padding: "20px",
            borderRadius:
              "14px",
            marginBottom:
              "20px",
            borderLeft:
              "5px solid #2e7d32",
          }}
        >
          <h2
            style={{
              color: "#2e7d32",
              marginTop: 0,
            }}
          >
            ✅ Procurement
            Completed
          </h2>

          <p
            style={{
              color: "#555",
              marginBottom: 0,
            }}
          >
            Your procurement visit
            has been completed.
            You can book a new slot
            whenever you are ready.
          </p>
        </div>
      )}

      {/* =====================================
          MY TOKEN
      ====================================== */}

      {myETA &&
      myTokenStatus !==
        "completed" ? (
        <div
          style={{
            background:
              "#ffffff",
            padding: "25px",
            borderRadius:
              "14px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
            marginBottom:
              "20px",
            borderLeft:
              "5px solid #2e7d32",
          }}
        >

          <h2
            style={{
              color: "#2e7d32",
              marginTop: 0,
            }}
          >
            🎫 My Current
            Token
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >

            {/* TOKEN NUMBER */}

            <div
              style={{
                background:
                  "#f1f8e9",
                padding: "18px",
                borderRadius:
                  "10px",
              }}
            >
              <p
                style={{
                  color: "#666",
                  margin: 0,
                }}
              >
                🎫 Token Number
              </p>

              <h2
                style={{
                  margin:
                    "8px 0 0",
                  color:
                    "#2e7d32",
                }}
              >
                {myETA.token_number}
              </h2>
            </div>

            {/* QUEUE POSITION */}

            <div
              style={{
                background:
                  "#f5f7fb",
                padding: "18px",
                borderRadius:
                  "10px",
              }}
            >
              <p
                style={{
                  color: "#666",
                  margin: 0,
                }}
              >
                👥 Queue Position
              </p>

              <h2
                style={{
                  margin:
                    "8px 0 0",
                  color:
                    "#2e7d32",
                }}
              >
                #
                {
                  myETA.queue_position
                }
              </h2>
            </div>

            {/* ETA */}

            <div
              style={{
                background:
                  "#e8f5e9",
                padding: "18px",
                borderRadius:
                  "10px",
              }}
            >
              <p
                style={{
                  color: "#666",
                  margin: 0,
                }}
              >
                ⏱️ Estimated Wait
              </p>

              <h2
                style={{
                  margin:
                    "8px 0 0",
                  color:
                    "#2e7d32",
                }}
              >
                {Math.round(
                  myETA.estimated_wait_minutes
                )}{" "}
                min
              </h2>
            </div>

          </div>

          {/* STATUS */}

          <div
            style={{
              marginTop:
                "18px",
              padding: "14px",
              background:
                myTokenStatus ===
                "in_progress"
                  ? "#e3f2fd"
                  : "#fff8e1",
              borderRadius:
                "8px",
            }}
          >
            {myTokenStatus ===
            "in_progress"
              ? "🟢 Your procurement is currently in progress."
              : "🟡 Your token is currently in the procurement queue."}
          </div>

        </div>
      ) : (
        myTokenStatus !==
          "completed" && (
          <div
            style={{
              background:
                "#ffffff",
              padding: "25px",
              borderRadius:
                "14px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom:
                "20px",
            }}
          >
            <h2>
              🎫 No Active Token
            </h2>

            <p
              style={{
                color: "#666",
              }}
            >
              Book a procurement
              slot to see your
              queue position.
            </p>
          </div>
        )
      )}

      {/* =====================================
          SMART ARRIVAL GUIDANCE
      ====================================== */}

      {arrivalGuidance &&
        myTokenStatus !==
          "completed" && (
          <div
            style={{
              background:
                "#ffffff",
              padding: "25px",
              borderRadius:
                "14px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom:
                "20px",
              borderLeft:
                "5px solid #1565c0",
            }}
          >

            <h2
              style={{
                color: "#1565c0",
                marginTop: 0,
              }}
            >
              🚶 Smart Arrival
              Guidance
            </h2>

            <p
              style={{
                color: "#666",
              }}
            >
              Based on your current
              queue position and
              estimated waiting time.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "15px",
                marginTop: "15px",
              }}
            >

              <div
                style={{
                  background:
                    "#e3f2fd",
                  padding: "18px",
                  borderRadius:
                    "10px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#666",
                  }}
                >
                  ⏱️ Current ETA
                </p>

                <h2
                  style={{
                    margin:
                      "8px 0 0",
                    color:
                      "#1565c0",
                  }}
                >
                  {Math.round(
                    arrivalGuidance.eta_minutes
                  )}{" "}
                  min
                </h2>
              </div>

              <div
                style={{
                  background:
                    "#f1f8e9",
                  padding: "18px",
                  borderRadius:
                    "10px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#666",
                  }}
                >
                  🕐 Suggested Action
                </p>

                <h3
                  style={{
                    margin:
                      "8px 0 0",
                    color:
                      "#2e7d32",
                  }}
                >
                  {arrivalGuidance
                    .recommended_leave_after_minutes >
                  0
                    ? `Plan arrival in ${
                        Math.round(
                          arrivalGuidance.recommended_leave_after_minutes
                        )
                      } min`
                    : "You can prepare to visit the centre"}
                </h3>
              </div>

            </div>

          </div>
        )}

      {/* =====================================
          QUEUE SUMMARY
      ====================================== */}

      <div
        style={{
          background:
            "#ffffff",
          padding: "20px",
          borderRadius:
            "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom:
            "20px",
        }}
      >

        <h2
          style={{
            color: "#2e7d32",
            marginBottom:
              "15px",
          }}
        >
          📊 Queue Summary
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
          }}
        >

          <div
            style={{
              background:
                "#f5f7fb",
              padding: "18px",
              borderRadius:
                "10px",
            }}
          >
            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              🎫 Active Tokens
            </p>

            <h2
              style={{
                margin:
                  "8px 0 0",
              }}
            >
              {
                activeQueue.length
              }
            </h2>
          </div>

          <div
            style={{
              background:
                "#f5f7fb",
              padding: "18px",
              borderRadius:
                "10px",
            }}
          >
            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              ⏳ Waiting
            </p>

            <h2
              style={{
                margin:
                  "8px 0 0",
              }}
            >
              {
                waitingCount
              }
            </h2>
          </div>

          <div
            style={{
              background:
                "#f5f7fb",
              padding: "18px",
              borderRadius:
                "10px",
            }}
          >
            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              ▶ In Progress
            </p>

            <h2
              style={{
                margin:
                  "8px 0 0",
              }}
            >
              {
                inProgressCount
              }
            </h2>
          </div>

        </div>

      </div>

      {/* =====================================
          LIVE QUEUE
      ====================================== */}

      <div
        style={{
          background:
            "#ffffff",
          padding: "20px",
          borderRadius:
            "12px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >

        <h2
          style={{
            color: "#2e7d32",
            marginBottom:
              "20px",
          }}
        >
          🎫 Live Queue
        </h2>

        {activeQueue.length ===
        0 ? (
          <p
            style={{
              color: "#666",
            }}
          >
            No active tokens
            in queue.
          </p>
        ) : (
          activeQueue.map(
            (token, index) => {
              const myTokenId =
                getMyTokenId();

              const isMyToken =
                myTokenId &&
                Number(myTokenId) ===
                  Number(token.id);

              return (
                <div
                  key={token.id}
                  style={{
                    border:
                      isMyToken
                        ? "2px solid #2e7d32"
                        : "1px solid #e0e0e0",
                    padding: "18px",
                    marginBottom:
                      "12px",
                    borderRadius:
                      "10px",
                    background:
                      isMyToken
                        ? "#f1f8e9"
                        : "#fafafa",
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
                      flexWrap:
                        "wrap",
                      gap: "10px",
                    }}
                  >

                    <div>

                      <h3
                        style={{
                          margin:
                            "0 0 8px",
                          color:
                            "#333",
                        }}
                      >
                        🎫 Token{" "}
                        {
                          token.token_number
                        }

                        {isMyToken && (
                          <span
                            style={{
                              marginLeft:
                                "10px",
                              color:
                                "#2e7d32",
                              fontSize:
                                "13px",
                            }}
                          >
                            ← Your Token
                          </span>
                        )}
                      </h3>

                      <p
                        style={{
                          margin:
                            "5px 0",
                        }}
                      >
                        <strong>
                          Queue Position:
                        </strong>{" "}
                        {index + 1}
                      </p>

                    </div>

                    <span
                      style={{
                        padding:
                          "7px 12px",
                        borderRadius:
                          "20px",
                        background:
                          token.status ===
                          "in_progress"
                            ? "#e3f2fd"
                            : "#fff3e0",
                        color:
                          token.status ===
                          "in_progress"
                            ? "#1565c0"
                            : "#ef6c00",
                        fontWeight:
                          "600",
                      }}
                    >
                      {token.status ===
                      "in_progress"
                        ? "▶ In Progress"
                        : "⏳ Waiting"}
                    </span>

                  </div>

                </div>
              );
            }
          )
        )}

      </div>

      {/* =====================================
          REFRESH BUTTON
      ====================================== */}

      <button
        onClick={loadQueue}
        style={{
          marginTop:
            "20px",
          padding:
            "12px 20px",
          background:
            "#2e7d32",
          color: "white",
          border: "none",
          borderRadius:
            "8px",
          cursor:
            "pointer",
        }}
      >
        🔄 Refresh Queue
      </button>

    </div>
  );
}

export default QueueETA;