import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, BR_PASS, card, fmtDateTime, fmtScore, getUser, h1, StatCard, td, th } from '../../components/ui';

// เฉลี่ยเฉพาะรายการที่ตรวจแล้ว (ข้ามรายการที่ยังรอตรวจ)
const avg = (rows, key) => {
  const nums = rows.filter((r) => r.Evaluation_ID).map((r) => Number(r[key]));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
};

function SummaryCard({ title, value }) {
  const has = value !== null;
  const ok = has && value >= BR_PASS;
  return (
    <StatCard title={title}>
      <div style={{ fontSize: '34px', fontWeight: '800', color: !has ? '#9ca3af' : ok ? '#111827' : '#dc2626' }}>{fmtScore(value)}</div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
        จาก 4.00 · เกณฑ์ผ่านไม่ต่ำกว่า {BR_PASS.toFixed(2)}
      </div>
    </StatCard>
  );
}

export default function MyEvaluation() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const profileId = getUser()?.profileId;

  useEffect(() => {
    if (!profileId) return;
    fetch(`/api/trainee/evaluations/${profileId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return setError(data?.message || 'โหลดข้อมูลไม่สำเร็จ');
        setRows(data);
        setSelected(data.find((d) => d.Feedback_Note) || null);
      })
      .catch(() => setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'));
  }, [profileId]);

  const evaluated = rows.filter((r) => r.Evaluation_ID).length;

  const handleOpenFeedback = (item) => {
    setSelected(item);
    setIsModalOpen(true);
  };

  return (
    <div>
      <h1 style={h1}>ผลประเมินของฉัน</h1>
      {error && <div style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <SummaryCard title="Dev Skill (เฉลี่ย)" value={avg(rows, 'Development_Score')} />
        <SummaryCard title="Business Logic (เฉลี่ย)" value={avg(rows, 'BusinessLogic_Score')} />
        <SummaryCard title="Communication (เฉลี่ย)" value={avg(rows, 'Communication_Score')} />
      </div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
        คำนวณจาก {evaluated} การประเมิน · รอตรวจ {rows.length - evaluated} รายการ
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>โจทย์</th>
              <th style={th}>ครั้งที่</th>
              <th style={th}>ส่งเมื่อ</th>
              <th style={th}>Dev</th>
              <th style={th}>Business</th>
              <th style={th}>Comm</th>
              <th style={th}>ผล</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan="8" style={{ ...td, textAlign: 'center', color: '#6b7280' }}>ยังไม่มีการส่งงาน</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.Submission_ID} style={{ backgroundColor: selected?.Submission_ID === r.Submission_ID ? '#f8fafc' : 'transparent' }}>
                <td style={{ ...td, fontWeight: 'bold' }}>{r.Title}</td>
                <td style={td}>ครั้งที่ {r.Version_No}</td>
                <td style={td}>{fmtDateTime(r.Submitted_At)}</td>
                <td style={td}>{r.Evaluation_ID ? fmtScore(r.Development_Score) : '-'}</td>
                <td style={td}>{r.Evaluation_ID ? fmtScore(r.BusinessLogic_Score) : '-'}</td>
                <td style={td}>{r.Evaluation_ID ? fmtScore(r.Communication_Score) : '-'}</td>
                <td style={td}><Badge kind={r.Status || 'Waiting'} /></td>
                <td style={{ ...td, textAlign: 'right' }}>
                  {r.Evaluation_ID ? (
                    <button
                      onClick={() => handleOpenFeedback(r)}
                      style={{
                        padding: '7px 14px',
                        backgroundColor: '#f97316',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                      }}
                    >
                      💬 ดู Feedback
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>รอตรวจ</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* กล่องสรุป Feedback ด้านล่าง */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
          {selected ? `Feedback ล่าสุด: ${selected.Title} (ครั้งที่ ${selected.Version_No})` : 'Feedback'}
        </h3>
        <div style={{ fontWeight: 'bold', fontSize: '14.5px', marginBottom: '10px', color: '#1e293b', fontStyle: 'italic' }}>
          "{selected?.Feedback_Note || 'ยังไม่มีคำติชม'}"
        </div>
        {selected?.Trainer_Name && (
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            โดย <strong>{selected.Trainer_Name}</strong> · {fmtDateTime(selected.Feedback_At)}
          </div>
        )}
        {selected?.Status === 'Need_Revision' && (
          <div style={{ marginTop: '12px' }}>
            <Link to="/trainee/assignments" style={{ fontWeight: 'bold', color: '#dc2626' }}>ไปส่งงานแก้ไขใหม่ →</Link>
          </div>
        )}
      </div>

      {/* Interactive Modal Pop-up: แสดงเมื่อคลิก ดู Feedback */}
      {isModalOpen && selected && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>ผลการประเมินและคำติชม (Feedback)</div>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  {selected.Title} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>(ครั้งที่ {selected.Version_No})</span>
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Rubric Score Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Development</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: selected.Development_Score >= 2 ? '#0284c7' : '#dc2626' }}>
                    {fmtScore(selected.Development_Score)}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Business Logic</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: selected.BusinessLogic_Score >= 2 ? '#0284c7' : '#dc2626' }}>
                    {fmtScore(selected.BusinessLogic_Score)}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Communication</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: selected.Communication_Score >= 2 ? '#0284c7' : '#dc2626' }}>
                    {fmtScore(selected.Communication_Score)}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: selected.Status === 'Passed' ? '#f0fdf4' : '#fef2f2', borderRadius: '10px', border: `1px solid ${selected.Status === 'Passed' ? '#bbf7d0' : '#fecaca'}` }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: selected.Status === 'Passed' ? '#166534' : '#991b1b' }}>
                  ผลการประเมิน: {selected.Status === 'Passed' ? 'ผ่านเกณฑ์ (Passed)' : 'ต้องปรับปรุงแก้ไข (Need Revision)'}
                </span>
                <Badge kind={selected.Status || 'Waiting'} />
              </div>

              {/* Feedback Note Content */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                  💬 ข้อเสนอแนะจากผู้ตรวจประเมิน:
                </div>
                <div style={{ padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#1e293b', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{selected.Feedback_Note || 'ยังไม่มีคำติชมสำหรับรอบนี้'}"
                </div>
                {selected.Trainer_Name && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', textAlign: 'right' }}>
                    ผู้ตรวจ: <strong>{selected.Trainer_Name}</strong> · วันที่ {fmtDateTime(selected.Feedback_At)}
                  </div>
                )}
              </div>

              {/* Resubmit Action button if Need_Revision */}
              {selected.Status === 'Need_Revision' && (
                <div style={{ marginBottom: '10px', padding: '12px', backgroundColor: '#fff1f2', borderRadius: '10px', border: '1px solid #ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#9f1239', fontWeight: 'bold' }}>งานนี้ยังไม่ผ่านเกณฑ์ ต้องการส่งแก้ตัวใหม่หรือไม่?</span>
                  <Link
                    to="/trainee/assignments"
                    style={{ padding: '6px 14px', backgroundColor: '#e11d48', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}
                  >
                    ไปส่งงานแก้ไขใหม่ →
                  </Link>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '8px 20px', backgroundColor: '#1e293b', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}