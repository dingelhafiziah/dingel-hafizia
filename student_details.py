import tkinter as tk
from tkinter import messagebox
from database import get_connection


def show_student_details(parent, student_id):
    conn = get_connection()
    row = conn.execute("""
        SELECT id, roll, student_name, father_name, address,
               student_aadhaar, father_aadhaar, phone,
               admission_fees, monthly_fees, admission_date,
               category, class_name, status
        FROM students WHERE id=?
    """, (student_id,)).fetchone()
    conn.close()

    if not row:
        messagebox.showerror("Student", "Student পাওয়া যায়নি।", parent=parent)
        return

    win = tk.Toplevel(parent)
    win.title("Student Details")
    win.geometry("560x650")
    win.transient(parent)

    tk.Label(win, text="Student Details", font=("Arial", 20, "bold"),
             fg="#17324d").pack(pady=(22,18))

    card = tk.Frame(win, bd=1, relief="solid", padx=22, pady=18)
    card.pack(fill="both", expand=True, padx=25, pady=10)

    labels = [
        ("ID", row[0]), ("Roll", row[1]), ("Student Name", row[2]),
        ("Father Name", row[3]), ("Address", row[4]),
        ("Student Aadhaar", row[5]), ("Father Aadhaar", row[6]),
        ("Phone", row[7]), ("Admission Fees", row[8]),
        ("Monthly Fees", row[9]), ("Admission Date", row[10]),
        ("Category", row[11]), ("Class", row[12]), ("Status", row[13])
    ]

    for label, value in labels:
        line = tk.Frame(card)
        line.pack(fill="x", pady=5)
        tk.Label(line, text=f"{label}:", width=20, anchor="w",
                 font=("Arial", 10, "bold")).pack(side="left")
        tk.Label(line, text=str(value or ""), anchor="w",
                 wraplength=300).pack(side="left", fill="x", expand=True)

    tk.Button(win, text="Close", command=win.destroy,
              bg="#17324d", fg="white", relief="flat").pack(pady=18, ipadx=25, ipady=7)
