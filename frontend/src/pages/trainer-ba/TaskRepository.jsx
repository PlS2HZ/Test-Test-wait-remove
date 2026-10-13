import { useEffect, useState } from 'react';
import { FolderKanban, Video, FileText, Plus, Edit2, Trash2, ExternalLink, BookOpen, Layers } from 'lucide-react';
import { card, h1 } from '../../components/ui';

export default function TaskRepository() {
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'assignments'

  // State สำหรับ Materials
  const [materials, setMaterials] = useState([]);
  const [matModal, setMatModal] = useState(null); // null | 'add' | 'edit'
  const [matForm, setMatForm] = useState({ title: '', type: 'Video', description: '', materialUrl: '' });
  const [editingMatId, setEditingMatId] = useState(null);

  // State สำหรับ Assignments
  const [assignments, setAssignments] = useState([]);
  const [asgModal, setAsgModal] = useState(null); // null | 'add' | 'edit'
  const [asgForm, setAsgForm] = useState({
    materialId: '',
    title: '',
    description: '',
    category: 'Development',
    difficultyLevel: 'Beginner',
    deadline: ''
  });
  const [editingAsgId, setEditingAsgId] = useState(null);

  const [message, setMessage] = useState('');

  const loadMaterials = () => {
    fetch('/api/trainer/materials')
      .then(r => r.json())
      .then(data => setMaterials(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  const loadAssignments = () => {
    fetch('/api/trainer/assignments')
      .then(r => r.json())
      .then(data => setAssignments(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadMaterials();
    loadAssignments();
  }, []);

  // Material Actions
  const openAddMaterial = () => {
    setMatForm({ title: '', type: 'Video', description: '', materialUrl: '' });
    setEditingMatId(null);
    setMatModal('add');
  };

  const openEditMaterial = (m) => {
    setMatForm({ title: m.Title, type: m.Type, description: m.Description || '', materialUrl: m.Material_URL });
    setEditingMatId(m.Material_ID);
    setMatModal('edit');
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    const url = matModal === 'add' ? '/api/trainer/materials' : `/api/trainer/materials/${editingMatId}`;
    const method = matModal === 'add' ? 'POST' : 'PUT';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'บันทึกสื่อไม่สำเร็จ');
      setMatModal(null);
      setMessage('✅ ' + data.message);
      loadMaterials();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('คุณต้องการลบสื่อการสอนนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/trainer/materials/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'ลบไม่สำเร็จ');
      setMessage('✅ ' + data.message);
      loadMaterials();
    } catch (err) {
      alert(err.message);
    }
  };

  // Assignment Actions
  const openAddAssignment = () => {
    setAsgForm({
      materialId: materials[0]?.Material_ID || '',
      title: '',
      description: '',
      category: 'Development',
      difficultyLevel: 'Beginner',
      deadline: '2026-10-31 17:00:00'
    });
    setEditingAsgId(null);
    setAsgModal('add');
  };

  const openEditAssignment = (a) => {
    setAsgForm({
      materialId: a.Material_ID,
      title: a.Title,
      description: a.Description || '',
      category: a.Category,
      difficultyLevel: a.Difficulty_Level,
      deadline: a.Deadline
    });
    setEditingAsgId(a.Assignment_ID);
    setAsgModal('edit');
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    const url = asgModal === 'add' ? '/api/trainer/assignments' : `/api/trainer/assignments/${editingAsgId}`;
    const method = asgModal === 'add' ? 'POST' : 'PUT';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asgForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'บันทึกโจทย์ไม่สำเร็จ');
      setAsgModal(null);
      setMessage('✅ ' + data.message);
      loadAssignments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('คุณต้องการลบโจทย์แบบฝึกหัดนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/trainer/assignments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'ลบไม่สำเร็จ');
      setMessage('✅ ' + data.message);
      loadAssignments();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ ...h1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderKanban size={24} color="#f97316" />
            <span>สื่อและแบบฝึกหัด</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
            จัดการสื่อการเรียนรู้มาตรฐานและโจทย์แบบฝึกหัดสำหรับกำหนดในแผนการเรียนรู้
          </p>
        </div>

        {activeTab === 'materials' ? (
          <button
            onClick={openAddMaterial}
            style={{
              padding: '10px 18px',
              backgroundColor: '#f97316',
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
            <Plus size={16} />
            <span>+ เพิ่มสื่อการสอนใหม่</span>
          </button>
        ) : (
          <button
            onClick={openAddAssignment}
            style={{
              padding: '10px 18px',
              backgroundColor: '#2563eb',
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
            <Plus size={16} />
            <span>+ เพิ่มโจทย์แบบฝึกหัดใหม่</span>
          </button>
        )}
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#065f46',
          marginBottom: '16px'
        }}>
          {message}
        </div>
      )}

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('materials')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'materials' ? '3px solid #f97316' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'materials' ? '#f97316' : '#64748b',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Video size={16} />
          <span>สื่อการเรียนรู้ [{materials.length}]</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'assignments' ? '3px solid #2563eb' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'assignments' ? '#2563eb' : '#64748b',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={16} />
          <span>แบบฝึกหัด [{assignments.length}]</span>
        </button>
      </div>

      {/* Tab 1: Materials List */}
      {activeTab === 'materials' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {materials.map(m => (
            <div key={m.Material_ID} style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    backgroundColor: m.Type === 'Video' ? '#eff6ff' : '#fef3c7',
                    color: m.Type === 'Video' ? '#1d4ed8' : '#b45309'
                  }}>
                    {m.Type === 'Video' ? '🎥 วิดีโอสอนงาน' : '📄 เอกสาร/คู่มือ'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {m.Material_ID}</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px', color: '#0f172a' }}>
                  {m.Title}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px', minHeight: '38px' }}>
                  {m.Description || '-'}
                </p>
                <div style={{ fontSize: '12px', wordBreak: 'break-all', marginBottom: '14px' }}>
                  <a href={m.Material_URL} target="_blank" rel="noreferrer" style={{ color: '#f97316', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{m.Material_URL}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  ใช้งานในโจทย์: {m.usedInAssignments || 0} ข้อ
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openEditMaterial(m)}
                    style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(m.Material_ID)}
                    style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Assignments List */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {assignments.map(a => (
            <div key={a.Assignment_ID} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: a.Category === 'Development' ? '#eff6ff' : '#ecfdf5',
                    color: a.Category === 'Development' ? '#1d4ed8' : '#047857'
                  }}>
                    {a.Category}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                    ระดับ: {a.Difficulty_Level}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {a.Assignment_ID}</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{a.Title}</div>
                <div style={{ fontSize: '13px', color: '#64748b', margin: '4px 0' }}>{a.Description || '-'}</div>
                <div style={{ fontSize: '12px', color: '#f97316', fontWeight: 'bold' }}>
                  สื่อการสอนที่ผูก: <span>{a.MaterialTitle} ({a.MaterialType})</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold' }}>
                  กำหนดส่ง: {a.Deadline}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditAssignment(a)}
                    style={{ padding: '6px 14px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={13} /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(a.Assignment_ID)}
                    style={{ padding: '6px 14px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={13} /> ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal เพิ่ม/แก้ไข Material */}
      {matModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleSaveMaterial} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '24px', width: '480px', maxWidth: '90vw' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold' }}>
              {matModal === 'add' ? '+ เพิ่มสื่อการสอนใหม่' : 'แก้ไขสื่อการสอน'}
            </h2>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ชื่อสื่อการสอน / หัวข้อบทเรียน</label>
              <input
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={matForm.title}
                onChange={e => setMatForm({ ...matForm, title: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ประเภทสื่อ (Type)</label>
              <select
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={matForm.type}
                onChange={e => setMatForm({ ...matForm, type: e.target.value })}
              >
                <option value="Video">Video (วิดีโอคลิป / YouTube)</option>
                <option value="Document">Document (เอกสาร / PDF)</option>
                <option value="Slides">Slides (สไลด์ประกอบการสอน)</option>
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ลิงก์สื่อการสอน (YouTube URL หรือ Cloud Storage URL)</label>
              <input
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={matForm.materialUrl}
                onChange={e => setMatForm({ ...matForm, materialUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>คำอธิบายเนื้อหาโดยย่อ</label>
              <textarea
                rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={matForm.description}
                onChange={e => setMatForm({ ...matForm, description: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setMatModal(null)}
                style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                style={{ padding: '8px 18px', backgroundColor: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                บันทึกข้อมูล
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal เพิ่ม/แก้ไข Assignment */}
      {asgModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleSaveAssignment} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '24px', width: '500px', maxWidth: '90vw' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold' }}>
              {asgModal === 'add' ? '+ เพิ่มโจทย์แบบฝึกหัดใหม่' : 'แก้ไขโจทย์แบบฝึกหัด'}
            </h2>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ผูกกับสื่อการสอน (Material ID)</label>
              <select
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={asgForm.materialId}
                onChange={e => setAsgForm({ ...asgForm, materialId: e.target.value })}
              >
                {materials.map(m => (
                  <option key={m.Material_ID} value={m.Material_ID}>
                    [{m.Material_ID}] {m.Title} ({m.Type})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ชื่อหัวข้อโจทย์ / งาน</label>
              <input
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={asgForm.title}
                onChange={e => setAsgForm({ ...asgForm, title: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>หมวดหมู่ (Category)</label>
                <select
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  value={asgForm.category}
                  onChange={e => setAsgForm({ ...asgForm, category: e.target.value })}
                >
                  <option value="Development">Development (เขียนโค้ด)</option>
                  <option value="Business_Logic">Business_Logic (โฟลว์ธุรกิจ)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ระดับความยาก</label>
                <select
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  value={asgForm.difficultyLevel}
                  onChange={e => setAsgForm({ ...asgForm, difficultyLevel: e.target.value })}
                >
                  <option value="Beginner">Beginner (เบื้องต้น)</option>
                  <option value="Intermediate">Intermediate (ปานกลาง)</option>
                  <option value="Advanced">Advanced (ขั้นสูง)</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>กำหนดส่ง (Deadline)</label>
              <input
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={asgForm.deadline}
                onChange={e => setAsgForm({ ...asgForm, deadline: e.target.value })}
                placeholder="2026-10-31 17:00:00"
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>คำอธิบายโจทย์ / รายละเอียดงาน</label>
              <textarea
                rows={3}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={asgForm.description}
                onChange={e => setAsgForm({ ...asgForm, description: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAsgModal(null)}
                style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                บันทึกข้อมูล
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}