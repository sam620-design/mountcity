import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { apiPlots, apiDev } from '../../config/api';
import { Lsvg, HitechSvg, VatikaSvg } from '../indeximages';

const PROJECT_NAMES = { 1: 'Nutan Villa', 2: 'Hi-Tech City', 3: 'Nutan Vatika' };
const PROJECT_MAP   = { 1: Lsvg, 2: HitechSvg, 3: VatikaSvg };

function getToken() {
  return sessionStorage.getItem('devToken') || localStorage.getItem('devToken')
      || sessionStorage.getItem('ownerToken') || localStorage.getItem('ownerToken') || '';
}

export default function ProjectMapsTab() {
  const [projectId, setProjectId] = useState(1);
  const [plots, setPlots]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [modal, setModal]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [success, setSuccess]     = useState('');
  const [tooltip, setTooltip]     = useState(null);

  // Two-click drawing state
  const [drawStep, setDrawStep]   = useState(0); // 0=idle, 1=waiting for 2nd click
  const [corner1, setCorner1]     = useState(null); // {x,y} in original coords
  const [previewRect, setPreviewRect] = useState(null);

  const wrapRef  = useRef(null); // the clickable div
  const [wrapW, setWrapW] = useState(0);
  const [wrapH, setWrapH] = useState(0);

  const fetchPlots = async () => {
    setLoading(true);
    try { const r = await axios.get(`${apiPlots}/${projectId}`); setPlots(r.data); }
    catch(e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchPlots(); setDrawStep(0); setCorner1(null); setPreviewRect(null); }, [projectId]);

  const measure = () => {
    if (!wrapRef.current) return;
    const { width, height } = wrapRef.current.getBoundingClientRect();
    if (width > 0) { setWrapW(width); setWrapH(height); }
  };
  useEffect(() => { const t = setTimeout(measure, 200); return () => clearTimeout(t); }, [projectId]);
  useEffect(() => { window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }, []);

  // Convert screen px → original coords (1000×1200 space)
  const toOrig = (sx, sy, rect) => ({
    x: Math.round(sx / (rect.width  / 1000)),
    y: Math.round(sy / (rect.height / 1200)),
  });
  // Original coords → screen px
  const toScr = (ox, oy) => ({ x: ox * (wrapW / 1000), y: oy * (wrapH / 1200) });

  const cancelDraw = () => { setDrawStep(0); setCorner1(null); setPreviewRect(null); };

  const handleMapClick = (e) => {
    if (modal) return; // modal is open — don't start drawing
    e.stopPropagation();
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pt   = toOrig(e.clientX - rect.left, e.clientY - rect.top, rect);

    if (drawStep === 0) {
      // First click — record top-left corner
      setCorner1(pt);
      setDrawStep(1);
      setPreviewRect({ x: pt.x, y: pt.y, width: 0, height: 0 });
    } else {
      // Second click — calculate rect and open modal
      const x = Math.min(corner1.x, pt.x);
      const y = Math.min(corner1.y, pt.y);
      const w = Math.abs(pt.x - corner1.x);
      const h = Math.abs(pt.y - corner1.y);
      cancelDraw();
      openModal('add', { plotId: '', customer: '', x, y, width: Math.max(w, 5), height: Math.max(h, 5) });
    }
  };

  const handleMapMouseMove = (e) => {
    if (drawStep !== 1 || !corner1 || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pt   = toOrig(e.clientX - rect.left, e.clientY - rect.top, rect);
    const x = Math.min(corner1.x, pt.x);
    const y = Math.min(corner1.y, pt.y);
    const w = Math.abs(pt.x - corner1.x);
    const h = Math.abs(pt.y - corner1.y);
    setPreviewRect({ x, y, width: w, height: h });
  };

  const openModal = (mode, data) => {
    cancelDraw();
    setModal({ mode, data: { ...data }, err: '' });
  };
  const closeModal = () => setModal(null);
  const updField = (k, v) => setModal(m => ({ ...m, data: { ...m.data, [k]: v }, err: '' }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!modal) return;
    const { plotId, customer, x, y, width, height } = modal.data;
    if (!plotId.trim()) { setModal(m => ({ ...m, err: 'Plot ID is required.' })); return; }
    setSaving(true);
    try {
      const cfg = { headers: { Authorization: `Bearer ${getToken()}` } };
      if (modal.mode === 'edit' && modal.data._id) {
        await axios.put(`${apiDev}/plot/${modal.data._id}`, { plotId, customer, x, y, width, height, projectId }, cfg);
      } else {
        await axios.post(`${apiDev}/plot`, { plotId, customer, x, y, width, height, projectId }, cfg);
      }
      setSuccess(modal.mode === 'edit' ? 'Plot updated!' : 'Plot saved!');
      setTimeout(() => setSuccess(''), 3000);
      closeModal();
      fetchPlots();
    } catch(err) {
      const msg = err?.response?.data?.message || err.message || 'Unknown error';
      setModal(m => ({ ...m, err: `Save failed: ${msg}` }));
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${apiDev}/plot/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setConfirmDelete(null);
      fetchPlots();
    } catch(e) {
      setConfirmDelete(null);
      alert('Delete failed: ' + (e?.response?.data?.message || e.message));
    }
  };

  const rectStyle = (p, highlight = false) => {
    if (!wrapW) return { display: 'none' };
    const xR = wrapW / 1000, yR = wrapH / 1200;
    return {
      position: 'absolute',
      top:    p.y * yR + 'px',
      left:   p.x * xR + 'px',
      width:  p.width  * xR + 'px',
      height: p.height * yR + 'px',
      border: highlight ? '2px solid #ef4444' : (p.customer ? '1.5px solid #dc2626' : '1.5px solid #4f46e5'),
      background: highlight ? 'rgba(239,68,68,0.35)' : (p.customer ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)'),
      borderRadius: '2px',
      cursor: 'pointer',
      zIndex: 4,
      boxSizing: 'border-box',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const F = modal?.data || {};

  const inputStyle = {
    width: '100%', border: '1.5px solid #94a3b8', borderRadius: '8px',
    padding: '9px 12px', outline: 'none', fontSize: '14px',
    boxSizing: 'border-box', background: '#fff', color: '#0f172a',
    fontWeight: 600,
  };
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 800,
    color: '#334155', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em',
  };

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Topbar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:'1.3rem', fontWeight:900, color:'#1e293b' }}>🗺️ Project Map — Plot Manager</h2>
          <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#64748b' }}>
            {drawStep === 0 ? 'Click once on the map to set the top-left corner of a new plot.' : '✅ Corner 1 set — now click to mark the bottom-right corner.'}
          </p>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
          <select value={projectId} onChange={e => setProjectId(Number(e.target.value))}
            style={{ border:'2px solid #a5b4fc', borderRadius:'8px', padding:'7px 12px', fontWeight:700, color:'#4f46e5', outline:'none', background:'white', cursor:'pointer', fontSize:'14px' }}>
            {Object.entries(PROJECT_NAMES).map(([id, name]) => (
              <option key={id} value={Number(id)}>Project {id} – {name}</option>
            ))}
          </select>
          {drawStep === 1
            ? <button onClick={cancelDraw} style={{ background:'#ef4444', color:'white', padding:'8px 16px', borderRadius:'8px', fontWeight:700, border:'none', cursor:'pointer', fontSize:'14px' }}>✕ Cancel Draw</button>
            : <button onClick={() => setDrawStep(0)} style={{ background:'#4f46e5', color:'white', padding:'8px 16px', borderRadius:'8px', fontWeight:700, border:'none', cursor:'pointer', fontSize:'14px' }}>➕ Draw New Plot</button>
          }
        </div>
      </div>

      {success && (
        <div style={{ background:'#dcfce7', border:'1px solid #86efac', color:'#166534', padding:'10px 16px', borderRadius:'10px', marginBottom:'12px', fontWeight:700, fontSize:'14px' }}>
          ✅ {success}
        </div>
      )}

      {/* Map */}
      <div style={{ border:'2px solid #e2e8f0', borderRadius:'16px', overflow:'hidden', background:'white', marginBottom:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'8px 16px', background: drawStep === 1 ? '#fef9c3' : '#eff6ff', borderBottom:'1px solid #e2e8f0' }}>
          <p style={{ margin:0, fontSize:'12px', fontWeight:700, color: drawStep === 1 ? '#92400e' : '#1d4ed8' }}>
            {drawStep === 1 ? '📍 Click the BOTTOM-RIGHT corner of the plot to complete drawing.' : '🖱️ Click once to start drawing a plot rectangle on the map.'}
          </p>
        </div>

        <div
          ref={wrapRef}
          style={{ position:'relative', lineHeight:0, cursor: drawStep === 1 ? 'crosshair' : 'default', userSelect:'none' }}
          onClick={handleMapClick}
          onMouseMove={handleMapMouseMove}
        >
          <img
            src={PROJECT_MAP[projectId] || Lsvg}
            alt={`Project ${projectId} Map`}
            onLoad={measure}
            style={{ width:'100%', height:'auto', display:'block', pointerEvents:'none', userSelect:'none' }}
          />

          {/* Existing plots */}
          {wrapW > 0 && plots.map(p => (
            <div
              key={p._id}
              style={rectStyle(p, tooltip?._id === p._id)}
              onMouseEnter={() => setTooltip(p)}
              onMouseLeave={() => setTooltip(null)}
              onClick={e => { e.stopPropagation(); if (drawStep === 0) openModal('edit', { ...p }); }}
            >              
              {/* Only show label for AVAILABLE plots */}
              {!p.customer && (
                <span style={{
                  fontSize: Math.max(8, Math.min(13, (p.width * wrapW/1000) / 3)) + 'px',
                  fontWeight: 900, color: '#312e81',
                  textShadow: '0 0 3px white', pointerEvents:'none', lineHeight:1.1, textAlign:'center',
                }}>
                  {p.plotId}
                </span>
              )}
            </div>
          ))}

          {/* Preview rect while drawing */}
          {drawStep === 1 && previewRect && wrapW > 0 && (() => {
            const xR = wrapW/1000, yR = wrapH/1200;
            return (
              <div style={{
                position:'absolute',
                top:    previewRect.y * yR + 'px',
                left:   previewRect.x * xR + 'px',
                width:  previewRect.width  * xR + 'px',
                height: previewRect.height * yR + 'px',
                border: '2px dashed #f59e0b',
                background: 'rgba(245,158,11,0.15)',
                borderRadius:'2px',
                zIndex: 10, pointerEvents:'none',
              }} />
            );
          })()}

          {/* Corner 1 dot */}
          {drawStep === 1 && corner1 && wrapW > 0 && (() => {
            const s = { x: corner1.x * (wrapW/1000), y: corner1.y * (wrapH/1200) };
            return (
              <div style={{
                position:'absolute', top: s.y - 6 + 'px', left: s.x - 6 + 'px',
                width:'12px', height:'12px', borderRadius:'50%',
                background:'#f59e0b', border:'2px solid white',
                boxShadow:'0 1px 6px rgba(0,0,0,0.4)', zIndex:12, pointerEvents:'none',
              }} />
            );
          })()}

          {/* Tooltip */}
          {tooltip && wrapW > 0 && (() => {
            const s = { x: tooltip.x * (wrapW/1000), y: tooltip.y * (wrapH/1200) };
            const tipX = Math.min(s.x, wrapW - 160);
            const tipY = s.y > 80 ? s.y - 80 : s.y + (tooltip.height * wrapH/1200) + 8;
            return (
              <div style={{
                position:'absolute',
                top: tipY + 'px',
                left: tipX + 'px',
                background:'white',
                border:'1.5px solid #e2e8f0',
                padding:'8px 12px',
                borderRadius:'10px',
                boxShadow:'0 4px 20px rgba(0,0,0,0.18)',
                zIndex:20,
                pointerEvents:'none',
                minWidth:'140px',
                maxWidth:'180px',
              }}>
                <p style={{ margin:'0 0 4px 0', fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', lineHeight:'1.2' }}>Plot {tooltip.plotId}</p>
                <p style={{ margin:0, fontSize:'13px', fontWeight:900, lineHeight:'1.3', color: tooltip.customer ? '#1e293b' : '#16a34a' }}>
                  {tooltip.customer || '✓ Available'}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Plots Table */}
      <div style={{ background:'white', borderRadius:'16px', border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, fontWeight:900, fontSize:'12px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Plots ({plots.length})
          </h3>
          {loading && <span style={{ fontSize:'12px', color:'#6d28d9', fontWeight:700 }}>Loading…</span>}
        </div>
        <div style={{ overflowX:'auto', maxHeight:'320px', overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
            <thead style={{ background:'#f8fafc', position:'sticky', top:0 }}>
              <tr>
                {['Plot ID','Customer','X · Y · W · H','Actions'].map(h => (
                  <th key={h} style={{ padding:'9px 16px', textAlign: h==='Actions'?'right':'left', fontWeight:900, fontSize:'11px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plots.map(p => (
                <tr key={p._id} style={{ borderTop:'1px solid #f1f5f9' }}
                  onMouseEnter={() => setTooltip(p)} onMouseLeave={() => setTooltip(null)}>
                  <td style={{ padding:'9px 16px', fontWeight:800, color:'#1e293b' }}>{p.plotId}</td>
                  <td style={{ padding:'9px 16px' }}>
                    {p.customer
                      ? <span style={{ background:'#fee2e2', color:'#991b1b', padding:'2px 8px', borderRadius:'12px', fontWeight:700, fontSize:'12px' }}>{p.customer}</span>
                      : <span style={{ color:'#16a34a', fontStyle:'italic', fontSize:'13px' }}>Available</span>}
                  </td>
                  <td style={{ padding:'9px 16px', fontFamily:'monospace', fontSize:'12px', color:'#64748b' }}>
                    {p.x}·{p.y}·{p.width}·{p.height}
                  </td>
                  <td style={{ padding:'9px 16px', textAlign:'right' }}>
                    <button onClick={() => openModal('edit', { ...p })} style={{ color:'#4f46e5', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontSize:'13px', marginRight:'10px' }}>Edit</button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(p._id); }} style={{ color:'#ef4444', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontSize:'13px' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {!loading && plots.length === 0 && (
                <tr><td colSpan={4} style={{ padding:'40px', textAlign:'center', color:'#94a3b8', fontStyle:'italic', fontSize:'14px' }}>
                  No plots yet — use the map above to draw the first one!
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'28px 32px', maxWidth:'360px', width:'100%', boxShadow:'0 20px 50px rgba(0,0,0,0.3)', textAlign:'center' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🗑️</div>
            <h3 style={{ margin:'0 0 8px', color:'#0f172a', fontWeight:900 }}>Delete this plot?</h3>
            <p style={{ margin:'0 0 24px', color:'#64748b', fontSize:'14px' }}>This action cannot be undone.</p>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding:'10px 24px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#334155', fontWeight:700, cursor:'pointer', fontSize:'14px' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{ padding:'10px 24px', borderRadius:'10px', border:'none', background:'#ef4444', color:'white', fontWeight:800, cursor:'pointer', fontSize:'14px' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background:'white', borderRadius:'20px', width:'100%', maxWidth:'460px', boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>
            <div style={{ background: modal.mode==='edit' ? '#f1f5f9' : '#eff6ff', padding:'16px 24px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0, fontWeight:900, fontSize:'1rem', color:'#0f172a' }}>
                {modal.mode==='edit' ? '✏️ Edit Plot' : '➕ Add New Plot'}
              </h3>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <span style={{ fontSize:'12px', fontWeight:700, color:'#4f46e5', background:'#e0e7ff', padding:'3px 10px', borderRadius:'20px' }}>
                  X:{F.x} Y:{F.y} W:{F.width} H:{F.height}
                </span>
                <button onClick={closeModal} style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#64748b', lineHeight:1, padding:0 }}>×</button>
              </div>
            </div>

            {modal.err && (
              <div style={{ background:'#fef2f2', borderBottom:'1px solid #fecaca', color:'#dc2626', padding:'10px 24px', fontSize:'13px', fontWeight:700 }}>
                ⛔ {modal.err}
              </div>
            )}

            <form onSubmit={handleSave} style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelStyle}>Plot ID *</label>
                <input autoFocus required type="text" value={F.plotId}
                  onChange={e => updField('plotId', e.target.value)}
                  placeholder="e.g. 32" style={inputStyle} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelStyle}>Customer Name (blank = Available)</label>
                <input required type="text" value={F.customer}
                  onChange={e => updField('customer', e.target.value)}
                  placeholder="e.g. Ramesh Kumar" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>X Coord</label>
                <input type="number" required value={F.x} onChange={e => updField('x', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Y Coord</label>
                <input type="number" required value={F.y} onChange={e => updField('y', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Width</label>
                <input type="number" required value={F.width} onChange={e => updField('width', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Height</label>
                <input type="number" required value={F.height} onChange={e => updField('height', Number(e.target.value))} style={inputStyle} />
              </div>
              <div style={{ gridColumn:'1/-1', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'10px 14px', fontSize:'12px', color:'#64748b' }}>
                💡 <strong>Tip:</strong> Draw the plot by clicking two corners on the map. Customer name is required to mark a plot as sold.
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', gap:'10px', paddingTop:'4px' }}>
                <button type="submit" disabled={saving}
                  style={{ flex:1, background: saving ? '#6ee7b7' : '#10b981', color:'white', fontWeight:800, padding:'11px', borderRadius:'10px', border:'none', cursor: saving?'not-allowed':'pointer', fontSize:'14px' }}>
                  {saving ? '⏳ Saving…' : '💾 Save Plot'}
                </button>
                <button type="button" onClick={closeModal}
                  style={{ flex:1, background:'#f1f5f9', color:'#334155', fontWeight:700, padding:'11px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'14px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
