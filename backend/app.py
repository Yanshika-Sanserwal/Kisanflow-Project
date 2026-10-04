
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi import WebSocket
from fastapi.middleware.cors import CORSMiddleware

from ai_eta import predict_eta
from congestion_model import predict_congestion

from database import SessionLocal, engine, Base

from models import (
    Farmer,
    ProcurementCentre,
    SlotBooking,
    Token
)

from schemas import (
    FarmerCreate,
    FarmerResponse,
    ProcurementCentreCreate,
    ProcurementCentreResponse,
    SlotBookingCreate,
    SlotBookingResponse,
    TokenCreate,
    TokenResponse
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="KisanFlow API",
    description="Smart Procurement Management System for Farmers",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://kisanflow-beta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# WEBSOCKET CONNECTION MANAGER
# ============================================================

class ConnectionManager:

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(
        self,
        websocket: WebSocket
    ):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(
        self,
        websocket: WebSocket
    ):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(
        self,
        message: str
    ):
        for connection in self.active_connections:

            try:
                await connection.send_text(message)

            except:
                self.disconnect(connection)


manager = ConnectionManager()


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Welcome to KisanFlow",
        "status": "running"
    }


# ============================================================
# FARMER APIs
# ============================================================

@app.post(
    "/farmers",
    response_model=FarmerResponse
)
def create_farmer(
    farmer: FarmerCreate,
    db: Session = Depends(get_db)
):

    new_farmer = Farmer(
        name=farmer.name,
        mobile=farmer.mobile,
        village=farmer.village,
        crop_type=farmer.crop_type
    )

    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)

    return new_farmer


@app.get("/farmers")
def get_farmers(
    db: Session = Depends(get_db)
):

    return db.query(Farmer).all()


# ============================================================
# PROCUREMENT CENTRE APIs
# ============================================================

@app.post(
    "/centres",
    response_model=ProcurementCentreResponse
)
def create_centre(
    centre: ProcurementCentreCreate,
    db: Session = Depends(get_db)
):

    new_centre = ProcurementCentre(
        name=centre.name,
        location=centre.location,
        capacity_per_day=centre.capacity_per_day,
        contact_number=centre.contact_number
    )

    db.add(new_centre)
    db.commit()
    db.refresh(new_centre)

    return new_centre


@app.get("/centres")
def get_centres(
    db: Session = Depends(get_db)
):

    centres = db.query(
        ProcurementCentre
    ).all()

    result = []

    for centre in centres:

        # Count waiting tokens
        waiting_tokens = (
            db.query(Token)
            .join(
                SlotBooking,
                Token.slot_id == SlotBooking.id
            )
            .filter(
                SlotBooking.centre_id == centre.id,
                Token.status == "waiting"
            )
            .count()
        )

        # Estimate waiting time
        estimated_wait = waiting_tokens * 10

        # Calculate congestion
        if waiting_tokens > 25:

            congestion = "High"

        elif waiting_tokens > 10:

            congestion = "Moderate"

        else:

            congestion = "Low"

        result.append({

            "id": centre.id,

            "name": centre.name,

            "location": centre.location,

            "contact_number": centre.contact_number,

            "capacity_per_day": centre.capacity_per_day,

            "queue_length": waiting_tokens,

            "estimated_wait_minutes": estimated_wait,

            "congestion": congestion
        })

    return result


# ============================================================
# SLOT BOOKING
# ============================================================

@app.post(
    "/slots",
    response_model=SlotBookingResponse
)
def create_slot(
    slot: SlotBookingCreate,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Check farmer
    # --------------------------------------------------------

    farmer = (
        db.query(Farmer)
        .filter(
            Farmer.id == slot.farmer_id
        )
        .first()
    )

    if not farmer:

        raise HTTPException(
            status_code=404,
            detail="Farmer not found"
        )


    # --------------------------------------------------------
    # Check procurement centre
    # --------------------------------------------------------

    centre = (
        db.query(ProcurementCentre)
        .filter(
            ProcurementCentre.id == slot.centre_id
        )
        .first()
    )

    if not centre:

        raise HTTPException(
            status_code=404,
            detail="Centre not found"
        )


    # --------------------------------------------------------
    # Check duplicate farmer booking
    # --------------------------------------------------------

    existing_booking = (
        db.query(SlotBooking)
        .filter(
            SlotBooking.farmer_id == slot.farmer_id,
            SlotBooking.centre_id == slot.centre_id,
            SlotBooking.booking_date == slot.booking_date
        )
        .first()
    )

    if existing_booking:

        raise HTTPException(
            status_code=400,
            detail="Booking already exists"
        )


    # --------------------------------------------------------
    # Check whether selected time is already booked
    # --------------------------------------------------------

    existing_slot = (
        db.query(SlotBooking)
        .filter(
            SlotBooking.centre_id == slot.centre_id,
            SlotBooking.booking_date == slot.booking_date,
            SlotBooking.slot_time == slot.slot_time
        )
        .first()
    )

    if existing_slot:

        raise HTTPException(
            status_code=400,
            detail="This time slot is already booked"
        )


    # --------------------------------------------------------
    # Create booking
    # --------------------------------------------------------

    new_slot = SlotBooking(

        farmer_id=slot.farmer_id,

        centre_id=slot.centre_id,

        booking_date=slot.booking_date,

        # IMPORTANT:
        # Save selected time slot
        slot_time=slot.slot_time
    )

    db.add(new_slot)

    db.commit()

    db.refresh(new_slot)

    return new_slot


# ============================================================
# GET ALL BOOKINGS
# ============================================================

@app.get("/slots")
def get_slots(
    db: Session = Depends(get_db)
):

    return db.query(
        SlotBooking
    ).all()


# ============================================================
# AVAILABLE TIME SLOTS
# ============================================================

@app.get("/available-slots")
def get_available_slots(
    centre_id: int,
    booking_date: str,
    db: Session = Depends(get_db)
):

    all_slots = [

        "09:00 AM - 10:00 AM",

        "10:00 AM - 11:00 AM",

        "11:00 AM - 12:00 PM",

        "12:00 PM - 01:00 PM",

        "02:00 PM - 03:00 PM",

        "03:00 PM - 04:00 PM",

        "04:00 PM - 05:00 PM"
    ]


    # Get bookings for centre and date

    booked_slots = (
        db.query(SlotBooking)
        .filter(
            SlotBooking.centre_id == centre_id,
            SlotBooking.booking_date == booking_date
        )
        .all()
    )


    # Extract booked times

    booked_times = [

        slot.slot_time

        for slot in booked_slots

        if slot.slot_time
    ]


    result = []


    for time_slot in all_slots:

        if time_slot in booked_times:

            status = "booked"

        else:

            status = "available"


        result.append({

            "slot_time": time_slot,

            "status": status
        })


    return result


# ============================================================
# TOKEN APIs
# ============================================================

@app.post(
    "/tokens",
    response_model=TokenResponse
)
def create_token(
    token: TokenCreate,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Check slot
    # --------------------------------------------------------

    slot = (
        db.query(SlotBooking)
        .filter(
            SlotBooking.id == token.slot_id
        )
        .first()
    )

    if not slot:

        raise HTTPException(
            status_code=404,
            detail="Slot not found"
        )


    # --------------------------------------------------------
    # Check existing token
    # --------------------------------------------------------

    existing_token = (
        db.query(Token)
        .filter(
            Token.slot_id == token.slot_id,
            Token.status.in_(
                ["waiting", "in_progress"]
            )
        )
        .first()
    )

    if existing_token:

        raise HTTPException(
            status_code=400,
            detail="Token already exists for this slot"
        )


    # --------------------------------------------------------
    # Generate next token number
    # --------------------------------------------------------

    last_token = (
        db.query(Token)
        .order_by(
            Token.token_number.desc()
        )
        .first()
    )

    next_token = 101

    if last_token:

        next_token = (
            last_token.token_number + 1
        )


    # --------------------------------------------------------
    # Create token
    # --------------------------------------------------------

    new_token = Token(

        slot_id=token.slot_id,

        token_number=next_token,

        status="waiting"
    )

    db.add(new_token)

    db.commit()

    db.refresh(new_token)

    return new_token


# ============================================================
# QUEUE
# ============================================================

@app.get("/queue")
def get_queue(
    db: Session = Depends(get_db)
):

    tokens = (
        db.query(Token)
        .order_by(
            Token.token_number
        )
        .all()
    )

    return tokens


# ============================================================
# START TOKEN
# ============================================================

@app.put(
    "/tokens/{token_id}/start"
)
def start_token(
    token_id: int,
    db: Session = Depends(get_db)
):

    token = (
        db.query(Token)
        .filter(
            Token.id == token_id
        )
        .first()
    )

    if not token:

        raise HTTPException(
            status_code=404,
            detail="Token not found"
        )


    token.status = "in_progress"

    db.commit()

    return {

        "message": "Token started",

        "token": token.token_number
    }


# ============================================================
# COMPLETE TOKEN
# ============================================================

@app.put(
    "/tokens/{token_id}/complete"
)
async def complete_token(
    token_id: int,
    db: Session = Depends(get_db)
):

    token = (
        db.query(Token)
        .filter(
            Token.id == token_id
        )
        .first()
    )

    if not token:

        raise HTTPException(
            status_code=404,
            detail="Token not found"
        )


    token.status = "completed"

    db.commit()


    # Notify connected clients

    await manager.broadcast(

        f"Token {token.token_number} completed"

    )


    return {

        "message": "Token completed",

        "token": token.token_number
    }


# ============================================================
# ETA
# ============================================================

@app.get(
    "/eta/{token_id}"
)
def get_eta(
    token_id: int,
    db: Session = Depends(get_db)
):

    token = (
        db.query(Token)
        .filter(
            Token.id == token_id
        )
        .first()
    )

    if not token:

        raise HTTPException(
            status_code=404,
            detail="Token not found"
        )


    waiting_before = (
        db.query(Token)
        .filter(
            Token.status == "waiting",
            Token.token_number < token.token_number
        )
        .count()
    )


    position = waiting_before + 1


    eta_minutes = predict_eta(
        position
    )


    return {

        "token_number": token.token_number,

        "queue_position": position,

        "estimated_wait_minutes": eta_minutes
    }


# ============================================================
# ARRIVAL GUIDANCE
# ============================================================

@app.get(
    "/arrival-guidance/{token_id}"
)
def arrival_guidance(
    token_id: int,
    db: Session = Depends(get_db)
):

    token = (
        db.query(Token)
        .filter(
            Token.id == token_id
        )
        .first()
    )

    if not token:

        raise HTTPException(
            status_code=404,
            detail="Token not found"
        )


    waiting_before = (
        db.query(Token)
        .filter(
            Token.status == "waiting",
            Token.token_number < token.token_number
        )
        .count()
    )


    position = waiting_before + 1


    eta_minutes = predict_eta(
        position
    )


    leave_after = max(
        0,
        round(
            eta_minutes - 20
        )
    )


    return {

        "token_number": token.token_number,

        "eta_minutes": eta_minutes,

        "recommended_leave_after_minutes": leave_after
    }


# ============================================================
# WEBSOCKET
# ============================================================

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket
):

    await manager.connect(
        websocket
    )

    try:

        while True:

            await websocket.receive_text()

    except:

        manager.disconnect(
            websocket
        )


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@app.get(
    "/admin/dashboard"
)
def admin_dashboard(
    db: Session = Depends(get_db)
):

    total_farmers = (
        db.query(Farmer).count()
    )

    total_centres = (
        db.query(ProcurementCentre).count()
    )

    total_bookings = (
        db.query(SlotBooking).count()
    )

    total_tokens = (
        db.query(Token).count()
    )

    waiting_tokens = (
        db.query(Token)
        .filter(
            Token.status == "waiting"
        )
        .count()
    )

    in_progress_tokens = (
        db.query(Token)
        .filter(
            Token.status == "in_progress"
        )
        .count()
    )

    completed_tokens = (
        db.query(Token)
        .filter(
            Token.status == "completed"
        )
        .count()
    )


    return {

        "total_farmers": total_farmers,

        "total_centres": total_centres,

        "total_bookings": total_bookings,

        "total_tokens": total_tokens,

        "waiting_tokens": waiting_tokens,

        "in_progress_tokens": in_progress_tokens,

        "completed_tokens": completed_tokens
    }


# ============================================================
# ADMIN - FARMERS
# ============================================================

@app.get(
    "/admin/farmers"
)
def get_all_farmers(
    db: Session = Depends(get_db)
):

    return db.query(
        Farmer
    ).all()


# ============================================================
# ADMIN - CENTRES
# ============================================================

@app.get(
    "/admin/centres"
)
def get_all_centres(
    db: Session = Depends(get_db)
):

    return db.query(
        ProcurementCentre
    ).all()


# ============================================================
# ADMIN - TOKENS
# ============================================================

@app.get(
    "/admin/tokens"
)
def get_all_tokens(
    db: Session = Depends(get_db)
):

    return db.query(
        Token
    ).all()


# ============================================================
# ADMIN - QUEUE
# ============================================================

@app.get(
    "/admin/queue"
)
def queue_monitor(
    db: Session = Depends(get_db)
):

    waiting = (
        db.query(Token)
        .filter(
            Token.status == "waiting"
        )
        .all()
    )

    return waiting


# ============================================================
# CONGESTION
# ============================================================

@app.get(
    "/congestion"
)
def get_congestion(
    db: Session = Depends(get_db)
):

    queue_size = (
        db.query(Token)
        .filter(
            Token.status == "waiting"
        )
        .count()
    )


    congestion_level = predict_congestion(
        queue_size
    )


    return {

        "queue_size": queue_size,

        "congestion_level": congestion_level
    }


# ============================================================
# QUEUE SUMMARY
# ============================================================

@app.get(
    "/queue/summary"
)
def queue_summary(
    db: Session = Depends(get_db)
):

    waiting = (
        db.query(Token)
        .filter(
            Token.status == "waiting"
        )
        .count()
    )

    in_progress = (
        db.query(Token)
        .filter(
            Token.status == "in_progress"
        )
        .count()
    )

    completed = (
        db.query(Token)
        .filter(
            Token.status == "completed"
        )
        .count()
    )


    return {

        "waiting": waiting,

        "in_progress": in_progress,

        "completed": completed
    }


# ============================================================
# MY PROCUREMENT
# ============================================================

@app.get(
    "/my-procurement"
)
def get_my_procurement(
    centre_id: int = 1,
    db: Session = Depends(get_db)
):

    bookings = (
        db.query(SlotBooking)
        .filter(
            SlotBooking.centre_id == centre_id
        )
        .all()
    )


    result = []


    for booking in bookings:

        tokens = (
            db.query(Token)
            .filter(
                Token.slot_id == booking.id
            )
            .all()
        )


        for token in tokens:

            result.append({

                "id": token.id,

                "token_number": token.token_number,

                "status": token.status,

                "slot_id": booking.id,

                "booking_date": booking.booking_date,

                "slot_time": booking.slot_time,

                "centre_id": booking.centre_id
            })


    return result

