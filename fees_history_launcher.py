import tkinter as tk
from payment_history import PaymentHistoryWindow


def open_payment_history(parent, student_id, student_name):
    """Open payment history for a selected student."""
    return PaymentHistoryWindow(parent, student_id, student_name)


if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()
    # This helper is imported by the main application.
    root.mainloop()
