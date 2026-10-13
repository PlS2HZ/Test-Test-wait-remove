import { useEffect, useState } from 'react';
import { Users, Compass, CheckCircle, AlertTriangle, Calendar, Award, Plus, ArrowRight } from 'lucide-react';
import { card, h1, Badge, ProgressBar } from '../../components/ui';

export default function TraineeManagement() {
  const [trainees, setTrainees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Form for Assigning Roadmap
  const [roadmapForm, setRoadmapForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    selectedAsgIds: []
  });

  const user = JSON.parse(localStorage.getItem('user'));

  const loadData = () => {
    fetch('/api/trainer/trainees')
      .then(res => res.json())
      .then(data => setTrainees(Array.isArray(data) ? data : []));

    fetch('/api/trainer/assignments')
      .then(res => res.json())
      .then(data => setAssignments(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (t) => {
    setSelectedTrainee(t);
    const today = new Date().toISOString().split('T')[0];
    const twoMonthsLater = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setRoadmapForm({
      title: `Onboarding Roadmap - ${t.Name}`,
      description: `แผนฝึกอบรม 2 เดือน สำหรับ ${t.Position || 'Software Developer'} (${t.Skill_Level || 'Beginner'})`,
      startDate: t.RoadmapStart || today,
      endDate: t.RoadmapEnd || twoMonthsLater,
      selectedAsgIds: assignments.map(a => a.Assignment_ID) // default all in order
    });
    setModalOpen(true);
  };

  const handleToggleAssignment = (id) => {
    const list = [...roadmapForm.selectedAsgIds];
    const idx = list.indexOf(id);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(id);
    }
    setRoadmapForm({ ...roadmapForm, selectedAsgIds: list });
  };

  const handleSaveRoadmap = async (e) => {
    e.preventDefault();
    if (roadmapForm.selectedAsgIds.length === 0) {
      return alert('กรุณาเลือกโจทย์แบบฝึกหัดอย่างน้อย 1 ข้อ');
    }

    try {
      const res = await fetch('/api/trainer/assign-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeId: selectedTrainee.Trainee_ID,
          trainerId: user?.profileId || 1,
          title: roadmapForm.title,
          description: roadmapForm.description,
          startDate: roadmapForm.startDate,
          endDate: roadmapForm.endDate,
          assignmentIds: roadmapForm.selectedAsgIds
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'บันทึกไม่สำเร็จ');

      setMessage('✅ ' + data.message);
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ ...h1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={26} color="#d97706" />
          <span>พนักงานและแผนการเรียนรู้</span>
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
          ติดตามความก้าวหน้ารายบุคคล และกำหนด Roadmap ตามระดับทักษะและสายงาน (Dynamics Motion)
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

      {/* Trainees Cards / Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>รายชื่อพนักงานใหม่ในความดูแล ({trainees.length} คน)</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>เกณฑ์ผ่าน: คะแนนเฉลี่ยทั้ง 3 ด้าน ≥ 2.00</span>
        </div>

        <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '12px 16px' }}>รหัส / ชื่อพนักงาน</th>
              <th style={{ padding: '12px 16px' }}>ตำแหน่ง & ทักษะ</th>
              <th style={{ padding: '12px 16px' }}>สถานะแผน Roadmap</th>
              <th style={{ padding: '12px 16px', minWidth: '160px' }}>ความคืบหน้า (2 เดือน)</th>
              <th style={{ padding: '12px 16px' }}>Dev</th>
              <th style={{ padding: '12px 16px' }}>Biz</th>
              <th style={{ padding: '12px 16px' }}>Comm</th>
              <th style={{ padding: '12px 16px' }}>ผลประเมิน</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {trainees.map(t => (
              <tr key={t.Trainee_ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{t.Name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: TN00{t.Trainee_ID} · เริ่มงาน {t.Start_Date}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div>{t.Position || 'Software Developer'}</div>
                  <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {t.Skill_Level || 'Beginner'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge kind={t.RoadmapStatus || 'Not_Started'} />
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <ProgressBar done={t.completedTasks} total={t.totalTasks} />
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{t.avgDev}</td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{t.avgBiz}</td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{t.avgComm}</td>
                <td style={{ padding: '14px 16px' }}>
                  {t.evalCount === 0 ? (
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>รอส่งงาน</span>
                  ) : t.isPassBR1 ? (
                    <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 'bold' }}>✓ ผ่านเกณฑ์</span>
                  ) : (
                    <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 'bold' }}>⚠️ ต่ำกว่าเกณฑ์</span>
                  )}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => openAssignModal(t)}
                    style={{
                      padding: '7px 14px',
                      backgroundColor: '#fff',
                      border: '1.5px solid #d97706',
                      color: '#d97706',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Compass size={13} /> กำหนดแผน
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* Modal กำหนดแผนการเรียนรู้และเลือกโจทย์ */}
      {modalOpen && selectedTrainee && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <form
            onSubmit={handleSaveRoadmap}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '28px',
              width: '600px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                  กำหนดและมอบหมายเส้นทางการเรียนรู้
                </h2>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  พนักงาน: <strong>{selectedTrainee.Name}</strong> ({selectedTrainee.Position})
                </div>
              </div>
              <Badge kind={selectedTrainee.Skill_Level || 'Beginner'} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ชื่อแผนการเรียนรู้ (Roadmap Title)</label>
              <input
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={roadmapForm.title}
                onChange={e => setRoadmapForm({ ...roadmapForm, title: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>วันที่เริ่มต้น (Start Date)</label>
                <input
                  type="date"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  value={roadmapForm.startDate}
                  onChange={e => setRoadmapForm({ ...roadmapForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>วันที่สิ้นสุด (End Date - 2 เดือน)</label>
                <input
                  type="date"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  value={roadmapForm.endDate}
                  onChange={e => setRoadmapForm({ ...roadmapForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>รายละเอียดแผนการฝึกอบรม</label>
              <textarea
                rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={roadmapForm.description}
                onChange={e => setRoadmapForm({ ...roadmapForm, description: e.target.value })}
              />
            </div>

            {/* Checkbox list of Assignments to Include */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#0f172a' }}>
                เลือกและเรียงลำดับโจทย์แบบฝึกหัดในแผน (Roadmap Items - เรียงตามลำดับ Seq_No):
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {assignments.map((a, idx) => {
                  const isChecked = roadmapForm.selectedAsgIds.includes(a.Assignment_ID);
                  const orderIndex = roadmapForm.selectedAsgIds.indexOf(a.Assignment_ID);
                  return (
                    <div
                      key={a.Assignment_ID}
                      onClick={() => handleToggleAssignment(a.Assignment_ID)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: isChecked ? '#fff' : '#f1f5f9',
                        border: isChecked ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ accentColor: '#2563eb' }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{a.Title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>หมวด: {a.Category} · ความยาก: {a.Difficulty_Level}</div>
                        </div>
                      </div>
                      {isChecked && (
                        <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px' }}>
                          ลำดับที่ {orderIndex + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ padding: '9px 18px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                style={{ padding: '9px 20px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                บันทึกและผูกแผนเข้า Trainee
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}