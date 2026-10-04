import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import translations from "./translations";

function ProcurementCentres() {
  const navigate = useNavigate();

  const [centres, setCentres] = useState([]);
  const [search, setSearch] = useState("");

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English"
  );

  const [selectedCentre, setSelectedCentre] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const t =
    translations[language] || translations.English;

  // ==============================
  // LANGUAGE
  // ==============================

  useEffect(() => {
    const updateLanguage = () => {
      const savedLanguage =
        localStorage.getItem("language") || "English";

      setLanguage(savedLanguage);
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

  // ==============================
  // LOAD PROCUREMENT CENTRES
  // ==============================

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/centres")
      .then((response) => {
        console.log("Centres:", response.data);
        setCentres(response.data);
      })
      .catch((error) => {
        console.error(
          "Error loading centres:",
          error
        );
      });
  }, []);

  // ==============================
  // GET FARMER PREFERRED DATE
  // ==============================

  useEffect(() => {
    const savedFarmerInfo =
      localStorage.getItem("farmerCropInfo");

    if (savedFarmerInfo) {
      try {
        const farmerInfo =
          JSON.parse(savedFarmerInfo);

        if (farmerInfo.date) {
          setSelectedDate(farmerInfo.date);
        }
      } catch (error) {
        console.error(
          "Error reading farmer information:",
          error
        );
      }
    }
  }, []);

  // ==============================
  // FILTER CENTRES
  // ==============================

  const filteredCentres = centres.filter(
    (centre) => {
      const searchText =
        search.toLowerCase();

      return (
        centre.name
          ?.toLowerCase()
          .includes(searchText) ||
        centre.location
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  // ==============================
  // CONGESTION
  // ==============================

  const getCongestion = (centre) => {
    const queue =
      centre.queue_length || 0;

    if (queue <= 10) {
      return {
        text: "Low Congestion",
        emoji: "🟢",
      };
    }

    if (queue <= 25) {
      return {
        text: "Moderate Congestion",
        emoji: "🟡",
      };
    }

    return {
      text: "High Congestion",
      emoji: "🔴",
    };
  };

  // ==============================
  // SELECT CENTRE
  // ==============================

  const handleSelectCentre = async (
    centre
  ) => {
    try {
      setSelectedCentre(centre);
      setSelectedSlot("");
      setAvailableSlots([]);
      setLoadingSlots(true);

      let dateToUse = selectedDate;

      if (!dateToUse) {
        dateToUse = new Date()
          .toISOString()
          .split("T")[0];

        setSelectedDate(dateToUse);
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/available-slots",
        {
          params: {
            centre_id: centre.id,
            booking_date: dateToUse,
          },
        }
      );

      console.log(
        "Available slots:",
        response.data
      );

      setAvailableSlots(response.data);
    } catch (error) {
      console.error(
        "Error loading available slots:",
        error
      );

      alert(
        "Unable to load available slots."
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  // ==============================
  // DATE CHANGE
  // ==============================

  const handleDateChange = async (e) => {
    const newDate = e.target.value;

    setSelectedDate(newDate);
    setSelectedSlot("");

    if (
      !selectedCentre ||
      !newDate
    ) {
      return;
    }

    try {
      setLoadingSlots(true);

      const response = await axios.get(
        "http://127.0.0.1:8000/available-slots",
        {
          params: {
            centre_id:
              selectedCentre.id,
            booking_date: newDate,
          },
        }
      );

      console.log(
        "Available slots for new date:",
        response.data
      );

      setAvailableSlots(
        response.data
      );
    } catch (error) {
      console.error(
        "Error loading slots:",
        error
      );

      alert(
        "Unable to load available slots."
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  // ==============================
  // CONFIRM BOOKING
  // ==============================

  const handleConfirmBooking =
    async () => {
      if (!selectedCentre) {
        alert(
          "Please select a procurement centre."
        );
        return;
      }

      if (!selectedDate) {
        alert(
          "Please select a date."
        );
        return;
      }

      if (!selectedSlot) {
        alert(
          "Please select an available time slot."
        );
        return;
      }

      // Get farmer ID
      const farmerId = Number(
        localStorage.getItem(
          "farmerId"
        )
      );

      // Check farmer ID
      if (!farmerId) {
        alert(
          "Farmer information is missing. Please complete Farmer Information first."
        );

        navigate("/farmer-info");
        return;
      }

      try {
        setBookingLoading(true);

        // ==============================
        // STEP 1: CREATE BOOKING
        // ==============================

        const slotResponse =
          await axios.post(
            "http://127.0.0.1:8000/slots",
            {
              farmer_id: farmerId,
              centre_id:
                selectedCentre.id,
              booking_date:
                selectedDate,
              slot_time:
                selectedSlot,
            }
          );

        console.log(
          "Booking created:",
          slotResponse.data
        );

        const slotId =
          slotResponse.data.id;

        // ==============================
        // STEP 2: GENERATE TOKEN
        // ==============================

        const tokenResponse =
          await axios.post(
            "http://127.0.0.1:8000/tokens",
            {
              slot_id: slotId,
            }
          );

        console.log(
          "Token created:",
          tokenResponse.data
        );

        const tokenId =
          tokenResponse.data.id;

        const tokenNumber =
          tokenResponse.data
            .token_number;

        // ==============================
        // SAVE TOKEN ID
        // ==============================

        localStorage.setItem(
          "myTokenId",
          String(tokenId)
        );

        // ==============================
        // SAVE BOOKING
        // ==============================

        const bookingData = {
          centre: selectedCentre,
          bookingDate: selectedDate,
          slotTime: selectedSlot,
          tokenId: tokenId,
          tokenNumber: tokenNumber,
        };

        localStorage.setItem(
          "myBooking",
          JSON.stringify(
            bookingData
          )
        );

        // Tell other components
        window.dispatchEvent(
          new Event("bookingUpdated")
        );

        // ==============================
        // SUCCESS MESSAGE
        // ==============================

        alert(
          `Booking successful!\n\nCentre: ${selectedCentre.name}\nDate: ${selectedDate}\nTime: ${selectedSlot}\nToken Number: ${tokenNumber}`
        );

        // ==============================
        // GO TO QUEUE & ETA
        // ==============================

        navigate("/queue-eta");
      } catch (error) {
        console.error(
          "Booking error:",
          error
        );

        if (error.response) {
          alert(
            `Booking failed: ${
              error.response.data.detail ||
              "Something went wrong"
            }`
          );
        } else {
          alert(
            "Unable to connect to the backend."
          );
        }
      } finally {
        setBookingLoading(false);
      }
    };

  // ==============================
  // RENDER
  // ==============================

  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#f5f7fb",
        minHeight: "100vh",
      }}
    >

      {/* ==============================
          HEADER
      ============================== */}

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
          🏢{" "}
          {t.centres ||
            "Procurement Centres"}
        </h1>

        <p
          style={{
            color: "#666",
            margin: 0,
          }}
        >
          Find a nearby procurement
          centre and select your
          preferred slot.
        </p>
      </div>

      {/* ==============================
          SEARCH
      ============================== */}

      <div
        style={{
          background: "#ffffff",
          padding: "15px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <input
          type="text"
          placeholder="🔎 Search centre or location..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "15px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ==============================
          CENTRES
      ============================== */}

      {filteredCentres.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <h3>
            🏢 No centres found
          </h3>

          <p
            style={{
              color: "#666",
            }}
          >
            Try searching with another
            centre name or location.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredCentres.map(
            (centre) => {
              const congestion =
                getCongestion(
                  centre
                );

              const isSelected =
                selectedCentre?.id ===
                centre.id;

              return (
                <div
                  key={centre.id}
                  style={{
                    background:
                      "#ffffff",
                    padding: "22px",
                    borderRadius:
                      "14px",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.08)",
                    border: isSelected
                      ? "2px solid #2e7d32"
                      : "2px solid transparent",
                  }}
                >

                  {/* Centre Name */}

                  <h2
                    style={{
                      color:
                        "#2e7d32",
                      marginTop: 0,
                      marginBottom:
                        "15px",
                    }}
                  >
                    🏢{" "}
                    {centre.name}
                  </h2>

                  {/* Location */}

                  <p>
                    📍{" "}
                    <strong>
                      Location:
                    </strong>{" "}
                    {centre.location ||
                      "Not available"}
                  </p>

                  {/* Capacity */}

                  <p>
                    👥{" "}
                    <strong>
                      Daily Capacity:
                    </strong>{" "}
                    {centre.capacity_per_day ||
                      "N/A"}
                  </p>

                  {/* Contact */}

                  <p>
                    📞{" "}
                    <strong>
                      Contact:
                    </strong>{" "}
                    {centre.contact_number ||
                      "N/A"}
                  </p>

                  {/* Queue */}

                  <p>
                    🚶{" "}
                    <strong>
                      Current Queue:
                    </strong>{" "}
                    {centre.queue_length ||
                      0}
                  </p>

                  {/* Waiting Time */}

                  <p>
                    ⏱️{" "}
                    <strong>
                      Estimated Wait:
                    </strong>{" "}
                    {centre.estimated_wait_minutes ||
                      0}{" "}
                    minutes
                  </p>

                  {/* Congestion */}

                  <div
                    style={{
                      display:
                        "inline-block",
                      padding:
                        "7px 12px",
                      borderRadius:
                        "20px",
                      backgroundColor:
                        congestion.emoji ===
                        "🟢"
                          ? "#e8f5e9"
                          : congestion.emoji ===
                            "🟡"
                          ? "#fff8e1"
                          : "#ffebee",
                      marginTop: "5px",
                      marginBottom:
                        "15px",
                    }}
                  >
                    {
                      congestion.emoji
                    }{" "}
                    {
                      congestion.text
                    }
                  </div>

                  {/* Select Centre */}

                  <button
                    onClick={() =>
                      handleSelectCentre(
                        centre
                      )
                    }
                    style={{
                      width: "100%",
                      background:
                        "#2e7d32",
                      color: "white",
                      border: "none",
                      padding: "11px",
                      borderRadius:
                        "8px",
                      cursor:
                        "pointer",
                      fontSize:
                        "15px",
                      fontWeight:
                        "600",
                    }}
                  >
                    📅{" "}
                    {isSelected
                      ? "Centre Selected"
                      : "Select Centre"}
                  </button>

                </div>
              );
            }
          )}
        </div>
      )}

      {/* ==============================
          SLOT SELECTION
      ============================== */}

      {selectedCentre && (
        <div
          style={{
            marginTop: "30px",
            background: "#ffffff",
            padding: "25px",
            borderRadius: "14px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >

          <h2
            style={{
              color: "#2e7d32",
              marginTop: 0,
            }}
          >
            📅 Select Your Slot
          </h2>

          <p
            style={{
              color: "#666",
            }}
          >
            Selected Centre:{" "}
            <strong>
              {selectedCentre.name}
            </strong>
          </p>

          {/* DATE */}

          <div
            style={{
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Procurement Date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={
                handleDateChange
              }
              min={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              style={{
                padding: "11px",
                border:
                  "1px solid #ddd",
                borderRadius:
                  "8px",
                fontSize:
                  "15px",
              }}
            />
          </div>

          {/* LOADING */}

          {loadingSlots && (
            <div
              style={{
                padding: "20px",
                textAlign:
                  "center",
                color: "#666",
              }}
            >
              ⏳ Loading available
              slots...
            </div>
          )}

          {/* AVAILABLE SLOTS */}

          {!loadingSlots &&
            availableSlots.length >
              0 && (
              <div>

                <h3>
                  Available Time Slots
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >

                  {availableSlots.map(
                    (slot) => {
                      const isAvailable =
                        slot.status ===
                        "available";

                      const isSelected =
                        selectedSlot ===
                        slot.slot_time;

                      return (
                        <button
                          key={
                            slot.slot_time
                          }
                          disabled={
                            !isAvailable
                          }
                          onClick={() =>
                            setSelectedSlot(
                              slot.slot_time
                            )
                          }
                          style={{
                            padding:
                              "15px",
                            borderRadius:
                              "10px",
                            border:
                              isSelected
                                ? "2px solid #2e7d32"
                                : "1px solid #ddd",
                            background:
                              !isAvailable
                                ? "#f3f3f3"
                                : isSelected
                                ? "#e8f5e9"
                                : "#ffffff",
                            color:
                              !isAvailable
                                ? "#999"
                                : "#333",
                            cursor:
                              !isAvailable
                                ? "not-allowed"
                                : "pointer",
                            textAlign:
                              "left",
                            fontSize:
                              "14px",
                          }}
                        >

                          <strong>
                            {isAvailable
                              ? "🟢"
                              : "🔴"}{" "}
                            {
                              slot.slot_time
                            }
                          </strong>

                          <br />

                          <span
                            style={{
                              fontSize:
                                "13px",
                              color:
                                !isAvailable
                                  ? "#999"
                                  : "#2e7d32",
                            }}
                          >
                            {isAvailable
                              ? "Available"
                              : "Booked"}
                          </span>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>
            )}

          {/* NO SLOTS */}

          {!loadingSlots &&
            availableSlots.length ===
              0 &&
            selectedDate && (
              <p
                style={{
                  color: "#666",
                }}
              >
                No slots available for
                this date.
              </p>
            )}

          {/* CONFIRM BOOKING */}

          {selectedSlot && (
            <div
              style={{
                marginTop: "25px",
                padding: "18px",
                background:
                  "#f1f8f2",
                borderRadius:
                  "10px",
              }}
            >

              <h3
                style={{
                  marginTop: 0,
                  color: "#2e7d32",
                }}
              >
                ✅ Selected Slot
              </h3>

              <p>
                <strong>
                  Centre:
                </strong>{" "}
                {selectedCentre.name}
              </p>

              <p>
                <strong>
                  Date:
                </strong>{" "}
                {selectedDate}
              </p>

              <p>
                <strong>
                  Time:
                </strong>{" "}
                {selectedSlot}
              </p>

              <button
                onClick={
                  handleConfirmBooking
                }
                disabled={
                  bookingLoading
                }
                style={{
                  width: "100%",
                  background:
                    bookingLoading
                      ? "#999"
                      : "#2e7d32",
                  color: "white",
                  border: "none",
                  padding: "13px",
                  borderRadius:
                    "8px",
                  cursor:
                    bookingLoading
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "16px",
                  fontWeight:
                    "600",
                  marginTop: "10px",
                }}
              >
                {bookingLoading
                  ? "⏳ Confirming..."
                  : "✅ Confirm Booking"}
              </button>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default ProcurementCentres;