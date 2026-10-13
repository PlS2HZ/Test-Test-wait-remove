import { useEffect, useState } from 'react';
import { Award, CheckCircle, AlertTriangle, ExternalLink, FileText, Send, Clock, UserCheck } from 'lucide-react';
import { card, h1, fmtDateTime, fmtScore, Badge, BR_PASS } from '../../components/ui';

export default function EvaluateTask() {
  const [submissions, setSubmissions] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [devScore, setDevScore] = useState(3.0);
  const [bizScore, setBizScore] = useState(3.0);
  const [commScore, setCommScore] = useState(3.0);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  const loadData = () => {
    fetch('/api/trainer/submissions')
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setSubmissions(arr);
        if (arr.length > 0 && !selectedSub) {
          setSelectedSub(arr[0]);
        }
      });

    fetch('/api/trainer/history')
      .then(res => res.json())
      .then(data => setHistory(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSub) {
      setDevScore(3.0);
      setBizScore(3.0);
      setCommScore(3.0);
      setFeedbackNote('');
    }
  }, [selectedSub]);

  // BR-1: ทุกด้านต้อง >= 2.00 ถึงจะ Passed
  const isPassed = devScore >= BR_PASS && bizScore >= BR_PASS && commScore >= BR_PASS;
  const avgScore = ((devScore + bizScore + commScore) / 3).toFixed(2);

  const handleAutoSuggestFeedback = () => {
    if (!selectedSub) return;
    if (isPassed) {
      setFeedbackNote(`ตรวจงาน ${selectedSub.AssignmentTitle} (ครั้งที่ ${selectedSub.Version_No}) ผ่านเกณฑ์การประเมิน (คะแนนเฉลี่ย ${avgScore}/4.00) โครงสร้างและตรรกะธุรกิจถูกต้อง ครอบคลุมตามข้อกำหนด`);
    } else {
      const failedAspects = [];
      if (devScore < BR_PASS) failedAspects.push(`Development (${devScore.toFixed(2)})`);
      if (bizScore < BR_PASS) failedAspects.push(`Business Logic (${bizScore.toFixed(2)})`);
      if (commScore < BR_PASS) failedAspects.push(`Communication (${commScore.toFixed(2)})`);
      setFeedbackNote(`ตรวจงาน ${selectedSub.AssignmentTitle} (ครั้งที่ ${selectedSub.Version_No}) ยังไม่ผ่านเกณฑ์การประเมิน (คะแนนเฉลี่ย ${avgScore}/4.00) มีด้านที่ต่ำกว่า 2.00 ได้แก่ ${failedAspects.join(', ')} กรุณาปรับปรุงตามคำแนะนำและส่งงานใหม่อีกครั้ง`);
    }
  };

  const applyPreset = (text) => {
    if (!feedbackNote.trim()) {
      setFeedbackNote(text);
    } else {
      setFeedbackNote(prev => `${prev} | ${text}`);
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    if (!feedbackNote.trim()) return alert('กรุณากรอกข้อเสนอแนะ (Feedback Note)');

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/trainer/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.Submission_ID,
          trainerId: user?.profileId || 1,
          devScore,
          bizScore,
          commScore,
          feedbackNote: feedbackNote.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'ประเมินไม่สำเร็จ');

      setMessage('✅ ' + data.message);
      setSelectedSub(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ ...h1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={26} color="#d97706" />
          <span>ตรวจและประเมินงาน</span>
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
          บันทึกผลการประเมิน 3 มิติ (Development, Business Logic, Communication) คะแนน 1.00 – 4.00 พร้อมให้ Feedback
        </p>
      </div>

      {message && (
        <div style={{
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

      {/* Main Grid: Pending Submissions vs Evaluation Studio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: '24px', marginBottom: '32px' }}>
        {/* Left: Pending Submissions List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>
              รายการงานรอตรวจ ({submissions.length})
            </h2>
            <span style={{ fontSize: '11px', color: '#64748b' }}>งานที่ส่งเข้ามา</span>
          </div>

          {submissions.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: '#64748b', padding: '36px' }}>
              🎉 ไม่มีงานค้างตรวจในขณะนี้ ทุกผลงานได้รับการประเมินครบถ้วน
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {submissions.map(s => {
                const isSelected = selectedSub?.Submission_ID === s.Submission_ID;
                return (
                  <div
                    key={s.Submission_ID}
                    onClick={() => setSelectedSub(s)}
                    style={{
                      ...card,
                      padding: '16px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #f97316' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#fffaf5' : '#ffffff',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>
                        {s.TraineeName} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>({s.TraineeUsername || `TN00${s.Trainee_ID}`})</span>
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8'
                      }}>
                        ครั้งที่ {s.Version_No}
                      </span>
                    </div>

                    <div style={{ fontSize: '13.5px', color: '#475569', marginBottom: '8px' }}>
                      {s.AssignmentTitle}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#94a3b8' }}>
                      <span>ส่งเมื่อ: {fmtDateTime(s.SubmittedAt)}</span>
                      <span style={{ color: '#f97316', fontWeight: 'bold' }}>
                        {isSelected ? 'กำลังเลือกตรวจ →' : 'คลิกเพื่อตรวจ'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Evaluation Form (Rubric 3-Dimension Sliders) */}
        <div>
          <div style={{ ...card, padding: '24px' }}>
            {!selectedSub ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                กรุณาเลือกชิ้นงานจากรายการด้านซ้ายเพื่อทำการตรวจประเมิน
              </div>
            ) : (
              <form onSubmit={handleSubmitEvaluation}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>ประเมินผลงาน</div>
                  <h3 style={{ margin: '4px 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                    {selectedSub.AssignmentTitle}
                  </h3>
                  <div style={{ fontSize: '13.5px', color: '#334155' }}>
                    ผู้ส่งงาน: <strong style={{ color: '#0f172a' }}>{selectedSub.TraineeName} ({selectedSub.TraineeUsername || `TN00${selectedSub.Trainee_ID}`})</strong>
                    {selectedSub.TraineePosition && <span style={{ marginLeft: '6px', color: '#64748b' }}>· {selectedSub.TraineePosition}</span>}
                    <span style={{ marginLeft: '6px' }}>· ส่งครั้งที่ {selectedSub.Version_No}</span>
                    <span style={{ marginLeft: '6px' }}>· หมวดหมู่: {selectedSub.Category}</span>
                  </div>
                </div>

                {/* Submission Files & Links */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
                    📎 ผลงานและไฟล์แนบที่ส่งมา:
                  </div>
                  {selectedSub.files && selectedSub.files.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedSub.files.map(f => f.type === 'Note' ? (<p key={f.id} style={{ margin: 0, color: '#475569' }}>หมายเหตุ: {f.url}</p>) : (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12.5px',
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: '600'
                          }}
                        >
                          <ExternalLink size={13} />
                          <span>{f.name || f.url}</span>
                          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>({f.type})</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>ไม่มีลิงก์หรือไฟล์แนบ</div>
                  )}
                </div>

                {/* Rubric Sliders 1-4 */}
                <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '18px', borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '14px' }}>
                    📊 ปรับคะแนนตามเกณฑ์ Rubric Score (1.00 – 4.00):
                  </div>

                  {/* Dev Skill */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#334155' }}>1. ทักษะการพัฒนาซอฟต์แวร์ (Dev Skill)</span>
                      <strong style={{ color: devScore >= BR_PASS ? '#0284c7' : '#dc2626' }}>{devScore.toFixed(2)} / 4.00</strong>
                    </div>
                    <input
                      type="range" min="1.0" max="4.0" step="0.25"
                      value={devScore}
                      onChange={e => setDevScore(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#0284c7' }}
                    />
                  </div>

                  {/* Business Logic */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#334155' }}>2. ความเข้าใจตรรกะธุรกิจ (Business Logic)</span>
                      <strong style={{ color: bizScore >= BR_PASS ? '#d97706' : '#dc2626' }}>{bizScore.toFixed(2)} / 4.00</strong>
                    </div>
                    <input
                      type="range" min="1.0" max="4.0" step="0.25"
                      value={bizScore}
                      onChange={e => setBizScore(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#d97706' }}
                    />
                  </div>

                  {/* Communication */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#334155' }}>3. ทักษะการสื่อสารและนำเสนอ (Communication)</span>
                      <strong style={{ color: commScore >= BR_PASS ? '#059669' : '#dc2626' }}>{commScore.toFixed(2)} / 4.00</strong>
                    </div>
                    <input
                      type="range" min="1.0" max="4.0" step="0.25"
                      value={commScore}
                      onChange={e => setCommScore(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#059669' }}
                    />
                  </div>

                  {/* BR-1 Real-time Summary Card */}
                  <div style={{
                    backgroundColor: isPassed ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${isPassed ? '#a7f3d0' : '#fecaca'}`,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>คะแนนเฉลี่ยรวม 3 ด้าน:</div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: isPassed ? '#065f46' : '#991b1b' }}>
                        {avgScore} / 4.00
                      </div>
                    </div>
                    <div>
                      {isPassed ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 'bold', color: '#047857', backgroundColor: '#d1fae5', padding: '5px 12px', borderRadius: '999px' }}>
                          <CheckCircle size={15} /> ผ่านเกณฑ์การฝึกอบรม (ทุกด้าน ≥ 2.00)
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 'bold', color: '#b91c1c', backgroundColor: '#fee2e2', padding: '5px 12px', borderRadius: '999px' }}>
                          <AlertTriangle size={15} /> ต้องแก้ไข (มีด้านต่ำกว่า 2.00)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback Note Textarea & Quick Presets */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                      💬 ข้อเสนอแนะถึงผู้เรียน
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSuggestFeedback}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: isPassed ? '#ecfdf5' : '#fef2f2',
                        color: isPassed ? '#047857' : '#b91c1c',
                        border: `1px solid ${isPassed ? '#a7f3d0' : '#fecaca'}`,
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      ✨ แนะนำข้อความตามคะแนนอัตโนมัติ ({isPassed ? 'ผ่านเกณฑ์' : 'ต้องแก้ไข'})
                    </button>
                  </div>

                  {/* Preset Pills */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                      ⚡ คลิกเพื่อเพิ่มข้อความสำเร็จรูป:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {isPassed ? (
                        <>
                          <button
                            type="button"
                            onClick={() => applyPreset('โครงสร้างและ Business Logic ถูกต้องครบถ้วน')}
                            style={{ padding: '3px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#166534', cursor: 'pointer' }}
                          >
                            + โครงสร้างและ Logic ถูกต้อง
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('การออกแบบเป็นระบบและครอบคลุม Edge Cases ได้ดี')}
                            style={{ padding: '3px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#166534', cursor: 'pointer' }}
                          >
                            + ครอบคลุม Edge Cases ดีเยี่ยม
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('พร้อมต่อยอดสู่บทถัดไป')}
                            style={{ padding: '3px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#166534', cursor: 'pointer' }}
                          >
                            + พร้อมต่อยอดสู่บทถัดไป
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => applyPreset('ยังขาด Error Handling และกรณีทดสอบ (Edge Cases)')}
                            style={{ padding: '3px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#991b1b', cursor: 'pointer' }}
                          >
                            + ขาด Error Handling
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('Business Logic ยังไม่ครบถ้วน ขาดขั้นตอน Rollback เมื่อเกิดข้อผิดพลาด')}
                            style={{ padding: '3px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#991b1b', cursor: 'pointer' }}
                          >
                            + ขาดขั้นตอน Rollback
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset('กรุณาปรับปรุงแผนภาพ/เอกสารให้ตรงตามมาตรฐานและส่งตรวจใหม่')}
                            style={{ padding: '3px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#991b1b', cursor: 'pointer' }}
                          >
                            + ปรับปรุงให้ตรงมาตรฐาน
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setFeedbackNote('')}
                        style={{ padding: '3px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer' }}
                      >
                        ล้างข้อความ
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={feedbackNote}
                    onChange={e => setFeedbackNote(e.target.value)}
                    placeholder="กรอกคำติชม แนะนำจุดแข็ง และสิ่งที่ต้องปรับปรุง..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      boxSizing: 'border-box',
                      fontSize: '13.5px'
                    }}
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#f97316',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14.5px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={16} />
                  <span>{loading ? 'กำลังบันทึก...' : 'บันทึกผลการประเมินและปลดล็อกบทถัดไป'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Evaluation History Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '15px' }}>
          ประวัติการตรวจประเมินผลงานย้อนหลัง ({history.length} รายการ)
        </div>
        <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '12px 16px' }}>พนักงาน (Trainee)</th>
              <th style={{ padding: '12px 16px' }}>หัวข้อแบบฝึกหัด</th>
              <th style={{ padding: '12px 16px' }}>ครั้งที่</th>
              <th style={{ padding: '12px 16px' }}>Dev</th>
              <th style={{ padding: '12px 16px' }}>Biz</th>
              <th style={{ padding: '12px 16px' }}>Comm</th>
              <th style={{ padding: '12px 16px' }}>ผลประเมิน</th>
              <th style={{ padding: '12px 16px' }}>Feedback Note</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>ยังไม่มีประวัติการตรวจ</td></tr>
            ) : (
              history.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{h.TraineeName}</td>
                  <td style={{ padding: '12px 16px' }}>{h.AssignmentTitle}</td>
                  <td style={{ padding: '12px 16px' }}>{h.Version_No}</td>
                  <td style={{ padding: '12px 16px' }}>{fmtScore(h.Development_Score)}</td>
                  <td style={{ padding: '12px 16px' }}>{fmtScore(h.BusinessLogic_Score)}</td>
                  <td style={{ padding: '12px 16px' }}>{fmtScore(h.Communication_Score)}</td>
                  <td style={{ padding: '12px 16px' }}><Badge kind={h.Status} /></td>
                  <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.Feedback_Note}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}