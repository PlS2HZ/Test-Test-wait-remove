// ส่วนกลางที่ใช้ร่วมกันทุกหน้า (สไตล์, badge, progress bar, ฟังก์ชันจัดรูปแบบ)

export const BR_PASS = 2.0; // BR-1: ค่าเฉลี่ยแต่ละด้านต้องไม่ต่ำกว่า 2.00

export const th = { textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' };
export const td = { padding: '14px 16px', fontSize: '14px', borderTop: '1px solid #e5e7eb', verticalAlign: 'top' };
export const card = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' };
export const h1 = { fontSize: '24px', fontWeight: '800', margin: '0 0 20px' };

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function fmtDate(v) {
  if (!v) return '-';
  const [y, m, d] = String(v).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function fmtDateTime(v) {
  if (!v) return '-';
  return `${fmtDate(v)} ${String(v).slice(11, 16)}`;
}

export const fmtScore = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? '-' : Number(n).toFixed(2);

const BADGES = {
  Not_Started: ['ยังไม่เริ่ม', '#e5e7eb', '#374151'],
  In_Progress: ['กำลังเรียน', '#fef3c7', '#b45309'],
  Completed: ['เสร็จสิ้น', '#d1fae5', '#047857'],
  Locked: ['ยังไม่ปลดล็อก', '#f3f4f6', '#6b7280'],
  Waiting: ['รอตรวจ', '#dbeafe', '#1d4ed8'],
  Passed: ['ผ่านแล้ว', '#d1fae5', '#047857'],
  Need_Revision: ['ต้องแก้ไข', '#fee2e2', '#dc2626'],
  Failed: ['ไม่ผ่าน', '#fee2e2', '#dc2626'],
  Extended: ['ขยายเวลา', '#fef3c7', '#b45309']
};

export function Badge({ kind }) {
  const [label, bg, color] = BADGES[kind] || [kind || '-', '#e5e7eb', '#374151'];
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 'bold', backgroundColor: bg, color, whiteSpace: 'nowrap'
    }}>
      {label}
    </span>
  );
}

export function ProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ height: '10px', backgroundColor: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#f59e0b' }} />
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
        {done} / {total} บท ({pct}%)
      </div>
    </div>
  );
}

export function StatCard({ title, bg = '#fef6e4', children }) {
  return (
    <div style={{ flex: 1, minWidth: '200px', backgroundColor: bg, borderRadius: '16px', padding: '18px 20px' }}>
      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280', marginBottom: '12px' }}>{title}</div>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '14px 16px' }}>{children}</div>
    </div>
  );
}