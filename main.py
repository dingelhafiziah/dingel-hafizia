import tkinter as tk
from tkinter import messagebox, ttk
from database import initialize_database, authenticate, get_connection


class DingelHafiziaApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Dingel Hafizia Madrasa")
        self.root.geometry("1150x680")
        self.root.minsize(950, 580)
        initialize_database()
        self.show_login()

    def clear_window(self):
        for widget in self.root.winfo_children():
            widget.destroy()

    def clear_content(self):
        for widget in self.content.winfo_children():
            widget.destroy()

    def show_login(self):
        self.clear_window()
        self.root.configure(bg="#f4f6f8")
        box = tk.Frame(self.root, bg="white", width=410, height=430)
        box.place(relx=0.5, rely=0.5, anchor="center")
        box.pack_propagate(False)
        tk.Label(box, text="Dingel Hafizia Madrasa", font=("Arial", 22, "bold"), bg="white", fg="#17324d").pack(pady=(45, 8))
        tk.Label(box, text="Admin Login", font=("Arial", 13), bg="white", fg="#666").pack(pady=(0, 30))
        tk.Label(box, text="Username", bg="white", font=("Arial", 11, "bold")).pack(anchor="w", padx=45)
        self.username_entry = tk.Entry(box, font=("Arial", 12))
        self.username_entry.pack(fill="x", padx=45, ipady=8, pady=(5, 18))
        tk.Label(box, text="Password", bg="white", font=("Arial", 11, "bold")).pack(anchor="w", padx=45)
        self.password_entry = tk.Entry(box, font=("Arial", 12), show="*")
        self.password_entry.pack(fill="x", padx=45, ipady=8, pady=(5, 25))
        tk.Button(box, text="LOGIN", command=self.login, bg="#17324d", fg="white", relief="flat", font=("Arial", 11, "bold")).pack(fill="x", padx=45, ipady=10)
        self.password_entry.bind("<Return>", lambda e: self.login())
        self.username_entry.focus()

    def login(self):
        if authenticate(self.username_entry.get().strip(), self.password_entry.get()):
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
        for text, command in [("Dashboard", self.show_dashboard), ("Students", self.show_students), ("Fees", self.show_fees), ("Settings", self.show_settings)]:
            tk.Button(self.sidebar, text=text, command=command, anchor="w", padx=25, bg="#17324d", fg="white", activebackground="#284d70", activeforeground="white", relief="flat", font=("Arial", 12), cursor="hand2").pack(fill="x", ipady=13)
        tk.Frame(self.sidebar, bg="#17324d").pack(expand=True, fill="both")
        tk.Button(self.sidebar, text="Logout", command=self.logout, anchor="w", padx=25, bg="#17324d", fg="white", activebackground="#284d70", activeforeground="white", relief="flat", font=("Arial", 12)).pack(fill="x", ipady=13)
        self.content = tk.Frame(self.root, bg="#f4f6f8")
        self.content.pack(side="left", fill="both", expand=True)
        self.show_dashboard()

    def show_dashboard(self):
        self.clear_content()  # Dashboard intentionally empty for now.

    # ---------------- STUDENTS ----------------
    def show_students(self):
        self.clear_content()
        top = tk.Frame(self.content, bg="#f4f6f8")
        top.pack(fill="x", padx=30, pady=(25, 12))
        tk.Label(top, text="Students", font=("Arial", 24, "bold"), bg="#f4f6f8", fg="#17324d").pack(side="left")
        tk.Button(top, text="+ Add Student", command=self.show_add_student, bg="#17324d", fg="white", relief="flat", font=("Arial", 11, "bold")).pack(side="right", ipadx=12, ipady=7)
        bar = tk.Frame(self.content, bg="#f4f6f8")
        bar.pack(fill="x", padx=30)
        tk.Label(bar, text="Search", bg="#f4f6f8", font=("Arial", 10, "bold")).pack(side="left")
        self.student_search = tk.Entry(bar, width=30, font=("Arial", 11))
        self.student_search.pack(side="left", padx=8, ipady=5)
        tk.Button(bar, text="Search", command=self.load_students).pack(side="left")
        for text, status in [("All", None), ("Active", "Active"), ("Deactive", "Deactive")]:
            tk.Button(bar, text=text, command=lambda s=status: self.load_students(status=s)).pack(side="left", padx=4)
        tk.Button(bar, text="Edit", command=self.edit_selected_student).pack(side="right", padx=4)
        tk.Button(bar, text="Delete", command=self.delete_selected_student).pack(side="right")
        cols = ("id", "roll", "name", "father", "class", "category", "monthly", "status")
        self.student_tree = ttk.Treeview(self.content, columns=cols, show="headings")
        heads = {"id":"ID", "roll":"Roll", "name":"Name", "father":"Father", "class":"Class", "category":"Category", "monthly":"Monthly", "status":"Status"}
        for col in cols:
            self.student_tree.heading(col, text=heads[col])
            self.student_tree.column(col, width=70 if col in ("id", "roll", "monthly", "status") else 135, anchor="center")
        self.student_tree.pack(fill="both", expand=True, padx=30, pady=10)
        self.student_tree.bind("<Double-1>", lambda e: self.edit_selected_student())
        self.load_students()

    def load_students(self, query=None, status=None):
        if not hasattr(self, "student_tree"): return
        if query is None: query = self.student_search.get().strip()
        else:
            self.student_search.delete(0, tk.END); self.student_search.insert(0, query)
        for item in self.student_tree.get_children(): self.student_tree.delete(item)
        conn = get_connection(); cur = conn.cursor()
        sql = "SELECT id, roll, student_name, father_name, class_name, category, monthly_fees, status FROM students"
        cond, params = [], []
        if query:
            like = f"%{query}%"; cond.append("(roll LIKE ? OR student_name LIKE ? OR father_name LIKE ?)"); params += [like, like, like]
        if status: cond.append("status = ?"); params.append(status)
        if cond: sql += " WHERE " + " AND ".join(cond)
        cur.execute(sql + " ORDER BY id DESC", params)
        for row in cur.fetchall(): self.student_tree.insert("", tk.END, values=row)
        conn.close()

    def selected_student_id(self):
        selected = self.student_tree.selection()
        if not selected:
            messagebox.showwarning("Student", "একজন student select করুন।"); return None
        return self.student_tree.item(selected[0], "values")[0]

    def delete_selected_student(self):
        sid = self.selected_student_id()
        if not sid or not messagebox.askyesno("Delete", "এই student-কে delete করতে চান?"): return
        conn = get_connection(); cur = conn.cursor(); cur.execute("DELETE FROM students WHERE id=?", (sid,)); conn.commit(); conn.close()
        self.load_students(); messagebox.showinfo("Deleted", "Student deleted successfully.")

    def edit_selected_student(self):
        sid = self.selected_student_id()
        if not sid: return
        conn = get_connection(); cur = conn.cursor()
        cur.execute("SELECT roll, student_name, father_name, address, student_aadhaar, father_aadhaar, phone, admission_fees, monthly_fees, admission_date, category, class_name, status FROM students WHERE id=?", (sid,))
        row = cur.fetchone(); conn.close()
        if row: self.show_student_form(sid, row)

    def show_add_student(self): self.show_student_form()

    def show_student_form(self, student_id=None, existing=None):
        self.clear_content()
        tk.Label(self.content, text="Edit Student" if student_id else "Add Student", font=("Arial", 24, "bold"), bg="#f4f6f8", fg="#17324d").pack(anchor="w", padx=35, pady=(25, 15))
        form = tk.Frame(self.content, bg="#f4f6f8"); form.pack(fill="both", expand=True, padx=35)
        fields = [("Roll","roll"),("Student Name","student_name"),("Father Name","father_name"),("Address","address"),("Student Aadhaar","student_aadhaar"),("Father Aadhaar","father_aadhaar"),("Phone Number","phone"),("Admission Fees","admission_fees"),("Monthly Fees","monthly_fees"),("Admission Date","admission_date")]
        self.student_vars = {}
        for i,(label,key) in enumerate(fields):
            r,c=divmod(i,2); tk.Label(form,text=label,bg="#f4f6f8",font=("Arial",10,"bold")).grid(row=r*2,column=c,sticky="w",padx=8,pady=(7,2))
            var=tk.StringVar(value="" if existing is None else str(existing[i])); self.student_vars[key]=var
            tk.Entry(form,textvariable=var,font=("Arial",11)).grid(row=r*2+1,column=c,sticky="ew",padx=8,ipady=5)
        form.columnconfigure(0,weight=1); form.columnconfigure(1,weight=1)
        self.category_var=tk.StringVar(value="Paid" if existing is None else existing[10]); self.class_var=tk.StringVar(value="Maktab" if existing is None else existing[11]); self.status_var=tk.StringVar(value="Active" if existing is None else existing[12])
        for i,(label,var,values) in enumerate([("Category",self.category_var,["Atim","Free","Paid"]),("Class",self.class_var,["Maktab","Hifz","Adna Alif","Adna Ba"]),("Status",self.status_var,["Active","Deactive"])]):
            r=10+(i//2)*2; c=i%2; tk.Label(form,text=label,bg="#f4f6f8",font=("Arial",10,"bold")).grid(row=r*2,column=c,sticky="w",padx=8,pady=(7,2)); ttk.Combobox(form,textvariable=var,values=values,state="readonly").grid(row=r*2+1,column=c,sticky="ew",padx=8,ipady=4)
        tk.Button(form,text="Save Student",command=lambda:self.save_student(student_id),bg="#17324d",fg="white",relief="flat",font=("Arial",11,"bold")).grid(row=25,column=0,pady=20,padx=8,sticky="w",ipadx=20,ipady=8)
        tk.Button(form,text="Cancel",command=self.show_students).grid(row=25,column=1,pady=20,padx=8,sticky="w",ipadx=20,ipady=8)

    def save_student(self, student_id=None):
        data={k:v.get().strip() for k,v in self.student_vars.items()}
        if not data["roll"] or not data["student_name"] or not data["father_name"]:
            messagebox.showwarning("Required","Roll, Student Name এবং Father Name অবশ্যই দিতে হবে।"); return
        try: admission=float(data["admission_fees"] or 0); monthly=float(data["monthly_fees"] or 0)
        except ValueError: messagebox.showerror("Invalid","Fees সংখ্যায় দিন।"); return
        if self.category_var.get() in ("Atim","Free"): monthly=0
        values=(data["roll"],data["student_name"],data["father_name"],data["address"],data["student_aadhaar"],data["father_aadhaar"],data["phone"],admission,monthly,data["admission_date"],self.category_var.get(),self.class_var.get(),self.status_var.get())
        conn=get_connection(); cur=conn.cursor()
        if student_id: cur.execute("UPDATE students SET roll=?,student_name=?,father_name=?,address=?,student_aadhaar=?,father_aadhaar=?,phone=?,admission_fees=?,monthly_fees=?,admission_date=?,category=?,class_name=?,status=? WHERE id=?",values+(student_id,))
        else: cur.execute("INSERT INTO students (roll,student_name,father_name,address,student_aadhaar,father_aadhaar,phone,admission_fees,monthly_fees,admission_date,category,class_name,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",values)
        conn.commit(); conn.close(); messagebox.showinfo("Saved","Student information saved successfully."); self.show_students()

    # ---------------- FEES ----------------
    def show_fees(self):
        self.clear_content()
        top=tk.Frame(self.content,bg="#f4f6f8"); top.pack(fill="x",padx=30,pady=(25,12))
        tk.Label(top,text="Fees",font=("Arial",24,"bold"),bg="#f4f6f8",fg="#17324d").pack(side="left")
        tk.Button(top,text="+ Add Payment",command=self.show_payment_form,bg="#17324d",fg="white",relief="flat",font=("Arial",11,"bold")).pack(side="right",ipadx=12,ipady=7)
        bar=tk.Frame(self.content,bg="#f4f6f8"); bar.pack(fill="x",padx=30)
        tk.Label(bar,text="Search Student",bg="#f4f6f8").pack(side="left")
        self.fee_search=tk.Entry(bar,width=30); self.fee_search.pack(side="left",padx=8,ipady=5)
        tk.Button(bar,text="Search",command=self.load_fee_students).pack(side="left")
        cols=("id","roll","name","monthly","paid","due")
        self.fee_tree=ttk.Treeview(self.content,columns=cols,show="headings")
        heads={"id":"ID","roll":"Roll","name":"Student","monthly":"Monthly Fee","paid":"Paid","due":"Due"}
        for col in cols: self.fee_tree.heading(col,text=heads[col]); self.fee_tree.column(col,width=120 if col=="name" else 90,anchor="center")
        self.fee_tree.pack(fill="both",expand=True,padx=30,pady=10)
        self.fee_tree.bind("<Double-1>",lambda e:self.show_payment_form())
        self.load_fee_students()

    def load_fee_students(self):
        q=self.fee_search.get().strip() if hasattr(self,"fee_search") else ""
        for item in self.fee_tree.get_children(): self.fee_tree.delete(item)
        conn=get_connection(); cur=conn.cursor()
        sql="SELECT id,roll,student_name,monthly_fees FROM students"; params=[]
        if q: sql+=" WHERE roll LIKE ? OR student_name LIKE ? OR father_name LIKE ?"; like=f"%{q}%"; params=[like,like,like]
        cur.execute(sql+" ORDER BY id DESC",params); rows=cur.fetchall()
        for sid,roll,name,monthly in rows:
            cur.execute("SELECT COALESCE(SUM(amount),0) FROM fee_payments WHERE student_id=?",(sid,)); paid=cur.fetchone()[0]
            due=max(float(monthly)-float(paid),0)
            self.fee_tree.insert("",tk.END,values=(sid,roll,name,f"{monthly:.2f}",f"{paid:.2f}",f"{due:.2f}"))
        conn.close()

    def show_payment_form(self):
        selected=self.fee_tree.selection() if hasattr(self,"fee_tree") else []
        sid=self.fee_tree.item(selected[0],"values")[0] if selected else None
        win=tk.Toplevel(self.root); win.title("Add Fee Payment"); win.geometry("430x400"); win.transient(self.root); win.grab_set()
        frame=tk.Frame(win,padx=25,pady=25); frame.pack(fill="both",expand=True)
        tk.Label(frame,text="Student",font=("Arial",10,"bold")).pack(anchor="w")
        students=self.get_student_choices(); labels=[f"{x[0]} - {x[1]} ({x[2]})" for x in students]
        choice=tk.StringVar(); combo=ttk.Combobox(frame,textvariable=choice,values=labels,state="readonly"); combo.pack(fill="x",pady=(4,15),ipady=4)
        if sid:
            for i,x in enumerate(students):
                if str(x[0])==str(sid): combo.current(i); break
        for label in ["Payment Month","Paid Amount","Payment Date","Note"]: tk.Label(frame,text=label,font=("Arial",10,"bold")).pack(anchor="w")
        month=tk.Entry(frame); month.pack(fill="x",pady=(4,10),ipady=4)
        amount=tk.Entry(frame); amount.pack(fill="x",pady=(4,10),ipady=4)
        date=tk.Entry(frame); date.pack(fill="x",pady=(4,10),ipady=4)
        note=tk.Entry(frame); note.pack(fill="x",pady=(4,15),ipady=4)
        def save():
            if not choice.get() or not month.get().strip() or not amount.get().strip() or not date.get().strip(): messagebox.showwarning("Required","Student, month, amount এবং date দিন।",parent=win); return
            try: amt=float(amount.get())
            except ValueError: messagebox.showerror("Invalid","Paid Amount সংখ্যায় দিন।",parent=win); return
            student_id=int(choice.get().split(" - ",1)[0]); conn=get_connection(); cur=conn.cursor(); cur.execute("INSERT INTO fee_payments (student_id,payment_month,amount,payment_date,note) VALUES (?,?,?,?,?)",(student_id,month.get().strip(),amt,date.get().strip(),note.get().strip())); conn.commit(); conn.close(); win.destroy(); self.load_fee_students(); messagebox.showinfo("Saved","Payment saved successfully.")
        tk.Button(frame,text="Save Payment",command=save,bg="#17324d",fg="white",relief="flat",font=("Arial",11,"bold")).pack(fill="x",ipady=8)

    def get_student_choices(self):
        conn=get_connection(); cur=conn.cursor(); cur.execute("SELECT id,roll,student_name FROM students WHERE status='Active' ORDER BY roll"); rows=cur.fetchall(); conn.close(); return rows

    def show_settings(self):
        self.clear_content(); tk.Label(self.content,text="Settings",font=("Arial",24,"bold"),bg="#f4f6f8",fg="#17324d").pack(anchor="w",padx=35,pady=(30,20))

    def logout(self):
        if messagebox.askyesno("Logout","আপনি কি Logout করতে চান?"): self.show_login()


if __name__ == "__main__":
    root=tk.Tk(); DingelHafiziaApp(root); root.mainloop()
