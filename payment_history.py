import tkinter as tk
from tkinter import messagebox, ttk
from database import get_connection, delete_payment


class PaymentHistoryWindow:
    """Reusable payment-history window for a selected student."""

    def __init__(self, parent, student_id, student_name):
        self.parent = parent
        self.student_id = student_id
        self.student_name = student_name

        self.window = tk.Toplevel(parent)
        self.window.title(f"Payment History - {student_name}")
        self.window.geometry("760x450")
        self.window.transient(parent)
        self.window.grab_set()

        tk.Label(
            self.window,
            text=f"Payment History: {student_name}",
            font=("Arial", 18, "bold")
        ).pack(anchor="w", padx=20, pady=(20, 10))

        columns = ("id", "month", "amount", "date", "note")
        self.tree = ttk.Treeview(
            self.window,
            columns=columns,
            show="headings"
        )

        headings = {
            "id": "ID",
            "month": "Month",
            "amount": "Amount",
            "date": "Payment Date",
            "note": "Note",
        }

        widths = {
            "id": 55,
            "month": 120,
            "amount": 100,
            "date": 120,
            "note": 280,
        }

        for column in columns:
            self.tree.heading(column, text=headings[column])
            self.tree.column(column, width=widths[column], anchor="center")

        self.tree.pack(fill="both", expand=True, padx=20, pady=10)

        bottom = tk.Frame(self.window)
        bottom.pack(fill="x", padx=20, pady=(0, 15))

        tk.Button(
            bottom,
            text="Delete Selected Payment",
            command=self.delete_selected,
            bg="#9b1c1c",
            fg="white",
            relief="flat",
            padx=12,
            pady=7,
        ).pack(side="left")

        tk.Button(
            bottom,
            text="Close",
            command=self.window.destroy,
            padx=15,
            pady=7,
        ).pack(side="right")

        self.load_history()

    def load_history(self):
        for item in self.tree.get_children():
            self.tree.delete(item)

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, payment_month, amount, payment_date, note
            FROM fee_payments
            WHERE student_id = ?
            ORDER BY payment_date DESC, id DESC
            """,
            (self.student_id,),
        )
        rows = cursor.fetchall()
        conn.close()

        for payment_id, month, amount, payment_date, note in rows:
            self.tree.insert(
                "",
                tk.END,
                values=(
                    payment_id,
                    month,
                    f"{float(amount):.2f}",
                    payment_date,
                    note or "",
                ),
            )

    def delete_selected(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning(
                "Payment",
                "একটি payment select করুন।",
                parent=self.window,
            )
            return

        values = self.tree.item(selected[0], "values")
        payment_id = values[0]

        if not messagebox.askyesno(
            "Delete Payment",
            "এই payment record delete করতে চান?",
            parent=self.window,
        ):
            return

        if delete_payment(payment_id):
            self.load_history()
            messagebox.showinfo(
                "Deleted",
                "Payment record deleted successfully.",
                parent=self.window,
            )
        else:
            messagebox.showerror(
                "Error",
                "Payment record পাওয়া যায়নি।",
                parent=self.window,
            )
