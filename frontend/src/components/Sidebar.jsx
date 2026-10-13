import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Compass, CheckSquare, Award, Users, FolderKanban, FileCheck, UserPlus, LogOut, X } from 'lucide-react';
export const roles = { Trainee: 'ผู้เข้ารับการฝึกอบรม', Trainer: 'ผู้ฝึกสอน', HR: 'ฝ่ายบุคคล' };
export const menus = {
 Trainee: [ ['ภาพรวมของฉัน','/trainee/dashboard',LayoutDashboard], ['แผนการเรียนรู้','/trainee/roadmap',Compass], ['บทเรียนและส่งงาน','/trainee/assignments',CheckSquare], ['ผลประเมินและคำแนะนำ','/trainee/evaluations',Award] ],
 Trainer: [ ['ภาพรวมการฝึกอบรม','/trainer/dashboard',LayoutDashboard], ['ตรวจและประเมินงาน','/trainer/evaluations',Award], ['พนักงานและแผนการเรียน','/trainer/trainees',Users], ['สื่อและแบบฝึกหัด','/trainer/tasks',FolderKanban] ],
 HR: [ ['ภาพรวมพนักงาน','/hr/dashboard',LayoutDashboard], ['บัญชีและสิทธิ์ผู้ใช้งาน','/hr/users',UserPlus], ['รายงานผลการฝึกอบรม','/hr/probation',FileCheck] ]
};
export default function Sidebar({user, open, onClose}) {
 const navigate=useNavigate();
 const logout=()=>{localStorage.removeItem('user');localStorage.removeItem('token');navigate('/login');};
 return <><button className={`nav-backdrop ${open?'visible':''}`} onClick={onClose} aria-label="ปิดเมนู" />
 <aside className={`sidebar ${open?'is-open':''}`}>
  <div className="brand"><span className="brand-mark">T</span><div><strong>TRAIN TMS</strong><small>Dynamics Motion</small></div><button className="nav-close icon-button" onClick={onClose} aria-label="ปิดเมนู"><X size={20}/></button></div>
  <div className="nav-heading">{roles[user.role]}</div>
  <nav aria-label="เมนูหลัก">{(menus[user.role]||[]).map(([label,path,Icon])=><NavLink key={path} to={path} onClick={onClose} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
  <div className="sidebar-note"><span>เรียนรู้ · ลงมือทำ · พัฒนา</span><p>เติบโตไปด้วยกันในทุกขั้นตอน</p></div>
  <div className="sidebar-footer"><div className="person"><span className="avatar">{user.fullName?.charAt(0)||'T'}</span><div><strong>{user.fullName}</strong><small>{user.username}</small></div></div><button className="logout" onClick={logout}><LogOut size={16}/>ออกจากระบบ</button></div>
 </aside></>;
}
