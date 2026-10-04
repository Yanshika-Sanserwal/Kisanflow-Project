
from pydantic import BaseModel


class FarmerCreate(BaseModel):
    name: str
    mobile: str
    village: str
    crop_type: str


class FarmerResponse(FarmerCreate):
    id: int

    class Config:
        from_attributes = True


class ProcurementCentreCreate(BaseModel):
    name: str
    location: str
    capacity_per_day: int
    contact_number: str


class ProcurementCentreResponse(
    ProcurementCentreCreate
):
    id: int

    class Config:
        from_attributes = True


class SlotBookingCreate(BaseModel):
    farmer_id: int
    centre_id: int
    booking_date: str
    slot_time: str


class SlotBookingResponse(
    SlotBookingCreate
):
    id: int

    class Config:
        from_attributes = True


class TokenCreate(BaseModel):
    slot_id: int


class TokenResponse(BaseModel):
    id: int
    slot_id: int
    token_number: int
    status: str

    class Config:
        from_attributes = True