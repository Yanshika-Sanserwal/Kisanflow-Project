import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import translations from "./translations";

function SmartRecommendation() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const [farmerInfo, setFarmerInfo] = useState(null);

  const t =
    translations[language] ||
    translations.English;

  // ==========================================
  // LOAD SAVED FARMER INFORMATION
  // ==========================================

  useEffect(() => {
    const loadFarmerInfo = () => {
      const savedInfo =
        localStorage.getItem("farmerCropInfo");

      console.log(
        "Saved farmer information:",
        savedInfo
      );

      if (savedInfo) {
        try {
          const parsedInfo = JSON.parse(savedInfo);

          console.log(
            "Parsed farmer information:",
            parsedInfo
          );

          setFarmerInfo(parsedInfo);
        } catch (error) {
          console.error(
            "Error reading farmer information:",
            error
          );

          setFarmerInfo(null);
        }
      }
    };

    loadFarmerInfo();

    // ========================================
    // LANGUAGE CHANGE
    // ========================================

    const updateLanguage = () => {
      const savedLanguage =
        localStorage.getItem("language") ||
        "English";

      if (translations[savedLanguage]) {
        setLanguage(savedLanguage);
      } else {
        setLanguage("English");
      }
    };

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

  // ==========================================
  // IF INFORMATION IS NOT FOUND
  // ==========================================

  if (!farmerInfo) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyCard}>

          <div style={styles.emptyIcon}>
            👨‍🌾
          </div>

          <h2>
            Farmer Information Not Found
          </h2>

          <p>
            Please enter your farmer information
            before getting recommendations.
          </p>

          <button
            style={styles.button}
            onClick={() =>
              navigate("/farmer-info")
            }
          >
            Enter Farmer Information
          </button>

        </div>
      </div>
    );
  }

  // ==========================================
  // SMART RECOMMENDATION PAGE
  // ==========================================

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>

          <h1 style={styles.title}>
            🌾{" "}
            {t.smartRecommendation ||
              "Smart Recommendation"}
          </h1>

          <p style={styles.subtitle}>
            Based on your farmer and crop
            information, we have prepared your
            procurement recommendation.
          </p>

        </div>

        {/* ====================================
            FARMER INFORMATION
        ==================================== */}

        <div style={styles.card}>

          <h2>
            👤 Farmer Information
          </h2>

          <div style={styles.infoGrid}>

            <div style={styles.infoItem}>
              <span>Name</span>

              <strong>
                {farmerInfo.name}
              </strong>
            </div>

            <div style={styles.infoItem}>
              <span>Mobile Number</span>

              <strong>
                {farmerInfo.mobile}
              </strong>
            </div>

            <div style={styles.infoItem}>
              <span>Village / Location</span>

              <strong>
                {farmerInfo.village}
              </strong>
            </div>

          </div>

        </div>

        {/* ====================================
            CROP INFORMATION
        ==================================== */}

        <div style={styles.card}>

          <h2>
            🌾 Crop Information
          </h2>

          <div style={styles.infoGrid}>

            <div style={styles.infoItem}>
              <span>Crop</span>

              <strong>
                {farmerInfo.cropType}
              </strong>
            </div>

            <div style={styles.infoItem}>
              <span>Quantity</span>

              <strong>
                {farmerInfo.quantity} Quintal
              </strong>
            </div>

            <div style={styles.infoItem}>
              <span>Procurement Date</span>

              <strong>
                {farmerInfo.date}
              </strong>
            </div>

          </div>

        </div>

        {/* ====================================
            SMART RECOMMENDATION
        ==================================== */}

        <div style={styles.recommendationCard}>

          <div style={styles.recommendationHeader}>

            <div style={styles.robotIcon}>
              🤖
            </div>

            <div>

              <h2>
                Smart Recommendation
              </h2>

              <p>
                We recommend checking procurement
                centres with lower queue congestion.
              </p>

            </div>

          </div>

          <div style={styles.recommendationBox}>

            <h3>
              📍 Recommended Next Step
            </h3>

            <p>
              Find a suitable procurement centre
              for your selected crop and preferred
              procurement date.
            </p>

          </div>

          <button
            style={styles.button}
            onClick={() =>
              navigate("/procurement-centres")
            }
          >
            Find Procurement Centres →
          </button>

        </div>

        {/* ====================================
            EDIT INFORMATION
        ==================================== */}

        <button
          style={styles.editButton}
          onClick={() =>
            navigate("/farmer-info")
          }
        >
          ✏️ Edit Farmer Information
        </button>

      </div>

    </div>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "25px",
  },

  title: {
    color: "#2e7d32",
    marginBottom: "8px",
  },

  subtitle: {
    color: "#666",
    fontSize: "16px",
  },

  card: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.08)",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  infoItem: {
    background: "#f5f9f5",
    padding: "16px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  recommendationCard: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.08)",
  },

  recommendationHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  robotIcon: {
    fontSize: "45px",
  },

  recommendationBox: {
    background: "#eef8ef",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px",
  },

  button: {
    marginTop: "20px",
    padding: "13px 22px",
    background: "#2e7d32",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  },

  editButton: {
    marginTop: "20px",
    padding: "11px 20px",
    background: "#ffffff",
    color: "#2e7d32",
    border: "1px solid #2e7d32",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },

  emptyCard: {
    background: "#ffffff",
    maxWidth: "500px",
    margin: "100px auto",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.08)",
  },

  emptyIcon: {
    fontSize: "50px",
    marginBottom: "15px",
  },

};

export default SmartRecommendation;