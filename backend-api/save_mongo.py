import pandas as pd
from pymongo import MongoClient
# Define the file path
file_path = "payment_information.csv"

# Load the CSV file into a DataFrame
df = pd.read_csv(file_path)

# Convert payee_added_date_utc from UNIX timestamp to readable datetime format
df["payee_added_date_utc"] = pd.to_datetime(df["payee_added_date_utc"], unit="s")

# Ensure payee_country uses uppercase ISO 3166-1 alpha-2 codes
df["payee_country"] = df["payee_country"].str.upper()

# Ensure payee_phone_number is in E.164 format (prepend + if missing)
df["payee_phone_number"] = df["payee_phone_number"].astype(str).apply(lambda x: "+" + x if not x.startswith("+") else x)

# Convert payee_due_date to datetime format
df["payee_due_date"] = pd.to_datetime(df["payee_due_date"], format="%Y-%m-%d")

# Calculate discount_amount
df["discount_amount"] = (df["due_amount"] * df["discount_percent"] / 100).round(2)

# Calculate tax_amount
df["tax_amount"] = ((df["due_amount"] - df["discount_amount"]) * df["tax_percent"] / 100).round(2)

# Calculate total_due: (due_amount - discount) + tax
df["total_due"] = (df["due_amount"] - df["discount_amount"] + df["tax_amount"]).round(2)

# Ensure mandatory fields are non-empty
mandatory_fields = [
    "payee_address_line_1", "payee_city", "payee_country", 
    "payee_postal_code", "payee_phone_number", "payee_email", 
    "currency", "due_amount"
]

# Drop rows with missing mandatory fields
df.dropna(subset=mandatory_fields, inplace=True)

# Connect to MongoDB Atlas
mongo_uri = "mongodb+srv://artan1s:Xf201701@cluster0.9vgwm.mongodb.net/"
client = MongoClient(mongo_uri)

# Select database and collection
db = client["payments_db"]  # Change to your database name
collection = db["payments"]  # Change to your collection name

# Insert data into MongoDB
data_dict = df.to_dict(orient="records")
collection.insert_many(data_dict)

print(f"Inserted {collection.count_documents({})} records into MongoDB Atlas.")