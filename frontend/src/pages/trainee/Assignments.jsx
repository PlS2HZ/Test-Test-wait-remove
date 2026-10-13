import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { Badge, card, fmtDateTime, getUser, h1 } from '../../components/ui';

const chip = { fontSize: '12px', backgroundColor: '#f3f4f6', padding: '3px 10px', borderRadius: '999px', color: '#374151' };
const input = { width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' };

// แสดงสื่อในหน้าเดียวกัน: YouTube / ไฟล์วิดีโอ / อื่นๆ เป็นลิงก์เปิด
function MaterialViewer({ url, type }) {
  const [failed, setFailed] = useState(false);
  const yt = url ? url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/) : null;
  if (yt) {
    return (
      <iframe
        title="video" src={`https://www.youtube.com/embed/${yt[1]}`} allowFullScreen
        style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: '8px' }}
      />
    );
  }
  if (!failed && url && /\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return <video src={url} controls onError={() => setFailed(true)} style={{ width: '100%', maxHeight: '360px', borderRadius: '8px', backgroundColor: '#000' }} />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#f97316' }}>
      <span>เปิด{type === 'Video' ? 'วิดีโอ' : 'เอกสารคู่มือ'}</span>
      <ExternalLink size={14} />
    </a>
  );
}

export default function Assignments() {
  const user = getUser();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});
  const [drafts, setDrafts] = useState({});
  const [notes, setNotes] = useState({});
  const [notice, setNotice] = useState(null);
  const [sending, setSending] = useState(false);

  const load = () => {
    if (!user?.profileId) return;
    fetch(`/api/trainee/assignments/${user.profileId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return setError(d.message);
        setData(d);
        setOpen(prev => {
          if (Object.keys(prev).length) return prev;
          const selected = d.items.find(it => it.Item_ID === location.state?.openItem && it.Unlocked)
            || d.items.find(it => it.Unlocked && it.ItemStatus !== 'Completed')
            || d.items.find(it => it.Unlocked);
          return selected ? { [selected.Item_ID]: true } : {};
        });
      })
      .catch(() => setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'));
  };

  useEffect(() => {
    if (user?.profileId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const urlsOf = (id) => drafts[id] || [''];
  const setUrl = (id, idx, val) => setDrafts({ ...drafts, [id]: urlsOf(id).map((u, i) => (i === idx ? val : u)) });
  const addUrl = (id) => setDrafts({ ...drafts, [id]: [...urlsOf(id), ''] });
  const removeUrl = (id, idx) => setDrafts({ ...drafts, [id]: urlsOf(id).filter((_, i) => i !== idx) });

  const handleSubmit = async (item) => {
    let urls = urlsOf(item.Assignment_ID).map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      return setNotice({ ok: false, text: 'กรุณาแนบลิงก์ผลงานอย่างน้อย 1 รายการ' });
    }

    if (urls.some(url => { try { return !['https:', 'http:'].includes(new URL(url).protocol); } catch { return true; } })) return setNotice({ ok: false, text: 'กรุณาระบุลิงก์ http หรือ https ที่เปิดดูได้' });
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch('/api/trainee/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeId: user.profileId,
          assignmentId: item.Assignment_ID,
          files: urls.map((url) => ({ url })),
          notes: notes[item.Assignment_ID] || ''
        })
      });
      const d = await res.json();
      setNotice({ ok: res.ok, text: d.message });
      if (res.ok) {
        setDrafts({ ...drafts, [item.Assignment_ID]: [''] });
        setNotes({ ...notes, [item.Assignment_ID]: '' });
        load();
      }
    } catch {
      setNotice({ ok: false, text: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setSending(false);
    }
  };

  if (error) return <div style={{ color: '#dc2626' }}>{error}</div>;
  if (!data) return <div style={{ color: '#6b7280' }}>กำลังโหลด...</div>;
  if (!data.roadmap) {
    return (
      <div>
        <h1 style={h1}>สื่อการเรียนรู้และแบบฝึกหัด</h1>
        <div style={{ ...card, color: '#6b7280' }}>ยังไม่มีแผนการฝึกอบรมสำหรับผู้ใช้งาน</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title & User Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ ...h1, margin: 0 }}>บทเรียนและส่งงาน</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13.5px' }}>
            ศึกษาเนื้อหาบทเรียนและส่งงานเพื่อรับการประเมินจาก Trainer & Business Analyst
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#eff6ff',
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid #bfdbfe'
        }}>
          <UserCheck size={18} color="#2563eb" />
          <div style={{ fontSize: '12.5px' }}>
            <span style={{ color: '#64748b' }}>ผู้ส่งงาน: </span>
            <strong style={{ color: '#1e293b' }}>{user?.fullName}</strong>
            <span style={{ color: '#2563eb', fontWeight: 'bold', marginLeft: '6px' }}>({user?.username})</span>
          </div>
        </div>
      </div>

      <div className="lesson-steps"><div className="lesson-step"><strong>1</strong>ศึกษาบทเรียน</div><div className="lesson-step"><strong>2</strong>ลงมือทำและส่งงาน</div><div className="lesson-step"><strong>3</strong>รับผลประเมินและเรียนต่อ</div></div>
      {notice && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontWeight: 'bold',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: notice.ok ? '#ecfdf5' : '#fef2f2',
          border: `1.5px solid ${notice.ok ? '#a7f3d0' : '#fecaca'}`,
          color: notice.ok ? '#065f46' : '#b91c1c'
        }}>
          {notice.ok ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Chapter Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {data.items.map((item) => {
          const isOpen = !!open[item.Item_ID];
          const kind = !item.Unlocked ? 'Locked' : item.blockReason === 'WAITING' ? 'Waiting' : item.submitMode === 'resubmit' ? 'Need_Revision' : item.ItemStatus;
          const id = item.Assignment_ID;
          const hasPassed = item.ItemStatus === 'Completed' || (item.latest && item.latest.EvalStatus === 'Passed');
          const isWaiting = item.latest && !item.latest.EvalStatus;

          return (
            <div
              key={item.Item_ID}
              style={{
                ...card,
                opacity: item.Unlocked ? 1 : 0.7,
                border: item.Unlocked ? '1.5px solid #cbd5e1' : '1px dashed #cbd5e1',
                borderLeft: item.Unlocked ? '5px solid #f97316' : '5px solid #94a3b8',
                padding: '20px 24px'
              }}
            >
              {/* Card Header */}
              <div
                role={item.Unlocked ? 'button' : undefined}
                tabIndex={item.Unlocked ? 0 : undefined}
                aria-expanded={item.Unlocked ? isOpen : undefined}
                onKeyDown={e => { if (item.Unlocked && ['Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen({ ...open, [item.Item_ID]: !isOpen }); } }}
                onClick={() => item.Unlocked && setOpen({ ...open, [item.Item_ID]: !isOpen })}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: item.Unlocked ? 'pointer' : 'default',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: hasPassed ? '#d1fae5' : item.Unlocked ? '#ffedd5' : '#f1f5f9',
                      color: hasPassed ? '#047857' : item.Unlocked ? '#c2410c' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '14px'
                    }}>
                      {hasPassed ? '✓' : item.Seq_No}
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>
                      บทที่ {item.Seq_No}: {item.Title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', marginLeft: '42px' }}>
                    <span style={chip}>{item.Category === 'Development' ? 'Development' : 'Business Logic'}</span>
                    <span style={chip}>{item.Difficulty_Level}</span>
                    <span style={{ ...chip, color: '#dc2626' }}>กำหนดส่ง: {fmtDateTime(item.Deadline)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Badge kind={kind} />
                  {item.Unlocked && (
                    <div style={{ fontSize: '12.5px', color: '#f97316', fontWeight: 'bold', marginTop: '8px' }}>
                      {isOpen ? '▲ ซ่อนรายละเอียด' : '▼ เปิดดูสื่อและส่งงาน'}
                    </div>
                  )}
                </div>
              </div>

              {!item.Unlocked && (
                <div style={{ marginTop: '14px', marginLeft: '42px', fontSize: '13.5px', color: '#64748b' }}>
                  🔒 บทนี้ยังไม่ปลดล็อก — ต้องทำบทที่ {item.Seq_No - 1} ให้ผ่านการประเมินก่อน จึงจะส่งงานได้
                </div>
              )}

              {/* Unlocked Details Section */}
              {item.Unlocked && isOpen && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
                  
                  {/* Learning Material Card */}
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="#2563eb" />
                      <span>สื่อการเรียนรู้: {item.MaterialTitle}</span>
                      <span style={chip}>{item.MaterialType}</span>
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#475569', marginBottom: '12px' }}>
                      {item.MaterialDescription || '-'}
                    </div>
                    <MaterialViewer url={item.Material_URL} type={item.MaterialType} />
                  </div>

                  {/* Assignment Problem Prompt */}
                  <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#0f172a', marginBottom: '6px' }}>
                      📝 คำอธิบายโจทย์ / ข้อกำหนด:
                    </div>
                    <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                      {item.Description || '-'}
                    </div>
                  </div>

                  {/* Submission History */}
                  {item.submissions.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} color="#64748b" />
                        <span>ประวัติการส่งงานและผลประเมิน ({item.submissions.length} ครั้ง):</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[...item.submissions].reverse().map((s) => (
                          <div key={s.Submission_ID} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', backgroundColor: '#fafafa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <div>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>ส่งครั้งที่ {s.Version_No}</strong>
                                <span style={{ fontSize: '12.5px', color: '#64748b', marginLeft: '10px' }}>
                                  ส่งเมื่อ: {fmtDateTime(s.Submitted_At)}
                                </span>
                              </div>
                              <Badge kind={s.EvalStatus || 'Waiting'} />
                            </div>

                            <div style={{ fontSize: '13px', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {s.Files.map((f, idx) => f.type === 'Note' ? (<p key={idx} style={{ margin: 0, color: '#475569' }}>หมายเหตุ: {f.url}</p>) : (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>📎</span>
                                  <a href={f.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 'bold' }}>
                                    {f.name || f.url}
                                  </a>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>({f.type})</span>
                                </div>
                              ))}
                            </div>

                            {s.EvalStatus && (
                              <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                                  ผลการตรวจประเมิน:
                                  <span style={{ color: s.Development_Score >= 2.0 ? '#0284c7' : '#dc2626', marginLeft: '8px' }}>
                                    Dev: {Number(s.Development_Score).toFixed(2)}
                                  </span>
                                  <span style={{ color: s.BusinessLogic_Score >= 2.0 ? '#0284c7' : '#dc2626', marginLeft: '8px' }}>
                                    Biz: {Number(s.BusinessLogic_Score).toFixed(2)}
                                  </span>
                                  <span style={{ color: s.Communication_Score >= 2.0 ? '#0284c7' : '#dc2626', marginLeft: '8px' }}>
                                    Comm: {Number(s.Communication_Score).toFixed(2)}
                                  </span>
                                </div>
                                {s.Feedback_Note && (
                                  <div style={{ fontSize: '13px', color: '#334155' }}>
                                    💬 <em>"{s.Feedback_Note}"</em>
                                    {s.Trainer_Name && <span style={{ color: '#64748b', marginLeft: '6px' }}>— ผู้ตรวจ: {s.Trainer_Name}</span>}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Banner */}
                  {hasPassed && (
                    <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} color="#059669" />
                      <span>✓ บทนี้ผ่านการประเมินแล้ว (Passed) — บทถัดไปได้รับการปลดล็อกเรียบร้อยแล้ว</span>
                    </div>
                  )}

                  {isWaiting && (
                    <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={18} color="#2563eb" />
                      <span>ส่งงานแล้ว ผู้ฝึกสอนกำลังตรวจประเมิน คุณจะส่งแก้ไขได้เมื่อได้รับผลประเมิน</span>
                    </div>
                  )}

                  {/* PROMINENT SUBMISSION BOX */}
                  { !hasPassed && !isWaiting && <div style={{
                    backgroundColor: '#fffaf5',
                    border: '2px solid #fdba74',
                    borderRadius: '14px',
                    padding: '20px 22px',
                    marginTop: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UploadCloud size={22} color="#ea580c" />
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#9a3412' }}>
                          {item.submissions.length > 0 ? `ส่งงานเพิ่มเติม / ส่งงานแก้ไข (ครั้งที่ ${item.submissions.length + 1})` : 'ส่งงานสำหรับบทนี้'}
                        </h4>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>
                        ผู้ส่ง: <strong style={{ color: '#0f172a' }}>{user?.fullName}</strong> ({user?.username})
                      </span>
                    </div>

                    <p className="field-help">แนบลิงก์ผลงานจาก GitHub หรือพื้นที่จัดเก็บไฟล์ และเปิดสิทธิ์ให้ผู้ฝึกสอนเข้าดูได้</p>
                    {/* File / URL Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {urlsOf(id).map((u, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                          <input
                            style={input}
                            value={u}
                            placeholder="https://github.com/… หรือ https://drive.google.com/…"
                            onChange={(e) => setUrl(id, idx, e.target.value)}
                          />
                          {urlsOf(id).length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeUrl(id, idx)}
                              style={{ border: '1px solid #cbd5e1', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', cursor: 'pointer', padding: '0 12px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Optional Notes */}
                    <div style={{ marginBottom: '16px' }}>
                      <textarea
                        rows={2}
                        placeholder="ข้อความ / หมายเหตุประกอบการส่งงานถึง Trainer & BA (ถ้ามี)..."
                        value={notes[id] || ''}
                        onChange={(e) => setNotes({ ...notes, [id]: e.target.value })}
                        style={{ ...input, resize: 'vertical' }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => addUrl(id)}
                        style={{ border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '8px', cursor: 'pointer', padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Plus size={15} />
                        <span>เพิ่มลิงก์ผลงาน</span>
                      </button>

                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => handleSubmit(item)}
                        style={{
                          backgroundColor: sending ? '#94a3b8' : '#ea580c',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 22px',
                          fontSize: '14.5px',
                          fontWeight: '800',
                          cursor: sending ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)'
                        }}
                      >
                        <Send size={16} />
                        <span>{sending ? 'กำลังส่งงาน...' : 'ส่งงานให้ผู้ฝึกสอน'}</span>
                      </button>
                    </div>
                  </div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}