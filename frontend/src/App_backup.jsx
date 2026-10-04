import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  // ==============================
  // Farmer Registration States
  // ==============================

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [village, setVillage] = useState("");
  const [cropType, setCropType] = useState("");

  const [farmers, setFarmers] = useState([]);
  const [liveMessage, setLiveMessage] = useState("");

  // ==============================
  // Slot Booking States
  // ==============================

  const [farmerId, setFarmerId] = useState("");
  const [centreId, setCentreId] = useState("");
  const [bookingDate, setBookingDate] = useState("");

  // ==============================
  // Token States
  // ==============================

  const [slotId, setSlotId] = useState("");
  const [token, setToken] = useState(null);

  // ==============================
  // Queue States
  // ==============================

  const [queueData, setQueueData] = useState(null);

  // ==============================
  // Load Farmers
  // ==============================

  const loadFarmers = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/farmers"
      );

      setFarmers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // ==============================
  // Load Farmers When Page Opens
  // ==============================

  useEffect(() => {
    loadFarmers();
  }, []);

  // WebSocket Connection
useEffect(() => {
  const ws = new WebSocket("ws://127.0.0.1:8000/ws");

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    console.log("Message from server:", event.data);

    setLiveMessage(event.data);
  };

  ws.onerror = (error) => {
    console.log("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
  };

  return () => {
    ws.close();
  };
}, []);

  {liveMessage && (
    <div className="card">
    <h2>🔴 Live Queue Updates</h2>

    <p>{liveMessage}</p>
  </div>
)}

  // ==============================
  // Register Farmer
  // ==============================

  const registerFarmer = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/farmers",
        {
          name: name,
          mobile: mobile,
          village: village,
          crop_type: cropType
        }
      );

      alert(
        "Farmer Registered! ID: " +
        response.data.id
      );

      loadFarmers();

      setName("");
      setMobile("");
      setVillage("");
      setCropType("");

    } catch (error) {
      console.log(error);
      alert("Registration Failed");
    }
  };

  // ==============================
  // Book Slot
  // ==============================

  const bookSlot = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/slots",
        {
          farmer_id: Number(farmerId),
          centre_id: Number(centreId),
          booking_date: bookingDate
        }
      );

      alert(
        "Slot Booked Successfully! Booking ID: " +
        response.data.id
      );

      setSlotId(response.data.id);

      setFarmerId("");
      setCentreId("");
      setBookingDate("");

    } catch (error) {
      console.log(error);
      alert("Slot Booking Failed");
    }
  };

  // ==============================
  // Generate Token
  // ==============================

  const generateToken = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/tokens",
        {
          slot_id: Number(slotId)
        }
      );

      setToken(response.data);

      alert(
        "Token Generated! Token Number: " +
        response.data.token_number
      );

      setSlotId("");

    } catch (error) {
      console.log(error);
      alert("Token Generation Failed");
    }
  };

  // ==============================
  // Load Queue / ETA
  // ==============================

  const loadQueueStatus = async () => {
    if (!token) {
      alert("Please generate a token first.");
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/eta/${token.id}`
      );

      setQueueData(response.data);

    } catch (error) {
      console.log(error);
      alert("Unable to load queue status.");
    }
  };

  // ==============================
  // Frontend
  // ==============================

  return (
    <div className="app">

      {/* Header */}

      <header className="header">

        <h1>🌾 KisanFlow</h1>

        <p>
          Smart Farmer Procurement System
        </p>

      </header>


      <main className="container">

        {/* ==========================
            Farmer Registration
        ========================== */}

        <div className="card">

          <h2>Farmer Registration</h2>

          <div className="form-group">

            <label>Farmer Name</label>

            <input
              type="text"
              placeholder="Enter farmer name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>Mobile Number</label>

            <input
              type="text"
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>Village</label>

            <input
              type="text"
              placeholder="Enter village"
              value={village}
              onChange={(e) =>
                setVillage(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>Crop Type</label>

            <input
              type="text"
              placeholder="Example: Wheat"
              value={cropType}
              onChange={(e) =>
                setCropType(e.target.value)
              }
            />

          </div>


          <button
            className="register-button"
            onClick={registerFarmer}
          >
            Register Farmer
          </button>

        </div>


        {/* ==========================
            Slot Booking
        ========================== */}

        <div className="card">

          <h2>📅 Book Procurement Slot</h2>

          <div className="form-group">

            <label>Farmer ID</label>

            <input
              type="number"
              placeholder="Enter farmer ID"
              value={farmerId}
              onChange={(e) =>
                setFarmerId(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>Procurement Centre ID</label>

            <input
              type="number"
              placeholder="Enter centre ID"
              value={centreId}
              onChange={(e) =>
                setCentreId(e.target.value)
              }
            />

          </div>


          <div className="form-group">

            <label>Booking Date</label>

            <input
              type="date"
              value={bookingDate}
              onChange={(e) =>
                setBookingDate(e.target.value)
              }
            />

          </div>


          <button
            className="register-button"
            onClick={bookSlot}
          >
            Book Slot
          </button>

        </div>


        {/* ==========================
            Token Generation
        ========================== */}

        <div className="card">

          <h2>🎟️ Generate Token</h2>

          <div className="form-group">

            <label>Slot ID</label>

            <input
              type="number"
              placeholder="Enter slot ID"
              value={slotId}
              onChange={(e) =>
                setSlotId(e.target.value)
              }
            />

          </div>


          <button
            className="register-button"
            onClick={generateToken}
          >
            Generate Token
          </button>

        </div>


        {/* ==========================
            Token Result
        ========================== */}

        {token && (

          <div className="card">

            <h2>🎟️ Your Token</h2>

            <h1>
              {token.token_number}
            </h1>

            <p>
              <strong>Token ID:</strong>{" "}
              {token.id}
            </p>

            <p>
              <strong>Slot ID:</strong>{" "}
              {token.slot_id}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {token.status}
            </p>

          </div>

        )}


        {/* ==========================
            Live Queue Status
        ========================== */}

        {token && (

          <div className="card">

            <h2>📊 Live Queue Status</h2>

            <button
              className="register-button"
              onClick={loadQueueStatus}
            >
              🔄 Refresh Queue
            </button>


            {queueData && (

              <div>

                <p>
                  <strong>
                    Your Token:
                  </strong>{" "}
                  {queueData.token_number}
                </p>

                <p>
                  <strong>
                    Queue Position:
                  </strong>{" "}
                  {queueData.queue_position}
                </p>

                <p>
                  <strong>
                    Estimated Wait:
                  </strong>{" "}
                  {queueData.estimated_wait_minutes} minutes
                </p>

              </div>

            )}

          </div>

        )}


        {/* ==========================
            Registered Farmers
        ========================== */}

        <div className="farmers-section">

          <h2>Registered Farmers</h2>

          {farmers.map((farmer) => (

            <div
              className="farmer-card"
              key={farmer.id}
            >

              <p>
                <strong>ID:</strong>{" "}
                {farmer.id}
              </p>

              <p>
                <strong>Name:</strong>{" "}
                {farmer.name}
              </p>

              <p>
                <strong>Mobile:</strong>{" "}
                {farmer.mobile}
              </p>

              <p>
                <strong>Village:</strong>{" "}
                {farmer.village}
              </p>

              <p>
                <strong>Crop:</strong>{" "}
                {farmer.crop_type}
              </p>

            </div>

          ))}

        </div>

      </main>

    </div>
  );
}

export default App;