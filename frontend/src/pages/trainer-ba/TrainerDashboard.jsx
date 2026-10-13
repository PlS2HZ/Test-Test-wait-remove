import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, CheckCircle, Award, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { card, h1, fmtDateTime, fmtScore } from '../../components/ui';

export default function TrainerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetch('/api/trainer/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d); else setError('ไม่สามารถโหลดข้อมูลได้');
      }).catch(() => setError('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง'));
  }, []);

  if (error) return <div className="page-state error" role="alert">{error}</div>;
  if (!data) return <div className="page-state" role="status">กำลังโหลดภาพรวม…</div>;
  const stats = data?.stats || {};
  const recent = data?.recentPending || [];

  return (
    <div>
      <div className="welcome-banner"><div><span className="eyebrow">{user?.fullName}</span><h1>ภาพรวมการฝึกอบรม</h1><p>ดูงานรอตรวจ ดูแลแผนการเรียน และติดตามพัฒนาการของพนักงาน</p></div><span className="welcome-symbol">T</span></div>
      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ ...card, backgroundColor: '#fff', borderLeft: '4px solid #f97316' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>งานรอตรวจให้คะแนน</span>
            <Clock size={18} color="#f97316" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px' }}>
            {stats.pendingCount ?? '-'}
          </div>
          <div style={{ fontSize: '12px', color: '#f97316', fontWeight: 'bold' }}>
            {stats.pendingCount > 0 ? '⚠️ มีผลงานรอการประเมิน' : 'ตรวจครบแล้ว'}
          </div>
        </div>

        <div style={{ ...card, backgroundColor: '#fff', borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>พนักงานใหม่ (Trainee)</span>
            <Users size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px' }}>
            {stats.traineeCount ?? '-'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            อยู่ในหลักสูตร 2 เดือน
          </div>
        </div>

        <div style={{ ...card, backgroundColor: '#fff', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>ตรวจประเมินแล้วเสร็จ</span>
            <CheckCircle size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px' }}>
            {stats.gradedCount ?? '-'}
          </div>
          <div style={{ fontSize: '12px', color: '#059669' }}>
            บันทึก Rubric & Feedback แล้ว
          </div>
        </div>

        <div style={{ ...card, backgroundColor: '#fff', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>คลังสื่อ & คลังโจทย์</span>
            <Layers size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px' }}>
            {stats.assignmentCount ?? '-'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {stats.materialCount} สื่อการสอน · {stats.assignmentCount} โจทย์
          </div>
        </div>
      </div>

      {/* Average Rubric Score Box */}
      <div style={{ ...card, marginBottom: '28px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 'bold', color: '#92400e' }}>
          ภาพรวมทักษะของพนักงาน
        </h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px', backgroundColor: '#fff', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Development Skill</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{stats.avgDev || '-'} / 4.00</div>
          </div>
          <div style={{ flex: 1, minWidth: '160px', backgroundColor: '#fff', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Business Logic</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{stats.avgBiz || '-'} / 4.00</div>
          </div>
          <div style={{ flex: 1, minWidth: '160px', backgroundColor: '#fff', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Communication</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{stats.avgComm || '-'} / 4.00</div>
          </div>
        </div>
      </div>

      {/* Recent Submissions to Review */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>
            งานที่รอการตรวจ
          </div>
          <Link to="/trainer/evaluations" style={{ color: '#d97706', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>ไปหน้าตรวจและประเมินทั้งหมด</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
            ไม่มีงานค้างตรวจในขณะนี้
          </div>
        ) : (
          <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>พนักงานใหม่</th>
                <th style={{ padding: '12px 16px' }}>หัวข้อแบบฝึกหัด</th>
                <th style={{ padding: '12px 16px' }}>ครั้งที่</th>
                <th style={{ padding: '12px 16px' }}>ส่งเมื่อ</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.Submission_ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{r.TraineeName}</td>
                  <td style={{ padding: '12px 16px' }}>{r.AssignmentTitle}</td>
                  <td style={{ padding: '12px 16px' }}>ครั้งที่ {r.Version_No}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{fmtDateTime(r.Submitted_At)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Link
                      to="/trainer/evaluations"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f97316',
                        color: '#fff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    >
                      ตรวจให้คะแนน →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}