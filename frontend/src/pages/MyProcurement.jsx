import { useEffect, useState } from "react";
import axios from "axios";
import translations from "./translations";
import API_URL from "../services/api";

function MyProcurement() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const t =
    translations[language] ||
    translations.English;

  // ========================================
  // LOAD PROCUREMENT
  // ========================================

  const loadProcurement = async () => {
    try {
      setLoading(true);

      const savedBooking =
        localStorage.getItem("myBooking");

      let centreId = 1;

      if (savedBooking) {
        try {
          const booking =
            JSON.parse(savedBooking);

          if (booking.centre?.id) {
            centreId = Number(
              booking.centre.id
            );
          }
        } catch (error) {
          console.error(
            "Error reading booking:",
            error
          );
        }
      }

      const response =
        await axios.get(
          `${API_URL}/my-procurement`,
          {
            params: {
              centre_id: centreId,
              time: Date.now(),
            },
          }
        );

      console.log(
        "My Procurement:",
        response.data
      );

      setTokens(
        response.data || []
      );
    } catch (error) {
      console.error(
        "Error loading procurement:",
        error
      );

      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // INITIAL LOAD + AUTO REFRESH
  // ========================================

  useEffect(() => {
    loadProcurement();

    const interval =
      setInterval(() => {
        loadProcurement();
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ========================================
  // LANGUAGE CHANGE
  // ========================================

  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage =
        localStorage.getItem("language") ||
        "English";

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
  // STATUS HELPERS
  // ========================================

  const getStatusText = (status) => {
    if (status === "completed") {
      return (
        t.completed ||
        "Completed"
      );
    }

    if (status === "in_progress") {
      return (
        t.inProgress ||
        "In Progress"
      );
    }

    return (
      t.waiting ||
      "Waiting"
    );
  };

  const getStatusIcon = (status) => {
    if (status === "completed") {
      return "✅";
    }

    if (status === "in_progress") {
      return "▶";
    }

    return "⏳";
  };

  const getStatusBackground = (
    status
  ) => {
    if (status === "completed") {
      return "#e8f5e9";
    }

    if (status === "in_progress") {
      return "#e3f2fd";
    }

    return "#fff3e0";
  };

  const getStatusColor = (status) => {
    if (status === "completed") {
      return "#2e7d32";
    }

    if (status === "in_progress") {
      return "#1565c0";
    }

    return "#ef6c00";
  };

  const getStatusMessage = (
    status
  ) => {
    if (status === "completed") {
      return "🎉 Procurement completed successfully.";
    }

    if (status === "in_progress") {
      return "🚜 Your procurement is currently being processed.";
    }

    return "⏳ Your token is currently waiting in the queue.";
  };

  // ========================================
  // SUMMARY COUNTS
  // ========================================

  const waitingCount =
    tokens.filter(
      (token) =>
        token.status === "waiting"
    ).length;

  const inProgressCount =
    tokens.filter(
      (token) =>
        token.status === "in_progress"
    ).length;

  const completedCount =
    tokens.filter(
      (token) =>
        token.status === "completed"
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
          ⏳ Loading procurement...
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
            margin: 0,
            fontSize: "30px",
          }}
        >
          📦{" "}
          {t.procurement ||
            "My Procurement"}
        </h1>

        <p
          style={{
            color: "#666",
            marginTop: "8px",
            fontSize: "15px",
          }}
        >
          View your procurement
          bookings, tokens and
          current status.
        </p>
      </div>

      {/* =====================================
          SUMMARY
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

        {/* TOTAL */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "25px",
            }}
          >
            📦
          </div>

          <h2
            style={{
              margin:
                "8px 0 3px",
              color: "#2e7d32",
            }}
          >
            {tokens.length}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            Total Records
          </p>
        </div>

        {/* WAITING */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "25px",
            }}
          >
            ⏳
          </div>

          <h2
            style={{
              margin:
                "8px 0 3px",
              color: "#ef6c00",
            }}
          >
            {waitingCount}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            Waiting
          </p>
        </div>

        {/* IN PROGRESS */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "25px",
            }}
          >
            🚜
          </div>

          <h2
            style={{
              margin:
                "8px 0 3px",
              color: "#1565c0",
            }}
          >
            {inProgressCount}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            In Progress
          </p>
        </div>

        {/* COMPLETED */}

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "25px",
            }}
          >
            ✅
          </div>

          <h2
            style={{
              margin:
                "8px 0 3px",
              color: "#2e7d32",
            }}
          >
            {completedCount}
          </h2>

          <p
            style={{
              margin: 0,
              color: "#777",
            }}
          >
            Completed
          </p>
        </div>
      </div>

      {/* =====================================
          NO RECORDS
      ====================================== */}

      {tokens.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            padding:
              "45px 25px",
            borderRadius:
              "14px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "12px",
            }}
          >
            📦
          </div>

          <h2
            style={{
              margin:
                "5px 0",
              color: "#333",
            }}
          >
            No Procurement
            Records
          </h2>

          <p
            style={{
              color: "#777",
              margin:
                "8px 0 0",
            }}
          >
            Your procurement
            bookings will appear
            here.
          </p>
        </div>
      ) : (

        /* =====================================
           PROCUREMENT RECORDS
        ====================================== */

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {tokens.map(
            (token) => (
              <div
                key={token.id}
                style={{
                  background:
                    "#ffffff",
                  padding:
                    "20px",
                  borderRadius:
                    "14px",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.07)",
                }}
              >

                {/* TOKEN HEADER */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "10px",
                    marginBottom:
                      "18px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color:
                        "#2e7d32",
                      fontSize:
                        "20px",
                    }}
                  >
                    🎫 Token{" "}
                    {
                      token.token_number
                    }
                  </h2>

                  <span
                    style={{
                      padding:
                        "6px 10px",
                      borderRadius:
                        "20px",
                      fontSize:
                        "12px",
                      fontWeight:
                        "600",
                      background:
                        getStatusBackground(
                          token.status
                        ),
                      color:
                        getStatusColor(
                          token.status
                        ),
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {
                      getStatusIcon(
                        token.status
                      )
                    }{" "}
                    {
                      getStatusText(
                        token.status
                      )
                    }
                  </span>
                </div>

                {/* PROCUREMENT DETAILS */}

                <div
                  style={{
                    background:
                      "#f5f7fb",
                    padding:
                      "15px",
                    borderRadius:
                      "10px",
                  }}
                >
                  <p
                    style={{
                      margin:
                        "9px 0",
                    }}
                  >
                    <strong>
                      🎫 Token Number:
                    </strong>{" "}
                    {
                      token.token_number
                    }
                  </p>

                  <p
                    style={{
                      margin:
                        "9px 0",
                    }}
                  >
                    <strong>
                      📅 Booking Date:
                    </strong>{" "}
                    {
                      token.booking_date
                    }
                  </p>

                  <p
                    style={{
                      margin:
                        "9px 0",
                    }}
                  >
                    <strong>
                      🕐 Slot Time:
                    </strong>{" "}
                    {
                      token.slot_time ||
                      "--"
                    }
                  </p>

                  <p
                    style={{
                      margin:
                        "9px 0",
                    }}
                  >
                    <strong>
                      🏢 Centre:
                    </strong>{" "}
                    Centre{" "}
                    {
                      token.centre_id
                    }
                  </p>
                </div>

                {/* STATUS MESSAGE */}

                <div
                  style={{
                    marginTop:
                      "15px",
                    padding:
                      "12px",
                    borderRadius:
                      "8px",
                    background:
                      getStatusBackground(
                        token.status
                      ),
                    color:
                      getStatusColor(
                        token.status
                      ),
                    fontSize:
                      "14px",
                  }}
                >
                  <strong>
                    {
                      getStatusMessage(
                        token.status
                      )
                    }
                  </strong>
                </div>

              </div>
            )
          )}
        </div>
      )}

      {/* =====================================
          REFRESH
      ====================================== */}

      <button
        onClick={
          loadProcurement
        }
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
        🔄 Refresh Procurement
      </button>

    </div>
  );
}

export default MyProcurement;