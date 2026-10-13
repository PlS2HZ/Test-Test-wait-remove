import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, BR_PASS, card, fmtDate, fmtScore, getUser, h1, ProgressBar, StatCard, td, th } from '../../components/ui';

const big = { fontSize: '26px', fontWeight: '800', color: '#111827', lineHeight: 1.2 };
const small = { fontSize: '12px', color: '#6b7280', marginTop: '4px' };

function ScoreBox({ title, value }) {
  const has = value !== null && value !== undefined;
  const ok = has && value >= BR_PASS;
  return (
    <div style={{ flex: 1, minWidth: '160px', backgroundColor: '#f9fafb', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>{title}</div>
      <div style={{ ...big, color: !has ? '#9ca3af' : ok ? '#047857' : '#dc2626' }}>{fmtScore(value)}</div>
      <div style={small}>{!has ? 'ยังไม่มีคะแนน' : ok ? 'ผ่านเกณฑ์ (≥ 2.00)' : 'ต่ำกว่าเกณฑ์ 2.00'}</div>
    </div>
  );
}

export default function TraineeDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const user = getUser();

  useEffect(() => {
    if (!user?.profileId) return;
    fetch(`/api/trainee/dashboard/${user.profileId}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.message) : setData(d)))
      .catch(() => setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'));
  }, [user?.profileId]);

  if (error) return <div style={{ color: '#dc2626' }}>{error}</div>;
  if (!data) return <div style={{ color: '#6b7280' }}>กำลังโหลด...</div>;

  const { trainee, roadmap, items, averages } = data;
  const total = items.length;
  const done = items.filter((i) => i.ItemStatus === 'Completed').length;
  const waiting = items.filter((i) => i.blockReason === 'WAITING').length;
  const needRevision = items.filter((i) => i.latest?.EvalStatus === 'Need_Revision').length;
  const next = items.find((i) => i.Unlocked && i.ItemStatus !== 'Completed');
  const daysLeft = roadmap ? Math.ceil((new Date(roadmap.End_Date) - new Date()) / 86400000) : null;

  return (
    <div>
      <div className="welcome-banner"><div><span className="eyebrow">การเรียนรู้ของคุณ</span><h1>ยินดีต้อนรับ {trainee?.Name}</h1><p>เรียนรู้ตามแผน ฝึกลงมือทำ และติดตามคำแนะนำจากผู้ฝึกสอน</p></div><span className="welcome-symbol">T</span></div>
      <p style={{ margin: '-12px 0 20px', color: '#6b7280' }}>
        {trainee?.Name} · {trainee?.Position || '-'} · ระดับทักษะ {trainee?.Skill_Level || '-'} · เริ่มงาน {fmtDate(trainee?.Start_Date)}
      </p>

      {!roadmap ? (
        <div style={{ ...card, color: '#6b7280' }}>ยังไม่มีแผนการฝึกอบรมสำหรับผู้ใช้งาน กรุณาติดต่อ Trainer / BA</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <StatCard title="แผนการเรียนรู้">
              <div style={{ ...big, fontSize: '18px' }}>{roadmap.Title}</div>
              <div style={{ marginTop: '8px' }}><Badge kind={roadmap.Status} /></div>
              <div style={small}>{fmtDate(roadmap.Start_Date)} – {fmtDate(roadmap.End_Date)}</div>
            </StatCard>
            <StatCard title="ความคืบหน้า" bg="#f3f4f6">
              <ProgressBar done={done} total={total} />
            </StatCard>
            <StatCard title="งานรอตรวจ / ต้องแก้ไข" bg="#f3f4f6">
              <div style={big}>{waiting} <span style={{ fontSize: '14px', color: '#6b7280' }}>รอตรวจ</span></div>
              <div style={{ ...small, color: needRevision ? '#dc2626' : '#6b7280' }}>{needRevision} ต้องส่งแก้ไข</div>
            </StatCard>
            <StatCard title="เวลาที่เหลือ" bg="#f3f4f6">
              <div style={{ ...big, color: daysLeft < 0 ? '#dc2626' : '#111827' }}>
                {daysLeft < 0 ? `เกิน ${Math.abs(daysLeft)}` : daysLeft} <span style={{ fontSize: '14px' }}>วัน</span>
              </div>
              <div style={small}>สิ้นสุด {fmtDate(roadmap.End_Date)}</div>
            </StatCard>
          </div>

          <div style={{ ...card, marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px' }}>คะแนนเฉลี่ยสะสม ({averages.count} การประเมิน)</h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <ScoreBox title="Development Skill" value={averages.dev} />
              <ScoreBox title="Business Logic" value={averages.biz} />
              <ScoreBox title="Communication" value={averages.comm} />
            </div>
          </div>

          <div style={{ ...card, marginBottom: '20px', backgroundColor: '#fef6e4', border: 'none' }}>
            <h3 style={{ margin: '0 0 8px' }}>บทที่ต้องทำต่อไป</h3>
            {next ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>บทที่ {next.Seq_No}: {next.Title}</div>
                  <div style={small}>กำหนดส่ง {fmtDate(next.Deadline)}</div>
                </div>
                <Link to="/trainee/assignments" state={{ openItem: next.Item_ID }} className="btn-primary" style={{ textDecoration: 'none' }}>
                  {next.blockReason === 'WAITING' ? 'ดูสถานะงานที่ส่ง' : next.submitMode === 'resubmit' ? 'ส่งงานแก้ไข' : 'เริ่มเรียน / ส่งงาน'}
                </Link>
              </div>
            ) : (
              <div style={{ color: '#047857', fontWeight: 'bold' }}>{total && done === total ? 'ผ่านครบทุกบทแล้ว ยินดีด้วย!' : 'รอผู้ฝึกสอนจัดบทเรียนในแผนของคุณ'}</div>
            )}
          </div>

          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <h3 style={{ margin: 0, padding: '16px 20px' }}>กำหนดส่งทั้งหมด</h3>
            <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>บท</th><th style={th}>โจทย์</th><th style={th}>กำหนดส่ง</th><th style={th}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.Item_ID}>
                    <td style={td}>{i.Seq_No}</td>
                    <td style={{ ...td, fontWeight: 'bold' }}>{i.Title}</td>
                    <td style={td}>{fmtDate(i.Deadline)}</td>
                    <td style={td}>
                      <Badge kind={!i.Unlocked ? 'Locked' : i.blockReason === 'WAITING' ? 'Waiting' : i.submitMode === 'resubmit' ? 'Need_Revision' : i.ItemStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      )}
    </div>
  );
}