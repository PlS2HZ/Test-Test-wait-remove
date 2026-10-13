import {useState} from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {Menu} from 'lucide-react';
import Sidebar, {roles, menus} from './Sidebar';
export default function Layout({children}) {
 const [open,setOpen]=useState(false); const location=useLocation();
 let user;try{user=JSON.parse(localStorage.getItem('user'));}catch{user=null;}
 if(!user||!menus[user.role]) return <Navigate to="/login" replace/>;
 const home=menus[user.role][0][1];
 if(!location.pathname.startsWith(home.split('/dashboard')[0].split('/').slice(0,2).join('/')+'/')) return <Navigate to={home} replace/>;
 const title=menus[user.role].find(m=>m[1]===location.pathname)?.[0]||'การฝึกอบรม';
 return <div className="app-shell"><Sidebar user={user} open={open} onClose={()=>setOpen(false)}/><div className="workspace"><header className="topbar"><div className="topbar-left"><button className="icon-button menu-toggle" onClick={()=>setOpen(true)} aria-label="เปิดเมนู"><Menu size={22}/></button><span className="breadcrumb">พื้นที่การฝึกอบรม <span>/</span> <strong>{title}</strong></span></div><div className="topbar-profile"><span className="avatar small">{user.fullName?.charAt(0)||'T'}</span><div><strong>{user.fullName}</strong><small>{roles[user.role]}</small></div></div></header><main className="app-main" id="main-content">{children}</main></div></div>;
}
