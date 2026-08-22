import tkinter as tk
from tkinter import messagebox
from database import initialize_database, authenticate


class DingelHafiziaApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Dingel Hafizia Madrasa")
        self.root.geometry("1100x650")
        self.root.minsize(900, 550)
        initialize_database()
        self.show_login()

    def clear_window(self):
        for widget in self.root.winfo_children():
            widget.destroy()

    def show_login(self):
        self.clear_window()
        self.root.configure(bg="#f4f6f8")

        container = tk.Frame(self.root, bg="white", width=400, height=430)
        container.place(relx=0.5, rely=0.5, anchor="center")
        container.pack_propagate(False)

        tk.Label(container, text="Dingel Hafizia Madrasa", font=("Arial", 22, "bold"), bg="white", fg="#17324d").pack(pady=(45, 8))
        tk.Label(container, text="Admin Login", font=("Arial", 13), bg="white", fg="#666666").pack(pady=(0, 30))

        tk.Label(container, text="Username", font=("Arial", 11, "bold"), bg="white").pack(anchor="w", padx=45)
        self.username_entry = tk.Entry(container, font=("Arial", 12), relief="solid", bd=1)
        self.username_entry.pack(fill="x", padx=45, ipady=8, pady=(5, 18))

        tk.Label(container, text="Password", font=("Arial", 11, "bold"), bg="white").pack(anchor="w", padx=45)
        self.password_entry = tk.Entry(container, font=("Arial", 12), show="*", relief="solid", bd=1)
        self.password_entry.pack(fill="x", padx=45, ipady=8, pady=(5, 25))

        tk.Button(container, text="LOGIN", font=("Arial", 11, "bold"), bg="#17324d", fg="white", activebackground="#234b70", activeforeground="white", relief="flat", cursor="hand2", command=self.login).pack(fill="x", padx=45, ipady=10)
        self.password_entry.bind("<Return>", lambda event: self.login())
        self.username_entry.focus()

    def login(self):
        username = self.username_entry.get().strip()
        password = self.password_entry.get()
        if not username or not password:
            messagebox.showwarning("Login", "Username and password দিন।")
            return
        if authenticate(username, password):
            self.show_main_app()
        else:
            messagebox.showerror("Login Failed", "Username অথবা password ভুল।")

    def show_main_app(self):
        self.clear_window()
        self.root.configure(bg="#f4f6f8")

        self.sidebar = tk.Frame(self.root, bg="#17324d", width=240)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        tk.Label(self.sidebar, text="DINGEL HAFIZIA\nMADRASAH", font=("Arial", 16, "bold"), bg="#17324d", fg="white", justify="center").pack(pady=(30, 40))
        self.create_menu_button("Dashboard", self.show_dashboard)
        self.create_menu_button("Students", self.show_students)
        self.create_menu_button("Fees", self.show_fees)
        self.create_menu_button("Settings", self.show_settings)
        tk.Frame(self.sidebar, bg="#17324d").pack(expand=True, fill="both")
        self.create_menu_button("Logout", self.logout)

        self.content = tk.Frame(self.root, bg="#f4f6f8")
        self.content.pack(side="left", fill="both", expand=True)
        self.show_dashboard()

    def create_menu_button(self, text, command):
        tk.Button(self.sidebar, text=text, font=("Arial", 12), bg="#17324d", fg="white", activebackground="#284d70", activeforeground="white", anchor="w", padx=25, relief="flat", bd=0, cursor="hand2", command=command).pack(fill="x", ipady=13)

    def clear_content(self):
        for widget in self.content.winfo_children():
            widget.destroy()

    def show_dashboard(self):
        self.clear_content()

    def show_students(self):
        self.clear_content()
        tk.Label(self.content, text="Students", font=("Arial", 24, "bold"), bg="#f4f6f8", fg="#17324d").pack(anchor="w", padx=35, pady=(30, 20))

    def show_fees(self):
        self.clear_content()
        tk.Label(self.content, text="Fees", font=("Arial", 24, "bold"), bg="#f4f6f8", fg="#17324d").pack(anchor="w", padx=35, pady=(30, 20))

    def show_settings(self):
        self.clear_content()
        tk.Label(self.content, text="Settings", font=("Arial", 24, "bold"), bg="#f4f6f8", fg="#17324d").pack(anchor="w", padx=35, pady=(30, 20))

    def logout(self):
        if messagebox.askyesno("Logout", "আপনি কি Logout করতে চান?"):
            self.show_login()


if __name__ == "__main__":
    root = tk.Tk()
    DingelHafiziaApp(root)
    root.mainloop()
