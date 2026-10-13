import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, RefreshCw, Table, Server, Play, Trash2, Edit3, Search, Terminal, BookOpen, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { card, h1, getUser } from '../components/ui';

export default function DatabaseInspector() {
  const user = getUser();
  const isAuthorized = user?.role === 'HR' || user?.role === 'Trainer';

  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('User');
  const [tableData, setTableData] = useState([]);
  const [driver, setDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');

  // SQL Console state
  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer' | 'console' | 'cheatsheet'
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM User LIMIT 10;');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState('');

  const loadTables = () => {
    if (!isAuthorized) return;
    fetch('/api/database/tables')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTables(d.tables);
          setDriver(d.driver);
        }
      })
      .catch(err => console.error(err));
  };

  const loadTableData = (name) => {
    setLoading(true);
    fetch(`/api/database/table/${name}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTableData(d.rows || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTables();
    loadTableData(selectedTable);
  }, []);

  const handleSelectTable = (name) => {
    setSelectedTable(name);
    loadTableData(name);
  };

  const handleResetData = async () => {
    if (!window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้ง 13 ตารางกลับสู่ค่าเริ่มต้นเพื่อเริ่มการทดสอบใหม่หรือไม่?')) {
      return;
    }
    setResetting(true);
    setMessage('');
    try {
      const res = await fetch('/api/database/reset', { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        setMessage('✅ รีเซ็ตข้อมูล 13 ตารางกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
        loadTables();
        loadTableData(selectedTable);
        setQueryResult(null);
        setQueryError('');
      }
    } catch (err) {
      setMessage('❌ เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  // Run Raw SQL Query
  const handleExecuteSql = async (customSql) => {
    const codeToRun = customSql || sqlQuery;
    if (!codeToRun || !codeToRun.trim()) {
      setQueryError('กรุณากรอกคำสั่ง SQL');
      return;
    }

    setQueryRunning(true);
    setQueryError('');
    setQueryResult(null);

    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: codeToRun })
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult(data);
        // Refresh tables count in case of UPDATE / DELETE / INSERT
        loadTables();
        loadTableData(selectedTable);
      } else {
        setQueryError(data.error || data.message || 'เกิดข้อผิดพลาดในการรันคำสั่ง SQL');
      }
    } catch (err) {
      setQueryError('ข้อผิดพลาดการเชื่อมต่อ: ' + err.message);
    } finally {
      setQueryRunning(false);
    }
  };

  const sqlTemplates = [
    {
      title: 'ดูข้อมูลผู้ใช้ทั้งหมด (SELECT)',
      type: 'SELECT',
      sql: 'SELECT User_ID, Username, First_Name, Last_Name, Role, Email FROM User;'
    },
    {
      title: 'ดูเด็กฝึกงาน + แผนก (JOIN)',
      type: 'SELECT',
      sql: 'SELECT t.Trainee_ID, u.First_Name, u.Last_Name, d.Department_Name, t.Skill_Level, t.Status \nFROM Trainee t \nJOIN User u ON t.User_ID = u.User_ID \nJOIN Department d ON t.Department_ID = d.Department_ID;'
    },
    {
      title: 'ดูผลประเมิน 3 มิติ (Dev, Biz, Comm)',
      type: 'SELECT',
      sql: 'SELECT Evaluation_ID, Submission_ID, Score_Dev, Score_Biz, Score_Comm, Total_Score, Evaluation_Result \nFROM Evaluation;'
    },
    {
      title: 'ดูงานที่ส่งและสถานะ (Submission)',
      type: 'SELECT',
      sql: 'SELECT Submission_ID, Trainee_ID, Assignment_ID, Submission_Date, Status \nFROM Submission;'
    },
    {
      title: 'แก้ไขระดับทักษะของสมชาย (UPDATE)',
      type: 'UPDATE',
      sql: "UPDATE Trainee \nSET Skill_Level = 'Intermediate' \nWHERE Trainee_ID = 1;"
    },
    {
      title: 'แก้ไขสถานะการส่งงานเป็น Reviewed (UPDATE)',
      type: 'UPDATE',
      sql: "UPDATE Submission \nSET Status = 'Reviewed' \nWHERE Submission_ID = 1;"
    },
    {
      title: 'แก้ไขคะแนนการประเมิน (UPDATE)',
      type: 'UPDATE',
      sql: "UPDATE Evaluation \nSET Score_Dev = 3.50, Score_Biz = 3.20, Total_Score = 3.35, Evaluation_Result = 'Pass' \nWHERE Evaluation_ID = 1;"
    },
    {
      title: 'เพิ่มแผนกใหม่ (INSERT)',
      type: 'INSERT',
      sql: "INSERT INTO Department (Department_Name, Description) \nVALUES ('Mobile App Development', 'ทีมพัฒนาแอปพลิเคชันมือถือ');"
    },
    {
      title: 'ลบประวัติการส่งงานตัวอย่าง (DELETE)',
      type: 'DELETE',
      sql: "DELETE FROM Submission \nWHERE Submission_ID = 999;"
    }
  ];

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];
  const resultColumns = queryResult?.rows && queryResult.rows.length > 0 ? Object.keys(queryResult.rows[0]) : [];

  if (!isAuthorized) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '60px 24px', maxWidth: '580px', margin: '40px auto', border: '1.5px solid #fecaca', backgroundColor: '#ffffff', borderRadius: '16px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Shield size={32} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
          สิทธิ์การเข้าถึงถูกจำกัด (Access Restricted)
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
          หน้านี้สงวนสิทธิ์เฉพาะ <strong>ฝ่ายบุคคล (HR)</strong> และ <strong>ผู้ฝึกสอน / Business Analyst (Trainer/BA)</strong> เท่านั้น เพื่อความปลอดภัยของข้อมูล พนักงานฝึกอบรม (Trainee) ไม่สามารถเข้าถึงได้
        </p>
        <Link
          to="/trainee/dashboard"
          style={{
            padding: '10px 22px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13.5px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          กลับสู่หน้าหลัก Trainee Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ ...h1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} color="#0284c7" />
            <span>ตรวจสอบและจัดการฐานข้อมูล (13 Tables & SQL Console)</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
            ดูข้อมูล, พิมพ์คำสั่ง SQL สด (SELECT, UPDATE, DELETE), และคู่มือเชื่อมต่อ DBA
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '1px solid #bae6fd'
          }}>
            <Server size={14} />
            <span>Engine: {driver.toUpperCase()}</span>
          </div>

          <button
            onClick={handleResetData}
            disabled={resetting}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              cursor: resetting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={resetting ? 'animate-spin' : ''} />
            <span>{resetting ? 'กำลังรีเซ็ต...' : 'รีเซ็ตข้อมูลตั้งต้น (Reset 13 Tables)'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: message.includes('✅') ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${message.includes('✅') ? '#a7f3d0' : '#fecaca'}`,
          borderRadius: '10px',
          fontSize: '13px',
          color: message.includes('✅') ? '#065f46' : '#991b1b',
          marginBottom: '16px'
        }}>
          {message}
        </div>
      )}

      {/* Main Mode Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setActiveTab('viewer')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'viewer' ? '#0284c7' : '#f1f5f9',
            color: activeTab === 'viewer' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Table size={16} /> 1. เรียกดูตารางทั้ง 13 ตาราง (Table Grid)
        </button>

        <button
          onClick={() => setActiveTab('console')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'console' ? '#0f172a' : '#f1f5f9',
            color: activeTab === 'console' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Terminal size={16} /> 2. พิมพ์คำสั่ง SQL สด (SQL Console & Editor)
        </button>

        <button
          onClick={() => setActiveTab('cheatsheet')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'cheatsheet' ? '#059669' : '#f1f5f9',
            color: activeTab === 'cheatsheet' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={16} /> 3. คู่มือคำสั่ง SQL & การเปิดใน DB Browser
        </button>
      </div>

      {/* TAB 1: 13 Tables Viewer */}
      {activeTab === 'viewer' && (
        <div>
          {/* 13 Table Pills */}
          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            {tables.map(t => {
              const isSelected = selectedTable === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => handleSelectTable(t.name)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#0284c7' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontSize: '12px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{t.name}</span>
                  <span style={{
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: isSelected ? '#0369a1' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : '#64748b'
                  }}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Data Card */}
          <div style={{ ...card, padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Table size={16} color="#0284c7" />
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>ตาราง: {selectedTable}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>({tableData.length} รายการ)</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setSqlQuery(`SELECT * FROM ${selectedTable} LIMIT 20;`);
                    setActiveTab('console');
                  }}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Terminal size={12} /> เขียน SQL ตารางนี้
                </button>
                <button
                  onClick={() => loadTableData(selectedTable)}
                  style={{
                    padding: '5px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} /> รีเฟรช
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
            ) : tableData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>ไม่มีข้อมูลในตารางนี้</div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '540px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>
                      {columns.map(col => (
                        <th key={col} style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          color: '#475569',
                          borderBottom: '2px solid #cbd5e1',
                          whiteSpace: 'nowrap'
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={idx} style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}>
                        {columns.map(col => {
                          const val = row[col];
                          return (
                            <td key={col} style={{
                              padding: '10px 14px',
                              color: '#1e293b',
                              whiteSpace: 'nowrap',
                              maxWidth: '280px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {val === null || val === undefined ? (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>NULL</span>
                              ) : typeof val === 'object' ? (
                                JSON.stringify(val)
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SQL Console & Editor */}
      {activeTab === 'console' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
          {/* Main SQL Editor */}
          <div>
            <div style={{ ...card, padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} color="#0f172a" />
                  <span style={{ fontWeight: 'bold', fontSize: '15px' }}>พิมพ์คำสั่ง SQL ด้านล่าง:</span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>รองรับคำสั่ง SELECT, UPDATE, DELETE, INSERT</span>
              </div>

              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="พิมพ์คำสั่ง SQL เช่น: SELECT * FROM User; หรือ UPDATE ... หรือ DELETE ..."
                rows={6}
                style={{
                  width: '100%',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '13.5px',
                  lineHeight: '1.5',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  marginBottom: '12px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleExecuteSql()}
                    disabled={queryRunning}
                    style={{
                      padding: '9px 20px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: queryRunning ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                    }}
                  >
                    <Play size={15} className={queryRunning ? 'animate-spin' : ''} />
                    <span>{queryRunning ? 'กำลังรันคำสั่ง...' : 'รันคำสั่ง SQL (Execute Query)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSqlQuery('');
                      setQueryResult(null);
                      setQueryError('');
                    }}
                    style={{
                      padding: '9px 16px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ล้างคำสั่ง
                  </button>
                </div>

                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  กดปุ่ม "รันคำสั่ง SQL" เพื่อประมวลผลทันที
                </span>
              </div>
            </div>

            {/* Error Message */}
            {queryError && (
              <div style={{
                padding: '14px 18px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#991b1b',
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>คำสั่ง SQL ผิดพลาด:</div>
                  <div style={{ marginTop: '2px', fontFamily: 'monospace' }}>{queryError}</div>
                </div>
              </div>
            )}

            {/* Success Message for UPDATE / DELETE / INSERT */}
            {queryResult && !queryResult.isSelect && (
              <div style={{
                padding: '14px 18px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '10px',
                color: '#065f46',
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CheckCircle size={18} />
                <span style={{ fontWeight: 'bold' }}>{queryResult.message}</span>
              </div>
            )}

            {/* SELECT Result Data Grid */}
            {queryResult && queryResult.isSelect && (
              <div style={{ ...card, padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{
                  padding: '12px 18px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} color="#059669" />
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>ผลลัพธ์การค้นหา</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>({queryResult.rowCount} แถว)</span>
                  </div>
                </div>

                {queryResult.rows.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    ไม่มีข้อมูลที่ตรงกับเงื่อนไขคำสั่งนี้
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>
                          {resultColumns.map(col => (
                            <th key={col} style={{
                              padding: '8px 12px',
                              textAlign: 'left',
                              fontWeight: 'bold',
                              color: '#334155',
                              borderBottom: '2px solid #cbd5e1',
                              whiteSpace: 'nowrap'
                            }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, idx) => (
                          <tr key={idx} style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                          }}>
                            {resultColumns.map(col => {
                              const val = row[col];
                              return (
                                <td key={col} style={{
                                  padding: '8px 12px',
                                  color: '#1e293b',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {val === null || val === undefined ? (
                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>NULL</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Template Sidebar */}
          <div>
            <div style={{ ...card, padding: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={15} color="#2563eb" />
                <span>คำสั่ง SQL ตัวอย่าง (คลิกเพื่อใส่):</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sqlTemplates.map((t, idx) => {
                  const badgeColor =
                    t.type === 'SELECT' ? '#0284c7' :
                    t.type === 'UPDATE' ? '#d97706' :
                    t.type === 'DELETE' ? '#dc2626' : '#059669';

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSqlQuery(t.sql);
                        handleExecuteSql(t.sql);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 'bold',
                          color: badgeColor,
                          backgroundColor: `${badgeColor}15`,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          {t.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        {t.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Cheat Sheet & DB Browser Instructions */}
      {activeTab === 'cheatsheet' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Card: How to use DB Browser */}
          <div style={{ ...card, padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} color="#2563eb" />
              <span>วิธีใช้โปรแกรม DB Browser for SQLite</span>
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
              หากต้องการดูหรือแก้ไขไฟล์ SQLite โดยตรงผ่านเครื่องมือ GUI ของ DBA:
            </p>

            <ol style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
              <li>
                <b>เปิดโปรแกรม:</b> ดับเบิ้ลคลิกไฟล์ <code>open_database.bat</code> ในโฟลเดอร์โปรเจกต์
              </li>
              <li>
                <b>ดูข้อมูลทุกตาราง:</b> คลิกแท็บ <b>"Browse Data"</b> (เรียกดูข้อมูล) และเลือกชื่อตารางจากดรอปดาวน์
              </li>
              <li>
                <b>พิมพ์คำสั่ง SQL:</b> คลิกแท็บ <b>"Execute SQL"</b> (พิมพ์คำสั่ง SQL)
              </li>
              <li>
                <b>รันคำสั่ง:</b> พิมพ์คำสั่งแล้วกดปุ่ม <b>Play (▶)</b> หรือกดแป้น <b>F5</b>
              </li>
              <li>
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠️ ข้อควรระวังสำคัญมาก:</span> เมื่อพิมพ์ <code>UPDATE</code> หรือ <code>DELETE</code> เสร็จแล้ว ต้องกดปุ่ม <b>"Write Changes" (Ctrl + S)</b> ด้านบนเสมอ เพื่อบันทึกข้อมูลลงไฟล์ หากไม่กดไฟล์จะถูก Lock ทำให้หน้าเว็บรันไม่ได้
              </li>
            </ol>
          </div>

          {/* Card: Syntax Cheat Sheet */}
          <div style={{ ...card, padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#059669" />
              <span>โครงสร้างคำสั่ง SQL สำหรับโปรเจกต์นี้</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#0284c7', marginBottom: '4px' }}>
                  1. คำสั่งดูข้อมูล (SELECT)
                </div>
                <pre style={{ margin: 0, padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
{`-- ดูข้อมูลทั้งหมด
SELECT * FROM User;

-- ดูเฉพาะคอลัมน์ที่ต้องการ พร้อมเงื่อนไข
SELECT Trainee_ID, Status, Skill_Level 
FROM Trainee 
WHERE Skill_Level = 'Beginner';`}
                </pre>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', color: '#d97706', marginBottom: '4px' }}>
                  2. คำสั่งแก้ไขข้อมูล (UPDATE)
                </div>
                <pre style={{ margin: 0, padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
{`-- แก้ไขสถานะของเด็กฝึกงาน ID = 1
UPDATE Trainee 
SET Skill_Level = 'Intermediate' 
WHERE Trainee_ID = 1;

-- แก้ไขคะแนนการประเมิน
UPDATE Evaluation 
SET Total_Score = 3.50, Evaluation_Result = 'Pass' 
WHERE Evaluation_ID = 1;`}
                </pre>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: '4px' }}>
                  3. คำสั่งลบข้อมูล (DELETE)
                </div>
                <pre style={{ margin: 0, padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
{`-- ลบการส่งงานที่ต้องการทดสอบใหม่
DELETE FROM Submission 
WHERE Submission_ID = 11;`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

