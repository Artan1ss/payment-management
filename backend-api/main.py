from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime, date,timezone,time
from pymongo import MongoClient
from bson import ObjectId
import motor.motor_asyncio
import io
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
utc_now = datetime.now(timezone.utc)
# MongoDB Atlas Connection
MONGO_URI = "mongodb+srv://artan1s:Xf201701@cluster0.9vgwm.mongodb.net/"
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["payments_db"]
collection = db["payments"]
files_collection = db["evidence_files"]

# Allowed file types
ALLOWED_FILE_TYPES = {"application/pdf", "image/png", "image/jpeg"}

class PaymentUpdateModel(BaseModel):
    payee_payment_status: str
    payee_due_date: str  # Consider converting this to a date if needed
    due_amount: float

app.add_middleware(
    CORSMiddleware,
    allow_origins=['https://payment-management-production.up.railway.app',"https://payment-management-omega.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 1️⃣ **Upload Evidence File API**
@app.post("/upload_evidence/{payment_id}")
async def upload_evidence(payment_id: str, file: UploadFile = File(...)):
    # Validate payment ID
    payment = await collection.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    # Check if file type is allowed
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed. Use PDF, PNG, or JPG.")

    # Read file contents
    file_content = await file.read()

    # Save file in MongoDB
    file_id = await files_collection.insert_one({
        "payment_id": ObjectId(payment_id),
        "filename": file.filename,
        "content_type": file.content_type,
        "file_data": file_content,
    })

    # Update payment status to "completed"
    await collection.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {"payee_payment_status": "completed", "evidence_file_id": file_id.inserted_id}}
    )
    download_link = f"http://127.0.0.1:8000/download_evidence/{payment_id}"

    return JSONResponse(
        content={
            "message": "Evidence file uploaded successfully!",
            "file_id": str(file_id.inserted_id),
            "download_link": download_link
        }
    )


# 2️⃣ **Download Evidence File API**
@app.get("/download_evidence/{payment_id}")
async def download_evidence(payment_id: str):
    # Find the evidence file for the payment
    file_data = await files_collection.find_one({"payment_id": ObjectId(payment_id)})
    if not file_data:
        raise HTTPException(status_code=404, detail="No evidence file found.")

    # Prepare file for download
    file_bytes = file_data["file_data"]
    file_like = io.BytesIO(file_bytes)

    # Return file as response
    headers = {
        "Content-Disposition": f'attachment; filename="{file_data["filename"]}"'
    }
    return StreamingResponse(
        file_like,
        media_type=file_data["content_type"],
        headers=headers
    )


# 3️⃣ **Update Payment Status (Prevent "Completed" without Evidence)**
@app.put("/update_payment/{payment_id}")
async def update_payment(payment_id: str, update: PaymentUpdateModel):
    # Validate payment ID
    payment = await collection.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    # Check if payment is being marked as completed
    if update.payee_payment_status == "completed":
        evidence = await files_collection.find_one({"payment_id": ObjectId(payment_id)})
        if not evidence:
            raise HTTPException(
                status_code=400,
                detail="Cannot mark as completed without an evidence file."
            )

    # Update payment details
    await collection.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {
            "payee_payment_status": update.payee_payment_status,
            "payee_due_date": update.payee_due_date,
            "due_amount": update.due_amount
        }}
    )

    return JSONResponse(content={"message": "Payment updated successfully!"})


class PaymentCreateModel(BaseModel):
    payee_first_name: str
    payee_last_name: str
    payee_address_line_1: str
    payee_city: str
    payee_country: str
    payee_postal_code: str
    payee_phone_number: str
    payee_email: EmailStr
    currency: str
    due_amount: float
    discount_percent: Optional[float] = 0.0
    tax_percent: Optional[float] = 0.0
    payee_payment_status: str = Field("pending", description="By default, new payments have 'pending' status")
    payee_added_date_utc: datetime = Field(default_factory=datetime.utcnow)
    payee_due_date: str  # "YYYY-MM-DD" string; you might parse it or store as datetime

@app.post("/payments")
async def create_payment(payment_data: PaymentCreateModel):
    # Convert payee_due_date to a datetime if desired:
    # Or store it as string if you prefer
    try:
        due_date = datetime.strptime(payment_data.payee_due_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="payee_due_date must be in YYYY-MM-DD format")

    # Convert PaymentCreateModel to dict
    payment_dict = payment_data.dict()
    payment_dict["payee_due_date"] = due_date
    # Calculate discount_amount, tax_amount, total_due if needed
    discount_amount = round(payment_dict["due_amount"] * payment_dict["discount_percent"] / 100, 2)
    tax_amount = round((payment_dict["due_amount"] - discount_amount) * payment_dict["tax_percent"] / 100, 2)
    payment_dict["total_due"] = round(payment_dict["due_amount"] - discount_amount + tax_amount, 2)

    # Insert into MongoDB
    result = await collection.insert_one(payment_dict)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to create payment")

    return {
        "message": "Payment created successfully",
        "payment_id": str(result.inserted_id)
    }

@app.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str):
    # Validate that payment_id is a valid ObjectId
    try:
        object_id = ObjectId(payment_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid payment ID")

    # Attempt to delete
    result = await collection.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found or already deleted")

    return {"message": "Payment deleted successfully"}

# Helper function to calculate total_due
def calculate_total_due(due_amount: float, discount_percent: float = None, tax_percent: float = None) -> float:
    if discount_percent:
        due_amount -= due_amount * (discount_percent / 100)
    if tax_percent:
        due_amount += due_amount * (tax_percent / 100)
    return round(due_amount, 2)


# 1️⃣ **Get Payments API**
@app.get("/payments")
async def get_payments(
    status: str = Query(None, description="Filter by payment status"),
    search: str = Query(None, description="Search by payee name or email"),
    page: int = Query(1, description="Page number", ge=1),
    limit: int = Query(10, description="Items per page", ge=1, le=100)
):
    # Build the query
    query = {}
    if status:
        query["payee_payment_status"] = status
    if search:
        query["$or"] = [
            {"payee_first_name": {"$regex": search, "$options": "i"}},
            {"payee_last_name": {"$regex": search, "$options": "i"}},
            {"payee_email": {"$regex": search, "$options": "i"}}
        ]

    # Fetch payments with pagination
    skip = (page - 1) * limit
    payments_cursor = collection.find(query).skip(skip).limit(limit)
    payments = await payments_cursor.to_list(length=limit)

    # Process each payment
    today = datetime.now(timezone.utc).date()

    processed_payments = []
    for payment in payments:
        # Update payment status based on due date
        due_date = payment.get("payee_due_date")
        if isinstance(due_date, datetime):
            due_date = due_date.date()
        elif isinstance(due_date, str):
            due_date = datetime.strptime(due_date[:10], "%Y-%m-%d").date()

        if due_date == today:
            payment["payee_payment_status"] = "due_now"
        elif due_date < today:
            payment["payee_payment_status"] = "overdue"

        # Calculate total_due
        due_amount = payment.get("due_amount", 0)
        discount_percent = payment.get("discount_percent")
        tax_percent = payment.get("tax_percent")
        payment["total_due"] = calculate_total_due(due_amount, discount_percent, tax_percent)
        if "_id" in payment and isinstance(payment["_id"], ObjectId):
            payment["_id"] = str(payment["_id"])

        # Convert evidence_file_id to string if it exists
        if "evidence_file_id" in payment and isinstance(payment["evidence_file_id"], ObjectId):
            payment["evidence_file_id"] = str(payment["evidence_file_id"])

        processed_payments.append(payment)

    # Get total count for pagination
    total_count = await collection.count_documents(query)

    response_data = {
        "payments": processed_payments,
        "page": page,
        "limit": limit,
        "total_count": total_count
    }
    print("Final response data:", response_data)

    json_data = jsonable_encoder(response_data)

    return JSONResponse(content=json_data)
@app.get("/payments/{payment_id}")
async def get_payment_by_id(payment_id: str):
    payment = await collection.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Convert the _id field
    payment["_id"] = str(payment["_id"])
    
    # Convert evidence_file_id if it exists and is an ObjectId
    if "evidence_file_id" in payment and isinstance(payment["evidence_file_id"], ObjectId):
        payment["evidence_file_id"] = str(payment["evidence_file_id"])
    
    # If there are any other fields that might be ObjectId, convert them here.
    
    return payment


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
