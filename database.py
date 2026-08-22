import sqlite3
import hashlib

DB_NAME = "app.db"


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


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
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fee_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            payment_month TEXT NOT NULL,
            amount REAL NOT NULL DEFAULT 0,
            payment_date TEXT NOT NULL,
            note TEXT,
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_name ON students(student_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fee_student ON fee_payments(student_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fee_month ON fee_payments(payment_month)")

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


def add_payment(student_id, payment_month, amount, payment_date, note=""):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO fee_payments (student_id, payment_month, amount, payment_date, note) VALUES (?, ?, ?, ?, ?)",
        (student_id, payment_month, amount, payment_date, note)
    )
    payment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return payment_id


def get_payment_history(student_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, payment_month, amount, payment_date, note FROM fee_payments WHERE student_id = ? ORDER BY payment_date DESC, id DESC",
        (student_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return rows


def delete_payment(payment_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fee_payments WHERE id = ?", (payment_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
