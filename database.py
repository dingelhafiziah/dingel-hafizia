import sqlite3
import hashlib

DB_NAME = "app.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def initialize_database():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roll TEXT NOT NULL,
            student_name TEXT NOT NULL,
            father_name TEXT NOT NULL,
            address TEXT,
            student_aadhaar TEXT,
            father_aadhaar TEXT,
            phone TEXT,
            admission_fees REAL DEFAULT 0,
            monthly_fees REAL DEFAULT 0,
            admission_date TEXT,
            category TEXT,
            class_name TEXT,
            status TEXT DEFAULT 'Active'
        )
    """)

    cursor.execute("SELECT id FROM users WHERE username = ?", ("admin",))
    if cursor.fetchone() is None:
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            ("admin", hash_password("admin123"))
        )

    conn.commit()
    conn.close()


def authenticate(username, password):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM users WHERE username = ? AND password = ?",
        (username, hash_password(password))
    )
    user = cursor.fetchone()
    conn.close()
    return user is not None
