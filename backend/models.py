
from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)

    mobile = Column(String)

    village = Column(String)

    crop_type = Column(String)


class ProcurementCentre(Base):
    __tablename__ = "procurement_centres"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, unique=True)

    location = Column(String)

    capacity_per_day = Column(Integer)

    contact_number = Column(String)


class SlotBooking(Base):
    __tablename__ = "slot_bookings"

    id = Column(Integer, primary_key=True, index=True)

    farmer_id = Column(
        Integer,
        ForeignKey("farmers.id")
    )

    centre_id = Column(
        Integer,
        ForeignKey("procurement_centres.id")
    )

    booking_date = Column(String)

    slot_time = Column(String)


class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)

    slot_id = Column(
        Integer,
        ForeignKey("slot_bookings.id")
    )

    token_number = Column(Integer)

    status = Column(
        String,
        default="waiting"
    )

