/* Stage 2 — Student Management enhancement (frontend only) */
const DHStage2={
  version:'2.0.0',
  normalizeStudent(student={}){
    return {roll:'',admissionDate:'',status:'Active',...student};
  },
  filterStudents(students=[],query='',className='All',status='All'){
    const q=String(query).trim().toLowerCase();
    return students.map(this.normalizeStudent).filter(s=>{
      const searchable=[s.name,s.roll,s.className,s.guardian,s.phone].join(' ').toLowerCase();
      return (!q||searchable.includes(q))&&(className==='All'||s.className===className)&&(status==='All'||s.status===status);
    });
  },
  classes(students=[]){
    return [...new Set(students.map(s=>s.className).filter(Boolean))].sort();
  },
  totalDue(studentId,fees=[]){
    return fees.filter(f=>f.studentId===studentId).reduce((sum,f)=>sum+Number(f.due||0),0);
  }
};
window.DHStage2=DHStage2;
