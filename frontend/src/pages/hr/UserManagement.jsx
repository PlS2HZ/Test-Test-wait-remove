import { useEffect, useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, Users, UserCheck, Briefcase } from 'lucide-react';
import { card, h1, Badge } from '../../components/ui';

const EMPTY_FORM = {
  username: '',
  password: '',
  name: '',
  role: 'Trainee',
  position: 'Software Developer',
  department: 'IT Development',
  skillLevel: 'Beginner'
};

const th = { textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#64748b', fontWeight: 'bold' };
const td = { padding: '14px 16px', fontSize: '13.5px', borderTop: '1px solid #e2e8f0' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('ALL');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = () => {
    fetch('/api/hr/users')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setError(data?.message || 'โหลดข้อมูลไม่สำเร็จ');
          return;
        }
        setError('');
        setUsers(data);
      })
      .catch(() => setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMode('add');
  };

  const openEdit = (u) => {
    setForm({
      username: u.Username,
      password: '',
      name: u.Name || '',
      role: u.Role,
      position: u.Position || '',
      department: u.Department || '',
      skillLevel: 'Beginner'
    });
    setEditingId(u.User_ID);
    setMode('edit');
  };

  const closeModal = () => setMode(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('กรุณากรอกชื่อ');
    if (mode === 'add' && (!form.username.trim() || !form.password)) {
      return alert('กรุณากรอก Username และรหัสผ่าน');
    }

    setSaving(true);
    try {
      const url = mode === 'add' ? '/api/hr/users' : `/api/hr/users/${editingId}`;
      const res = await fetch(url, {
        method: mode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'บันทึกไม่สำเร็จ');

      setMessage('✅ ' + (data.message || 'บันทึกข้อมูลเรียบร้อย'));
      closeModal();
      loadUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน "${name}" ออกจากระบบ?`)) return;
    try {
      const res = await fetch(`/api/hr/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'ลบไม่สำเร็จ');
      setMessage('✅ ' + data.message);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = filterRole === 'ALL' ? users : users.filter(u => u.Role === filterRole);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ ...h1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} color="#059669" />
            <span>บัญชีและสิทธิ์ผู้ใช้งาน</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
            ดูแลข้อมูลพนักงานและกำหนดบทบาทตามหน้าที่รับผิดชอบ
          </p>
        </div>

        <button
          onClick={openAdd}
          style={{
            backgroundColor: '#059669',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <UserPlus size={16} />
          <span>+ เพิ่มผู้ใช้งานใหม่</span>
        </button>
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

      {error && <div style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</div>}

      {/* Role Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'Trainee', 'Trainer', 'HR'].map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: filterRole === r ? '1px solid #059669' : '1px solid #cbd5e1',
              backgroundColor: filterRole === r ? '#059669' : '#ffffff',
              color: filterRole === r ? '#ffffff' : '#475569',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {r === 'ALL' ? 'ทั้งหมด' : r} ({r === 'ALL' ? users.length : users.filter(u => u.Role === r).length})
          </button>
        ))}
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={th}>User ID</th>
              <th style={th}>Username (รหัสพนักงาน)</th>
              <th style={th}>ชื่อ - นามสกุล</th>
              <th style={th}>ตำแหน่ง (Position)</th>
              <th style={th}>แผนก (Department)</th>
              <th style={th}>บทบาท (Role)</th>
              <th style={{ ...th, textAlign: 'right' }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ ...td, textAlign: 'center', color: '#64748b', padding: '30px' }}>
                  ไม่พบข้อมูลผู้ใช้
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.User_ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={td}>{u.User_ID}</td>
                  <td style={{ ...td, fontWeight: 'bold', color: '#0f172a' }}>{u.Username}</td>
                  <td style={td}>{u.Name || '-'}</td>
                  <td style={td}>{u.Position || '-'}</td>
                  <td style={td}>{u.Department || '-'}</td>
                  <td style={td}><Badge kind={u.Role} /></td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => openEdit(u)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit2 size={12} /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(u.User_ID, u.Name || u.Username)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={12} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table></div>
      </div>

      {/* Modal Add / Edit User */}
      {mode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <form
            onSubmit={handleSave}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '28px',
              width: '460px',
              maxWidth: '90vw'
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold' }}>
              {mode === 'add' ? '+ เพิ่มผู้ใช้งานใหม่' : 'แก้ไขข้อมูลผู้ใช้งาน'}
            </h2>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                ชื่อ - นามสกุล
              </label>
              <input
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Username (รหัสพนักงาน)
                </label>
                <input
                  required
                  disabled={mode === 'edit'}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: mode === 'edit' ? '#f1f5f9' : '#fff' }}
                  placeholder="เช่น TN006, TR003"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  บทบาท (Role)
                </label>
                <select
                  disabled={mode === 'edit'}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: mode === 'edit' ? '#f1f5f9' : '#fff' }}
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="Trainee">Trainee (พนักงานใหม่)</option>
                  <option value="Trainer">Trainer (พี่เลี้ยง/BA)</option>
                  <option value="HR">HR (ฝ่ายบุคคล)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                รหัสผ่าน {mode === 'edit' && '(เว้นว่างหากไม่ต้องการเปลี่ยน)'}
              </label>
              <input
                type="password"
                required={mode === 'add'}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ตำแหน่งงาน (Position)</label>
                <input
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  value={form.position}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                />
              </div>

              {form.role === 'Trainee' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>ระดับทักษะ (Skill)</label>
                  <select
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    value={form.skillLevel}
                    onChange={e => setForm({ ...form, skillLevel: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Junior">Junior</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>แผนก (Department)</label>
                  <input
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{ padding: '9px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}