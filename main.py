import tkinter as tk
from tkinter import messagebox, ttk
from database import initialize_database, authenticate, get_connection


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
        tk.Button(container, text="LOGIN", font=("Arial", 11, "bold"), bg="#17324d", fg="white", relief="flat", cursor="hand2", command=self.login).pack(fill="x", padx=45, ipady=10)
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
        tk.Label(self.sidebar, text="DINGEL HAFIZIA\nMADRASAH", font=("Arial", 16, "bold"), bg="#17324d", fg="white").pack(pady=(30, 40))
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
        header = tk.Frame(self.content, bg="#f4f6f8")
        header.pack(fill="x", padx=30, pady=(25, 12))
        tk.Label(header, text="Students", font=("Arial", 24, "bold"), bg="#f4f6f8", fg="#17324d").pack(side="left")
        tk.Button(header, text="+ Add Student", font=("Arial", 11, "bold"), bg="#17324d", fg="white", relief="flat", cursor="hand2", command=self.show_add_student).pack(side="right", ipadx=12, ipady=7)

        toolbar = tk.Frame(self.content, bg="#f4f6f8")
        toolbar.pack(fill="x", padx=30, pady=5)
        tk.Label(toolbar, text="Search", bg="#f4f6f8", font=("Arial", 10, "bold")).pack(side="left")
        self.search_entry = tk.Entry(toolbar, font=("Arial", 11), width=30)
        self.search_entry.pack(side="left", padx=8, ipady=5)
        tk.Button(toolbar, text="Search", command=self.load_students).pack(side="left")
        tk.Button(toolbar, text="All", command=lambda: self.load_students("")).pack(side="left", padx=4)
        tk.Button(toolbar, text="Active", command=lambda: self.load_students(status="Active")).pack(side="left", padx=4)
        tk.Button(toolbar, text="Deactive", command=lambda: self.load_students(status="Deactive")).pack(side="left", padx=4)
        tk.Button(toolbar, text="Edit", command=self.edit_selected_student).pack(side="right", padx=4)
        tk.Button(toolbar, text="Delete", command=self.delete_selected_student).pack(side="right")

        columns = ("id", "roll", "name", "father", "class", "category", "monthly", "status")
        self.student_tree = ttk.Treeview(self.content, columns=columns, show="headings")
        headings = {"id":"ID", "roll":"Roll", "name":"Name", "father":"Father", "class":"Class", "category":"Category", "monthly":"Monthly", "status":"Status"}
        widths = {"id":45, "roll":60, "name":150, "father":130, "class":100, "category":90, "monthly":80, "status":80}
        for col in columns:
            self.student_tree.heading(col, text=headings[col])
            self.student_tree.column(col, width=widths[col], anchor="center")
        self.student_tree.pack(fill="both", expand=True, padx=30, pady=10)
        self.student_tree.bind("<Double-1>", lambda event: self.edit_selected_student())
        self.load_students()

    def load_students(self, query=None, status=None):
        if not hasattr(self, "student_tree"):
            return
        if query is None:
            query = self.search_entry.get().strip()
        else:
            self.search_entry.delete(0, tk.END)
            self.search_entry.insert(0, query)
        for item in self.student_tree.get_children():
            self.student_tree.delete(item)
        conn = get_connection()
        cur = conn.cursor()
        sql = "SELECT id, roll, student_name, father_name, class_name, category, monthly_fees, status FROM students"
        conditions = []
        params = []
        if query:
            like = f"%{query}%"
            conditions.append("(roll LIKE ? OR student_name LIKE ? OR father_name LIKE ?)")
            params += [like, like, like]
        if status:
            conditions.append("status = ?")
            params.append(status)
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY id DESC"
        cur.execute(sql, params)
        for row in cur.fetchall():
            self.student_tree.insert("", tk.END, values=row)
        conn.close()

    def get_selected_id(self):
        selected = self.student_tree.selection()
        if not selected:
            messagebox.showwarning("Student", "একজন student select করুন।")
            return None
        return self.student_tree.item(selected[0], "values")[0]

    def delete_selected_student(self):
        student_id = self.get_selected_id()
        if not student_id:
            return
        if not messagebox.askyesno("Delete Student", "এই student-কে delete করতে চান?"):
            return
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM students WHERE id = ?", (student_id,))
        conn.commit()
        conn.close()
        messagebox.showinfo("Deleted", "Student deleted successfully.")
        self.load_students()

    def edit_selected_student(self):
        student_id = self.get_selected_id()
        if not student_id:
            return
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT roll, student_name, father_name, address, student_aadhaar, father_aadhaar, phone, admission_fees, monthly_fees, admission_date, category, class_name, status FROM students WHERE id = ?", (student_id,))
        row = cur.fetchone()
        conn.close()
        if row:
            self.show_student_form(student_id, row)

    def show_add_student(self):
        self.show_student_form()

    def show_student_form(self, student_id=None, existing=None):
        self.clear_content()
        title = "Edit Student" if student_id else "Add Student"
        tk.Label(self.content, text=title, font=("Arial", 24, "bold"), bg="#f4f6f8", fg="#17324d").pack(anchor="w", padx=35, pady=(25, 15))
        form = tk.Frame(self.content, bg="#f4f6f8")
        form.pack(fill="both", expand=True, padx=35)
        fields = [
            ("Roll", "roll"), ("Student Name", "student_name"), ("Father Name", "father_name"), ("Address", "address"),
            ("Student Aadhaar", "student_aadhaar"), ("Father Aadhaar", "father_aadhaar"), ("Phone Number", "phone"),
            ("Admission Fees", "admission_fees"), ("Monthly Fees", "monthly_fees"), ("Admission Date", "admission_date")
        ]
        self.student_vars = {}
        for i, (label, key) in enumerate(fields):
            r, c = divmod(i, 2)
            tk.Label(form, text=label, bg="#f4f6f8", font=("Arial", 10, "bold")).grid(row=r*2, column=c, sticky="w", padx=8, pady=(7, 2))
            var = tk.StringVar(value="" if existing is None else str(existing[i]))
            self.student_vars[key] = var
            tk.Entry(form, textvariable=var, font=("Arial", 11), width=34).grid(row=r*2+1, column=c, sticky="ew", padx=8, ipady=5)
        for c in range(2):
            form.columnconfigure(c, weight=1)

        self.category_var = tk.StringVar(value="Paid" if existing is None else existing[10])
        self.class_var = tk.StringVar(value="Maktab" if existing is None else existing[11])
        self.status_var = tk.StringVar(value="Active" if existing is None else existing[12])
        controls = [("Category", self.category_var, ["Atim", "Free", "Paid"]), ("Class", self.class_var, ["Maktab", "Hifz", "Adna Alif", "Adna Ba"]), ("Status", self.status_var, ["Active", "Deactive"])]
        for i, (label, var, values) in enumerate(controls):
            c = i % 2
            r = 10 + (i // 2) * 2
            tk.Label(form, text=label, bg="#f4f6f8", font=("Arial", 10, "bold")).grid(row=r*2, column=c, sticky="w", padx=8, pady=(7, 2))
            ttk.Combobox(form, textvariable=var, values=values, state="readonly").grid(row=r*2+1, column=c, sticky="ew", padx=8, ipady=4)
        tk.Button(form, text="Save Student", font=("Arial", 11, "bold"), bg="#17324d", fg="white", relief="flat", command=lambda: self.save_student(student_id)).grid(row=25, column=0, pady=20, padx=8, sticky="w", ipadx=20, ipady=8)
        tk.Button(form, text="Cancel", command=self.show_students).grid(row=25, column=1, pady=20, padx=8, sticky="w", ipadx=20, ipady=8)

    def save_student(self, student_id=None):
        data = {k: v.get().strip() for k, v in self.student_vars.items()}
        if not data["roll"] or not data["student_name"] or not data["father_name"]:
            messagebox.showwarning("Required", "Roll, Student Name এবং Father Name অবশ্যই দিতে হবে।")
            return
        try:
            admission = float(data["admission_fees"] or 0)
            monthly = float(data["monthly_fees"] or 0)
        except ValueError:
            messagebox.showerror("Invalid", "Fees সংখ্যায় দিন।")
            return
        if self.category_var.get() in ("Atim", "Free"):
            monthly = 0
        values = (data["roll"], data["student_name"], data["father_name"], data["address"], data["student_aadhaar"], data["father_aadhaar"], data["phone"], admission, monthly, data["admission_date"], self.category_var.get(), self.class_var.get(), self.status_var.get())
        conn = get_connection()
        cur = conn.cursor()
        if student_id:
            cur.execute("UPDATE students SET roll=?, student_name=?, father_name=?, address=?, student_aadhaar=?, father_aadhaar=?, phone=?, admission_fees=?, monthly_fees=?, admission_date=?, category=?, class_name=?, status=? WHERE id=?", values + (student_id,))
        else:
            cur.execute("INSERT INTO students (roll, student_name, father_name, address, student_aadhaar, father_aadhaar, phone, admission_fees, monthly_fees, admission_date, category, class_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values)
        conn.commit()
        conn.close()
        messagebox.showinfo("Saved", "Student information saved successfully.")
        self.show_students()

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
