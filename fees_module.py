import tkinter as tk
from tkinter import ttk, messagebox
from database import get_connection
from payment_history import PaymentHistoryWindow


class FeesModule:
    """Standalone Fees UI module for the Dingel Hafizia desktop app."""

    def __init__(self, parent, on_close=None):
        self.parent = parent
        self.on_close = on_close
        self.frame = tk.Frame(parent, bg="#f4f6f8")
        self.frame.pack(fill="both", expand=True)
        self.build()
        self.load_students()

    def build(self):
        top = tk.Frame(self.frame, bg="#f4f6f8")
        top.pack(fill="x", padx=25, pady=20)
        tk.Label(top, text="Fees", font=("Arial", 24, "bold"), bg="#f4f6f8", fg="#17324d").pack(side="left")
        tk.Button(top, text="+ Add Payment", command=self.add_payment,
                  bg="#17324d", fg="white", relief="flat",
                  font=("Arial", 11, "bold"), padx=15, pady=7).pack(side="right")

        search = tk.Frame(self.frame, bg="#f4f6f8")
        search.pack(fill="x", padx=25)
        tk.Label(search, text="Search Student", bg="#f4f6f8").pack(side="left")
        self.search_var = tk.StringVar()
        entry = tk.Entry(search, textvariable=self.search_var, width=30)
        entry.pack(side="left", padx=8, ipady=5)
        entry.bind("<Return>", lambda e: self.load_students())
        tk.Button(search, text="Search", command=self.load_students).pack(side="left")
        tk.Button(search, text="Payment History", command=self.open_history).pack(side="right")

        columns = ("id", "roll", "name", "monthly", "paid", "due")
        self.tree = ttk.Treeview(self.frame, columns=columns, show="headings")
        titles = {"id":"ID", "roll":"Roll", "name":"Student", "monthly":"Monthly Fee", "paid":"Paid", "due":"Due"}
        for col in columns:
            self.tree.heading(col, text=titles[col])
            self.tree.column(col, width=110 if col != "name" else 180, anchor="center")
        self.tree.pack(fill="both", expand=True, padx=25, pady=12)
        self.tree.bind("<Double-1>", lambda e: self.open_history())

    def load_students(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
        query = self.search_var.get().strip()
        conn = get_connection()
        cur = conn.cursor()
        sql = "SELECT id, roll, student_name, monthly_fees FROM students"
        params = []
        if query:
            like = f"%{query}%"
            sql += " WHERE roll LIKE ? OR student_name LIKE ? OR father_name LIKE ?"
            params = [like, like, like]
        cur.execute(sql + " ORDER BY id DESC", params)
        students = cur.fetchall()
        for sid, roll, name, monthly in students:
            cur.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE student_id=?", (sid,))
            paid = float(cur.fetchone()[0] or 0)
            monthly = float(monthly or 0)
            due = max(monthly - paid, 0)
            self.tree.insert("", tk.END, values=(sid, roll, name, f"{monthly:.2f}", f"{paid:.2f}", f"{due:.2f}"))
        conn.close()

    def selected(self):
        items = self.tree.selection()
        if not items:
            messagebox.showwarning("Fees", "একজন student select করুন।")
            return None
        return self.tree.item(items[0], "values")

    def open_history(self):
        row = self.selected()
        if row:
            PaymentHistoryWindow(self.parent, row[0], row[2])

    def add_payment(self):
        selected = self.tree.selection()
        selected_id = self.tree.item(selected[0], "values")[0] if selected else None
        win = tk.Toplevel(self.parent)
        win.title("Add Fee Payment")
        win.geometry("430x430")
        win.transient(self.parent)
        win.grab_set()
        box = tk.Frame(win, padx=25, pady=20)
        box.pack(fill="both", expand=True)

        students = self.get_active_students()
        labels = [f"{sid} - {roll} - {name}" for sid, roll, name in students]
        choice = tk.StringVar()
        tk.Label(box, text="Student").pack(anchor="w")
        combo = ttk.Combobox(box, textvariable=choice, values=labels, state="readonly")
        combo.pack(fill="x", pady=(4,12), ipady=4)
        if selected_id:
            for i, row in enumerate(students):
                if str(row[0]) == str(selected_id):
                    combo.current(i)
                    break

        vars_ = {}
        for label in ("Payment Month", "Paid Amount", "Payment Date", "Note"):
            tk.Label(box, text=label).pack(anchor="w")
            var = tk.StringVar()
            vars_[label] = var
            tk.Entry(box, textvariable=var).pack(fill="x", pady=(4,10), ipady=4)

        def save():
            if not choice.get() or not vars_["Payment Month"].get().strip() or not vars_["Paid Amount"].get().strip() or not vars_["Payment Date"].get().strip():
                messagebox.showwarning("Required", "Student, month, amount এবং date দিন.", parent=win)
                return
            try:
                amount = float(vars_["Paid Amount"].get())
            except ValueError:
                messagebox.showerror("Invalid", "Paid Amount সংখ্যায় দিন.", parent=win)
                return
            sid = int(choice.get().split(" - ", 1)[0])
            conn = get_connection()
            conn.execute("INSERT INTO fee_payments (student_id,payment_month,amount,payment_date,note) VALUES (?,?,?,?,?)", (sid, vars_["Payment Month"].get().strip(), amount, vars_["Payment Date"].get().strip(), vars_["Note"].get().strip()))
            conn.commit()
            conn.close()
            win.destroy()
            self.load_students()
            messagebox.showinfo("Saved", "Payment saved successfully.")

        tk.Button(box, text="Save Payment", command=save, bg="#17324d", fg="white", relief="flat", pady=8).pack(fill="x", pady=5)

    @staticmethod
    def get_active_students():
        conn = get_connection()
        rows = conn.execute("SELECT id, roll, student_name FROM students WHERE status='Active' ORDER BY roll").fetchall()
        conn.close()
        return rows
