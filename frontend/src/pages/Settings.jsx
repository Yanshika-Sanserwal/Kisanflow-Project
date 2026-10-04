import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import translations from "./translations";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  // =========================================
  // LANGUAGE
  // =========================================

  const [language, setLanguage] = useState(
    localStorage.getItem("language") ||
      "English"
  );

  // =========================================
  // NOTIFICATIONS
  // =========================================

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(
      localStorage.getItem(
        "notificationsEnabled"
      ) !== "false"
    );

  const t =
    translations[language] ||
    translations.English;

  // =========================================
  // LANGUAGE CHANGE
  // =========================================

  const handleLanguageChange = (e) => {
    const newLanguage =
      e.target.value;

    localStorage.setItem(
      "language",
      newLanguage
    );

    setLanguage(newLanguage);

    window.dispatchEvent(
      new Event("languageChanged")
    );
  };

  // =========================================
  // NOTIFICATION CHANGE
  // =========================================

  const handleNotificationChange = (
    e
  ) => {
    const enabled =
      e.target.checked;

    setNotificationsEnabled(
      enabled
    );

    localStorage.setItem(
      "notificationsEnabled",
      String(enabled)
    );

    window.dispatchEvent(
      new Event(
        "notificationSettingsChanged"
      )
    );
  };

  // =========================================
  // LISTEN FOR SETTINGS CHANGES
  // =========================================

  useEffect(() => {
    const updateSettings = () => {
      const savedLanguage =
        localStorage.getItem(
          "language"
        ) || "English";

      setLanguage(
        translations[savedLanguage]
          ? savedLanguage
          : "English"
      );

      const savedNotifications =
        localStorage.getItem(
          "notificationsEnabled"
        );

      setNotificationsEnabled(
        savedNotifications !==
          "false"
      );
    };

    window.addEventListener(
      "languageChanged",
      updateSettings
    );

    window.addEventListener(
      "notificationSettingsChanged",
      updateSettings
    );

    window.addEventListener(
      "storage",
      updateSettings
    );

    return () => {
      window.removeEventListener(
        "languageChanged",
        updateSettings
      );

      window.removeEventListener(
        "notificationSettingsChanged",
        updateSettings
      );

      window.removeEventListener(
        "storage",
        updateSettings
      );
    };
  }, []);

  // =========================================
  // LANGUAGE OPTIONS
  // =========================================

  const languages = [
    {
      value: "English",
      label: "English",
    },
    {
      value: "Hindi",
      label: "हिंदी",
    },
    {
      value: "Punjabi",
      label: "ਪੰਜਾਬੀ",
    },
  ];

  return (
    <div className="settings-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="settings-header">

        <button
          className="settings-back-button"
          onClick={() =>
            navigate("/")
          }
        >
          ←
        </button>

        <div>
          <h1>
            {t.settingsTitle ||
              "Settings"}
          </h1>

          <p>
            {t.selectLanguage ||
              "Manage your preferences"}
          </p>
        </div>

      </div>

      {/* =====================================
          ACCOUNT
      ====================================== */}

      <div className="settings-section">

        <div className="settings-section-title">
          <h2>
            {t.account ||
              "Account"}
          </h2>
        </div>

        <div className="settings-card">

          <div className="settings-row">

            <div className="settings-row-left">

              <div className="settings-icon">
                👤
              </div>

              <div>
                <h3>
                  {t.profile ||
                    "Profile"}
                </h3>

                <p>
                  {t.farmerInformation ||
                    "View your farmer information"}
                </p>
              </div>

            </div>

            <button
              className="settings-action-button"
              onClick={() =>
                navigate(
                  "/farmer-profile"
                )
              }
            >
              {t.viewDetails ||
                "View"}
            </button>

          </div>

        </div>

      </div>

      {/* =====================================
          PREFERENCES
      ====================================== */}

      <div className="settings-section">

        <div className="settings-section-title">

          <h2>
            {t.preferences ||
              "Preferences"}
          </h2>

        </div>

        <div className="settings-card">

          {/* LANGUAGE */}

          <div className="settings-row">

            <div className="settings-row-left">

              <div className="settings-icon">
                🌐
              </div>

              <div>

                <h3>
                  {t.appLanguage ||
                    "App Language"}
                </h3>

                <p>
                  {t.selectLanguage ||
                    "Select your preferred language"}
                </p>

              </div>

            </div>

            <select
              className="language-select"
              value={language}
              onChange={
                handleLanguageChange
              }
            >
              {languages.map(
                (item) => (
                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

          </div>

          {/* NOTIFICATIONS */}

          <div className="settings-row">

            <div className="settings-row-left">

              <div className="settings-icon">
                🔔
              </div>

              <div>

                <h3>
                  {t.notificationsSettings ||
                    "Notifications"}
                </h3>

                <p>
                  {t.enableNotifications ||
                    "Receive procurement and queue updates"}
                </p>

              </div>

            </div>

            <label className="toggle-switch">

              <input
                type="checkbox"
                checked={
                  notificationsEnabled
                }
                onChange={
                  handleNotificationChange
                }
              />

              <span className="toggle-slider"></span>

            </label>

          </div>

        </div>

      </div>

      {/* =====================================
          LANGUAGE STATUS
      ====================================== */}

      <div className="language-status">

        <span>
          🌐
        </span>

        <div>

          <strong>
            {t.language ||
              "Language"}
          </strong>

          <p>
            {
              languages.find(
                (item) =>
                  item.value ===
                  language
              )?.label ||
              "English"
            }
          </p>

        </div>

      </div>

      {/* =====================================
          NOTIFICATION STATUS
      ====================================== */}

      <div
        className="language-status"
        style={{
          marginTop: "12px",
        }}
      >

        <span>
          🔔
        </span>

        <div>

          <strong>
            Notifications
          </strong>

          <p>
            {notificationsEnabled
              ? "Enabled"
              : "Disabled"}
          </p>

        </div>

      </div>

    </div>
  );
}

export default Settings;