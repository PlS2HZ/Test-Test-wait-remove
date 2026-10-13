import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, FileCheck, CheckCircle, Award, ArrowRight, UserPlus } from 'lucide-react';
import { card, h1 } from '../../components/ui';

export default function HrDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetch('/api/hr/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d); else setError('ไม่สามารถโหลดข้อมูลได้');
      }).catch(() => setError('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง'));
  }, []);

  if (error) return <div className="page-state error" role="alert">{error}</div>;
  if (!data) return <div className="page-state" role="status">กำลังโหลดภาพรวม…</div>;
  const stats = data?.stats || {};

  return (
    <div>
      <div className="welcome-banner"><div><span className="eyebrow">{user?.fullName}</span><h1>ภาพรวมพนักงาน</h1><p>ติดตามความก้าวหน้า และเตรียมข้อมูลประกอบการพิจารณาทดลองงาน</p></div><span className="welcome-symbol">T</span></div>
      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ ...card, backgroundColor: '#fff', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>ผู้ใช้งานทั้งหมดในระบบ</span>
            <Users size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px' }}>
            {stats.totalUsers ?? '-'} บัญชี
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Trainee, Trainer และ HR
          </div>
        </div>

        <div style={{ ...card, backgroundColor: '#fff', borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>พนักงานใหม่ (Trainee)</span>
            <UserCheck size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px' }}>
            {stats.trainees ?? '-'} คน
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            รับการอบรมช่วง 2 เดือนแรก
          </div>
        </div>

        <div style={{ ...card, backgroundColor: '#fff', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>Roadmap สำเร็จแล้ว</span>
            <CheckCircle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px' }}>
            {stats.completedRoadmaps ?? '-'} แผน
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            ผ่านครบทุกบทเรียน
          </div>
        </div>

        <div style={{ ...card, backgroundColor: '#fff', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>รายงาน Probation ที่ออกแล้ว</span>
            <FileCheck size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px' }}>
            {stats.probationReports ?? '-'} ฉบับ
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            รายงานที่บันทึกแล้ว
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '10px', color: '#2563eb' }}>
                <UserPlus size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>จัดการผู้ใช้งานและสิทธิ์ </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 16px' }}>
              เพิ่มพนักงานใหม่ อัปเดตข้อมูล และจัดการสิทธิ์ตามหน้าที่
            </p>
          </div>
          <Link
            to="/hr/users"
            style={{
              padding: '10px 16px',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              width: 'fit-content'
            }}
          >
            <span>ไปหน้าจัดการผู้ใช้</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ ...card, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '10px', color: '#059669' }}>
                <FileCheck size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>รายงานผลการฝึกอบรม </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 16px' }}>
              สรุปคะแนนและความก้าวหน้า พร้อมบันทึกข้อคิดเห็นเพื่อพิจารณาทดลองงาน
            </p>
          </div>
          <Link
            to="/hr/probation"
            style={{
              padding: '10px 16px',
              backgroundColor: '#059669',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              width: 'fit-content'
            }}
          >
            <span>ดูรายงานผลการฝึกอบรม</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Recent Submissions Table for HR Visibility */}
      <div style={{ ...card, padding: 0, overflow: 'hidden', marginTop: '28px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
              📋 การส่งงานล่าสุด
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              ติดตามสถานะการส่งงานของ Trainee และผลการตรวจประเมินแบบเรียลไทม์
            </span>
          </div>
          <Link to="/hr/probation" style={{ fontSize: '12.5px', color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>
            ดูรายงานคะแนนรวมทั้งหมด →
          </Link>
        </div>

        <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '12px 16px' }}>พนักงาน (Trainee)</th>
              <th style={{ padding: '12px 16px' }}>หัวข้อแบบฝึกหัด</th>
              <th style={{ padding: '12px 16px' }}>ครั้งที่</th>
              <th style={{ padding: '12px 16px' }}>เวลาที่ส่ง</th>
              <th style={{ padding: '12px 16px' }}>สถานะการตรวจ</th>
              <th style={{ padding: '12px 16px' }}>คะแนนเฉลี่ย</th>
              <th style={{ padding: '12px 16px' }}>ผู้ตรวจประเมิน</th>
            </tr>
          </thead>
          <tbody>
            {(!data?.recentSubmissions || data.recentSubmissions.length === 0) ? (
              <tr>
                <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  ยังไม่มีประวัติการส่งงานในขณะนี้
                </td>
              </tr>
            ) : (
              data.recentSubmissions.map((s) => {
                const avg = s.Development_Score ? ((s.Development_Score + s.BusinessLogic_Score + s.Communication_Score) / 3).toFixed(2) : '-';
                return (
                  <tr key={s.Submission_ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>
                      {s.TraineeName} <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'normal' }}>({s.TraineeUsername || `TN00${s.Trainee_ID}`})</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{s.AssignmentTitle}</td>
                    <td style={{ padding: '12px 16px' }}>ครั้งที่ {s.Version_No}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      {s.SubmittedAt ? String(s.SubmittedAt).replace('T', ' ').slice(0, 16) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: s.Status === 'Graded' ? '#d1fae5' : '#dbeafe',
                        color: s.Status === 'Graded' ? '#047857' : '#1d4ed8'
                      }}>
                        {s.Status === 'Graded' ? (s.EvalStatus === 'Passed' ? 'ผ่านแล้ว' : 'ต้องแก้ไข') : 'รอตรวจ'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: avg !== '-' && avg >= 2.0 ? '#0284c7' : '#dc2626' }}>
                      {avg}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {s.TrainerName || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}