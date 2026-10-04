
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import translations from "./translations";
import "./FarmerCropInfo.css";

function FarmerCropInfo() {
  const navigate = useNavigate();

  // ==========================================
  // LANGUAGE
  // ==========================================

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const t =
    translations[language] ||
    translations.English;

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    village: "",
    cropType: "",
    quantity: "",
    date: "",
  });

  const [saving, setSaving] = useState(false);

  // ==========================================
  // LANGUAGE CHANGE
  // ==========================================

  useEffect(() => {
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

  // ==========================================
  // GENERAL INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // ==========================================
  // MOBILE NUMBER
  // ==========================================

  const handleMobileChange = (e) => {
    const numbersOnly =
      e.target.value.replace(/\D/g, "");

    const mobileNumber =
      numbersOnly.slice(0, 10);

    // First digit must be 7, 8 or 9
    if (
      mobileNumber.length > 0 &&
      !["7", "8", "9"].includes(
        mobileNumber[0]
      )
    ) {
      return;
    }

    setFormData((previousData) => ({
      ...previousData,
      mobile: mobileNumber,
    }));
  };

  // ==========================================
  // FORM SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ========================================
    // VALIDATE MOBILE NUMBER
    // ========================================

    if (
      formData.mobile.length !== 10 ||
      !/^[7-9][0-9]{9}$/.test(
        formData.mobile
      )
    ) {
      let message =
        "Please enter a valid 10-digit mobile number starting with 7, 8, or 9.";

      if (language === "Hindi") {
        message =
          "कृपया 7, 8 या 9 से शुरू होने वाला सही 10 अंकों का मोबाइल नंबर दर्ज करें।";
      }

      if (language === "Punjabi") {
        message =
          "ਕਿਰਪਾ ਕਰਕੇ 7, 8 ਜਾਂ 9 ਨਾਲ ਸ਼ੁਰੂ ਹੋਣ ਵਾਲਾ ਸਹੀ 10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ।";
      }

      alert(message);
      return;
    }

    // ========================================
    // START SAVING
    // ========================================

    try {
      setSaving(true);

      console.log(
        "================================="
      );

      console.log(
        "Submitting farmer information..."
      );

      console.log(
        "Form data:",
        formData
      );

      // ======================================
      // CREATE FARMER IN BACKEND
      // ======================================

      const response = await axios.post(
        "http://127.0.0.1:8000/farmers",
        {
          name: formData.name,
          mobile: formData.mobile,
          village: formData.village,
          crop_type: formData.cropType,
        }
      );

      console.log(
        "Backend farmer response:",
        response.data
      );

      // ======================================
      // GET FARMER ID
      // ======================================

      const farmerId =
        response.data.id;

      console.log(
        "New Farmer ID:",
        farmerId
      );

      // ======================================
      // CHECK FARMER ID
      // ======================================

      if (
        farmerId === undefined ||
        farmerId === null
      ) {
        console.error(
          "Backend did not return farmer ID."
        );

        alert(
          "Farmer was created, but the Farmer ID was not received."
        );

        return;
      }

      // ======================================
      // SAVE FARMER ID
      // ======================================

      localStorage.setItem(
        "farmerId",
        String(farmerId)
      );

      // ======================================
      // SAVE COMPLETE FARMER INFORMATION
      // ======================================

      localStorage.setItem(
        "farmerCropInfo",
        JSON.stringify(formData)
      );

      // ======================================
      // VERIFY LOCAL STORAGE
      // ======================================

      const savedFarmerId =
        localStorage.getItem(
          "farmerId"
        );

      console.log(
        "Saved Farmer ID:",
        savedFarmerId
      );

      // ======================================
      // EXTRA SAFETY CHECK
      // ======================================

      if (!savedFarmerId) {
        alert(
          "Farmer ID could not be saved. Please try again."
        );

        return;
      }

      console.log(
        "Farmer information saved successfully."
      );

      console.log(
        "================================="
      );

      // ======================================
      // GO TO SMART RECOMMENDATION
      // ======================================

      navigate(
        "/smart-recommendation"
      );

    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "Farmer creation error:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "================================="
      );

      let message =
        "Unable to save farmer information. Please try again.";

      if (
        error.response?.data?.detail
      ) {
        message =
          error.response.data.detail;
      }

      if (language === "Hindi") {
        message =
          "किसान की जानकारी सेव नहीं हो सकी। कृपया पुनः प्रयास करें।";
      }

      if (language === "Punjabi") {
        message =
          "ਕਿਸਾਨ ਦੀ ਜਾਣਕਾਰੀ ਸੇਵ ਨਹੀਂ ਹੋ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।";
      }

      alert(message);

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CROP TRANSLATIONS
  // ==========================================

  const cropNames = {
    English: {
      select: "Select your crop",
      Wheat: "Wheat",
      Rice: "Rice",
      Paddy: "Paddy",
      Maize: "Maize",
      Mustard: "Mustard",
      Cotton: "Cotton",
      Bajra: "Bajra",
      Other: "Other",
    },

    Hindi: {
      select: "अपनी फसल चुनें",
      Wheat: "गेहूं",
      Rice: "चावल",
      Paddy: "धान",
      Maize: "मक्का",
      Mustard: "सरसों",
      Cotton: "कपास",
      Bajra: "बाजरा",
      Other: "अन्य",
    },

    Punjabi: {
      select: "ਆਪਣੀ ਫਸਲ ਚੁਣੋ",
      Wheat: "ਕਣਕ",
      Rice: "ਚੌਲ",
      Paddy: "ਝੋਨਾ",
      Maize: "ਮੱਕੀ",
      Mustard: "ਸਰ੍ਹੋਂ",
      Cotton: "ਕਪਾਹ",
      Bajra: "ਬਾਜਰਾ",
      Other: "ਹੋਰ",
    },
  };

  const crops =
    cropNames[language] ||
    cropNames.English;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="farmer-info-page">

      <div className="farmer-info-layout">

        {/* ==================================
            LEFT SIDE
        ================================== */}

        <div className="procurement-intro">

          <h1>
            {t.tellUsAboutProcurement ||
              "Tell us about your procurement"}
          </h1>

          <p>
            {t.enterFarmerCropDetails ||
              "Enter your farmer and crop details to get smart procurement centre recommendations."}
          </p>

        </div>

        {/* ==================================
            RIGHT SIDE FORM
        ================================== */}

        <form onSubmit={handleSubmit}>

          {/* ==================================
              FARMER INFORMATION
          ================================== */}

          <div className="form-section">

            <h2>
              👤{" "}
              {t.farmerInformation ||
                "Farmer Information"}
            </h2>

            {/* FARMER NAME */}

            <div className="form-group">

              <label>
                {t.farmerName ||
                  "Farmer Name"}
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={
                  language === "Hindi"
                    ? "किसान का नाम दर्ज करें"
                    : language === "Punjabi"
                    ? "ਕਿਸਾਨ ਦਾ ਨਾਮ ਦਰਜ ਕਰੋ"
                    : "Enter farmer name"
                }
                required
              />

            </div>

            {/* MOBILE NUMBER */}

            <div className="form-group">

              <label>
                {t.mobileNumber ||
                  "Mobile Number"}
              </label>

              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={
                  handleMobileChange
                }
                maxLength={10}
                pattern="[7-9][0-9]{9}"
                inputMode="numeric"
                placeholder={
                  language === "Hindi"
                    ? "10 अंकों का मोबाइल नंबर दर्ज करें"
                    : language === "Punjabi"
                    ? "10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ"
                    : "Enter 10 digit mobile number"
                }
                required
              />

            </div>

            {/* VILLAGE */}

            <div className="form-group">

              <label>
                {t.villageLocation ||
                  "Village / Location"}
              </label>

              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleChange}
                placeholder={
                  language === "Hindi"
                    ? "गांव या स्थान दर्ज करें"
                    : language === "Punjabi"
                    ? "ਪਿੰਡ ਜਾਂ ਸਥਾਨ ਦਰਜ ਕਰੋ"
                    : "Enter village or location"
                }
                required
              />

            </div>

          </div>

          {/* ==================================
              CROP INFORMATION
          ================================== */}

          <div className="form-section">

            <h2>
              🌾{" "}
              {t.cropInformation ||
                "Crop Information"}
            </h2>

            {/* CROP */}

            <div className="form-group">

              <label>
                {t.cropType ||
                  "Crop"}
              </label>

              <select
                name="cropType"
                value={formData.cropType}
                onChange={handleChange}
                required
              >

                <option value="">
                  {crops.select}
                </option>

                <option value="Wheat">
                  {crops.Wheat}
                </option>

                <option value="Rice">
                  {crops.Rice}
                </option>

                <option value="Paddy">
                  {crops.Paddy}
                </option>

                <option value="Maize">
                  {crops.Maize}
                </option>

                <option value="Mustard">
                  {crops.Mustard}
                </option>

                <option value="Cotton">
                  {crops.Cotton}
                </option>

                <option value="Bajra">
                  {crops.Bajra}
                </option>

                <option value="Other">
                  {crops.Other}
                </option>

              </select>

            </div>

            {/* QUANTITY */}

            <div className="form-group">

              <label>
                {t.approximateQuantity ||
                  "Approximate Quantity"}
              </label>

              <input
                type="number"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                required
              />

              <span>
                {t.quintal ||
                  "Quintal"}
              </span>

            </div>

            {/* PROCUREMENT DATE */}

            <div className="form-group">

              <label>
                {t.preferredProcurementDate ||
                  "Preferred Procurement Date"}
              </label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />

            </div>

          </div>

          {/* ==================================
              SUBMIT BUTTON
          ================================== */}

          <button
            type="submit"
            disabled={saving}
          >

            {saving
              ? language === "Hindi"
                ? "सेव हो रहा है..."
                : language === "Punjabi"
                ? "ਸੇਵ ਹੋ ਰਿਹਾ ਹੈ..."
                : "Saving..."
              : (
                <>
                  {t.getSmartRecommendations ||
                    "Get Smart Recommendations"}

                  {" →"}
                </>
              )}

          </button>

        </form>

      </div>

    </div>
  );
}

export default FarmerCropInfo;
