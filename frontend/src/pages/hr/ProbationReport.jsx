import { useEffect, useState } from 'react';
import { FileCheck, Printer, Download, CheckCircle, AlertTriangle, UserCheck, Shield, Award, HelpCircle } from 'lucide-react';
import { card, h1, fmtDate, fmtScore, Badge, BR_PASS } from '../../components/ui';

export default function ProbationReport() {
  const [summaryList, setSummaryList] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedTraineeId, setSelectedTraineeId] = useState('');
  const [decisionStatus, setDecisionStatus] = useState('Passed');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  const loadData = () => {
    fetch('/api/hr/trainees-summary')
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setSummaryList(arr);
        if (arr.length > 0 && !selectedTraineeId) {
          setSelectedTraineeId(arr[0].Trainee_ID);
        }
      });

    fetch('/api/hr/probation-reports')
      .then(res => res.json())
      .then(data => setReports(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadData();
  }, []);

  const reportText = value => String(value || '').replace(/\s*BR-\d+/g, '').replace('(สมควรบรรจุเป็นพนักงานประจำ)', '(ประกอบการพิจารณาทดลองงาน 4 เดือน)');

  const selectedTrainee = summaryList.find(t => t.Trainee_ID === Number(selectedTraineeId)) || summaryList[0];

  useEffect(() => {
    if (selectedTrainee) {
      const rec = selectedTrainee.recommendation === 'Passed' ? 'Passed' :
                  selectedTrainee.recommendation === 'Extended' ? 'Extended' : 'Passed';
      setDecisionStatus(rec);
      setRemark(selectedTrainee.recReason || 'ผ่านการประเมินทักษะช่วงฝึกอบรม 2 เดือนแรก');
    }
  }, [selectedTraineeId, summaryList]);

  // Record Decision
  const handleSaveDecision = async (e) => {
    e.preventDefault();
    if (!selectedTrainee) return;

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/hr/probation-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeId: selectedTrainee.Trainee_ID,
          hrId: user?.profileId || 1,
          status: decisionStatus,
          remark: remark.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'บันทึกรายงานไม่สำเร็จ');

      setMessage('✅ ' + data.message);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // UC-16: Export to Excel (CSV)
  const handleExportCSV = () => {
    if (summaryList.length === 0) return alert('ไม่มีข้อมูลสำหรับส่งออก');

    const headers = [
      'Trainee_ID', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'วันที่เริ่มงาน', 'ระดับทักษะ',
      'งานที่สำเร็จ', 'คะแนนเฉลี่ย Dev', 'คะแนนเฉลี่ย Biz', 'คะแนนเฉลี่ย Comm',
      'คะแนนรวมเฉลี่ย', 'ผ่านเกณฑ์การฝึกอบรม', 'คำแนะนำประกอบการพิจารณา', 'ผลตัดสินใจ HR', 'ข้อคิดเห็น HR'
    ];

    const rows = summaryList.map(t => {
      const rep = reports.find(r => r.Trainee_ID === t.Trainee_ID);
      return [
        t.Trainee_ID,
        `"${t.Name}"`,
        `"${t.Position || '-'}"`,
        t.Start_Date,
        t.Skill_Level || '-',
        `"${t.completedTasks}/${t.totalTasks}"`,
        t.avgDev || '-',
        t.avgBiz || '-',
        t.avgComm || '-',
        t.avgTotal || '-',
        t.passBR1 ? 'ผ่าน' : 'ไม่ผ่าน',
        `"${t.recommendation}"`,
        `"${rep?.Status || t.ReportStatus || 'รอดำเนินการ'}"`,
        `"${rep?.Remark || t.ReportRemark || '-'}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Probation_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // UC-16: Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Page Title & Action Bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ ...h1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={26} color="#059669" />
            <span>รายงานผลการฝึกอบรม</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
            สรุปผลการฝึก 2 เดือนแรก เพื่อประกอบการพิจารณาทดลองงาน 4 เดือน
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '9px 16px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={15} />
            <span>ดาวน์โหลด CSV</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: '9px 16px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={15} />
            <span>พิมพ์ / ส่งออก PDF</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="no-print" style={{
          padding: '12px 16px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          fontSize: '13.5px',
          color: '#065f46',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      {/* Decision Support & Scorecard Form (Card 1) */}
      <div className="no-print" style={{ ...card, padding: '24px', marginBottom: '28px', border: '1.5px solid #cbd5e1' }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16.5px', fontWeight: 'bold', color: '#0f172a' }}>
              สรุปผลประกอบการพิจารณา
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              พิจารณาคะแนนทั้ง 3 ด้านร่วมกับความคืบหน้าและข้อคิดเห็นของผู้ฝึกสอน
            </p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '999px' }}>
            สรุป ผลการฝึกอบรม
          </span>
        </div>

        <form onSubmit={handleSaveDecision}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
            {/* Left: Select Trainee and Decision */}
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  เลือกพนักงานใหม่ที่ต้องการตัดสินผล:
                </label>
                <select
                  value={selectedTraineeId}
                  onChange={e => setSelectedTraineeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    backgroundColor: '#f8fafc',
                    fontWeight: 'bold'
                  }}
                >
                  {summaryList.map(t => (
                    <option key={t.Trainee_ID} value={t.Trainee_ID}>
                      [{t.Trainee_ID}] {t.Name} - {t.Position} ({t.completedTasks}/{t.totalTasks} บท)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  ผลการตัดสินใจของ HR และผู้บริหาร:
                </label>
                <select
                  value={decisionStatus}
                  onChange={e => setDecisionStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #059669',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="Passed">ผ่าน — บันทึกผลประกอบการพิจารณาทดลองงาน</option>
                  <option value="Extended">Extended - ขยายระยะเวลาทดลองงาน (เพิ่ม 30 วัน)</option>
                  <option value="Failed">Failed - ไม่ผ่านการทดลองงาน</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  ข้อคิดเห็น / เหตุผลประกอบการตัดสินใจ (Remark):
                </label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder="ระบุเหตุผลประกอบการตัดสินใจของ HR..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกคำบันทึกผลรายงาน'}
              </button>
            </div>

            {/* Right: Live KPI Scorecard for selected trainee */}
            {selectedTrainee && (
              <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                      ผลประเมิน: {selectedTrainee.Name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      ตำแหน่ง: {selectedTrainee.Position} · เริ่มงาน: {selectedTrainee.Start_Date}
                    </div>
                  </div>
                  <Badge kind={selectedTrainee.RoadmapStatus || 'In_Progress'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Dev Skill</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: selectedTrainee.avgDev >= 2.0 ? '#0284c7' : '#dc2626' }}>
                      {selectedTrainee.avgDev || '-'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Business Logic</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: selectedTrainee.avgBiz >= 2.0 ? '#d97706' : '#dc2626' }}>
                      {selectedTrainee.avgBiz || '-'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Communication</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: selectedTrainee.avgComm >= 2.0 ? '#059669' : '#dc2626' }}>
                      {selectedTrainee.avgComm || '-'}
                    </div>
                  </div>
                </div>

                {/* System Recommendation Box */}
                <div style={{
                  backgroundColor: selectedTrainee.recommendation === 'Passed' ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${selectedTrainee.recommendation === 'Passed' ? '#a7f3d0' : '#fde68a'}`,
                  padding: '14px',
                  borderRadius: '10px',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                    คำแนะนำจากระบบตาม ผลการฝึกอบรม:
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: selectedTrainee.recommendation === 'Passed' ? '#065f46' : '#b45309', margin: '4px 0 2px' }}>
                    {selectedTrainee.recommendation === 'Passed' ? '✓ แนะนำอนุมัติผ่านทดลองงาน (Passed)' :
                     selectedTrainee.recommendation === 'Extended' ? '⚠️ แนะนำขยายเวลาทดลองงาน (Extended)' : '⏳ ยังอยู่ระหว่างการฝึกอบรม'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569' }}>
                    {selectedTrainee.recReason}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  ทำแบบฝึกหัดแล้วเสร็จ: <strong>{selectedTrainee.completedTasks}</strong> จาก {selectedTrainee.totalTasks} บท
                  · ผ่านเกณฑ์การฝึกอบรม: {selectedTrainee.passBR1 ? '✓ ใช่' : '✗ ไม่ผ่าน'}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Official Printable Report Section (PDF & Table View) */}
      <div id="printable-report" style={{ ...card, padding: '24px', backgroundColor: '#fff' }}>
        {/* Formal Header (Visible on Print and Screen) */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
            บริษัท ไดนามิกส์ โมชั่น จำกัด (Dynamics Motion Co., Ltd.)
          </h2>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 'bold', color: '#334155' }}>
            รายงานสรุปผลการฝึกอบรม 2 เดือนแรก
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            ข้อมูลประกอบการพิจารณาทดลองงาน 4 เดือน · ประจำวันที่ {new Date().toLocaleDateString('th-TH')}
          </p>
        </div>

        {/* Table of Trainees Summary */}
        <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginBottom: '24px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
              <th style={{ padding: '10px 12px' }}>รหัส / พนักงาน</th>
              <th style={{ padding: '10px 12px' }}>ตำแหน่ง</th>
              <th style={{ padding: '10px 12px' }}>งานที่สำเร็จ</th>
              <th style={{ padding: '10px 12px' }}>Dev</th>
              <th style={{ padding: '10px 12px' }}>Biz</th>
              <th style={{ padding: '10px 12px' }}>Comm</th>
              <th style={{ padding: '10px 12px' }}>เฉลี่ยรวม</th>
              <th style={{ padding: '10px 12px' }}>ผลประเมิน</th>
              <th style={{ padding: '10px 12px' }}>ผลตัดสินใจ (HR)</th>
              <th style={{ padding: '10px 12px' }}>ความเห็น / หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {summaryList.map(t => {
              const rep = reports.find(r => r.Trainee_ID === t.Trainee_ID);
              const finalStatus = rep?.Status || t.ReportStatus;
              return (
                <tr key={t.Trainee_ID} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>
                    TN00{t.Trainee_ID}: {t.Name}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{t.Position}</td>
                  <td style={{ padding: '10px 12px' }}>{t.completedTasks} / {t.totalTasks}</td>
                  <td style={{ padding: '10px 12px' }}>{t.avgDev || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>{t.avgBiz || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>{t.avgComm || '-'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{t.avgTotal || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {t.passBR1 ? (
                      <span style={{ color: '#059669', fontWeight: 'bold' }}>ผ่าน</span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>ไม่ผ่าน</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {finalStatus ? <Badge kind={finalStatus} /> : <span style={{ color: '#94a3b8' }}>รอดำเนินการ</span>}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569', maxWidth: '200px' }}>
                    {reportText(rep?.Remark || t.ReportRemark || t.recReason)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>

        {/* Formal Signature Blocks for Print & Official Record */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '36px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ minHeight: '60px' }}></div>
            <div style={{ borderTop: '1px solid #94a3b8', width: '220px', margin: '0 auto 6px' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
              ({user?.role === 'HR' ? user.fullName : 'นาง นภา ดูแลคน'})
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              เจ้าหน้าที่ฝ่ายทรัพยากรบุคคล (HR Specialist)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              วันที่ ............. / ............. / .............
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ minHeight: '60px' }}></div>
            <div style={{ borderTop: '1px solid #94a3b8', width: '220px', margin: '0 auto 6px' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
              (นาย กิตติศักดิ์ ศรีวิชัย)
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              ผู้จัดการแผนก / พี่เลี้ยงผู้ควบคุมการฝึกอบรม
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              วันที่ ............. / ............. / .............
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}