
import sqlite3

connection = sqlite3.connect("kisanflow.db")

cursor = connection.cursor()

try:
    cursor.execute(
        "ALTER TABLE slot_bookings ADD COLUMN slot_time TEXT"
    )

    print("slot_time column added successfully.")

except sqlite3.OperationalError as error:
    if "duplicate column name" in str(error).lower():
        print("slot_time column already exists.")
    else:
        print("Database update failed:")
        print(error)

connection.commit()
connection.close()

print("Database update completed.")
