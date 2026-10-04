import { useNavigate } from "react-router-dom";

function FarmerProfile() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "30px" }}>
      <h1>👨‍🌾 Farmer Profile</h1>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          maxWidth: "500px",
          marginTop: "20px",
        }}
      >
        <h2>Farmer Details</h2>

        <p><strong>Name:</strong> Farmer</p>
        <p><strong>User Type:</strong> KisanFlow User</p>
        <p><strong>Total Bookings:</strong> 7</p>
        <p><strong>Active Tokens:</strong> 0</p>
      </div>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 15px",
          cursor: "pointer",
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}

export default FarmerProfile;