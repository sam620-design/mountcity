import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { apiPlots } from '../../config/api';
import { Lsvg, HitechSvg, VatikaSvg } from '../indeximages';

const PROJECT_NAMES = { 1: 'Nutan Villa', 2: 'Hi-Tech City', 3: 'Nutan Vatika' };
const PROJECT_MAP   = { 1: Lsvg, 2: HitechSvg, 3: VatikaSvg };

export default function OwnerProjectMapsTab() {
  const [projectId, setProjectId] = useState(1);
  const [plots, setPlots]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [tooltip, setTooltip]     = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultModal, setSearchResultModal] = useState(null); // null | { found: false, query: string } | { found: true, plot: object }

  const wrapRef  = useRef(null); 
  const [wrapW, setWrapW] = useState(0);
  const [wrapH, setWrapH] = useState(0);

  const fetchPlots = async () => {
    setLoading(true);
    try { const r = await axios.get(`${apiPlots}/${projectId}`); setPlots(r.data); }
    catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { 
    fetchPlots(); 
    setSearchQuery(''); 
  }, [projectId]);

  const measure = () => {
    if (!wrapRef.current) return;
    const { width, height } = wrapRef.current.getBoundingClientRect();
    if (width > 0) { setWrapW(width); setWrapH(height); }
  };
  useEffect(() => { const t = setTimeout(measure, 200); return () => clearTimeout(t); }, [projectId]);
  useEffect(() => { window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }, []);

  // Search trigger function
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const match = plots.find(p => 
      p.plotId?.toLowerCase() === q || // exact match plot id first
      p.plotId?.toLowerCase().includes(q) || 
      p.customer?.toLowerCase().includes(q)
    );
    if (match) {
      setSearchResultModal({ found: true, plot: match });
    } else {
      setSearchResultModal({ found: false, query: searchQuery.trim() });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const rectStyle = (p, highlight = false) => {
    if (!wrapW) return { display: 'none' };
    const xR = wrapW / 1000, yR = wrapH / 1200;
    
    // No dynamic search highlighting anymore, just normal rendering
    
    let border = p.customer ? '1.5px solid #dc2626' : '1.5px solid #4f46e5';
    let bg = p.customer ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)';
    let zIndex = 4;

    if (highlight) {
      border = '2px solid #ef4444';
      bg = 'rgba(239,68,68,0.35)';
      zIndex = 8;
    }

    return {
      position: 'absolute',
      top:    p.y * yR + 'px',
      left:   p.x * xR + 'px',
      width:  p.width  * xR + 'px',
      height: p.height * yR + 'px',
      border,
      background: bg,
      borderRadius: '2px',
      cursor: 'pointer',
      zIndex,
      boxSizing: 'border-box',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      transition: 'all 0.2s ease-in-out'
    };
  };

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Topbar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:'1.3rem', fontWeight:900, color:'#1e293b' }}>🗺️ Project Maps Overview</h2>
          <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#64748b' }}>
            View project layouts, plot availability, and search for specific plots or customers.
          </p>
        </div>
        
        <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search Plot ID or Customer..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ 
                padding: '8px 12px 8px 32px', 
                borderRadius: '8px 0 0 8px', 
                border: '1.5px solid #cbd5e1', 
                fontSize: '14px',
                outline: 'none',
                width: '220px',
                color: '#0f172a',
                fontWeight: 600
              }}
            />
            <button 
              onClick={handleSearch}
              style={{
                padding: '8.5px 16px',
                borderRadius: '0 8px 8px 0',
                border: '1.5px solid #4f46e5',
                borderLeft: 'none',
                background: '#4f46e5',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </div>
          <select value={projectId} onChange={e => setProjectId(Number(e.target.value))}
            style={{ border:'2px solid #a5b4fc', borderRadius:'8px', padding:'8px 12px', fontWeight:700, color:'#4f46e5', outline:'none', background:'white', cursor:'pointer', fontSize:'14px' }}>
            {Object.entries(PROJECT_NAMES).map(([id, name]) => (
              <option key={id} value={Number(id)}>Project {id} – {name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary - Only Sold Plots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', maxWidth: '300px' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sold Plots</p>
          <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#b91c1c' }}>{loading ? '...' : plots.filter(p => p.customer).length}</p>
        </div>
      </div>

      {/* Map */}
      <div style={{ border:'2px solid #e2e8f0', borderRadius:'16px', overflow:'hidden', background:'white', marginBottom:'1.5rem', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ padding:'10px 16px', background: '#f8fafc', borderBottom:'1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin:0, fontSize:'13px', fontWeight:700, color: '#334155' }}>
            🖱️ Hover over any plot to see details.
          </p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'rgba(99,102,241,0.2)', border: '1px solid #4f46e5', borderRadius: '2px' }}></div> Available</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'rgba(239,68,68,0.2)', border: '1px solid #dc2626', borderRadius: '2px' }}></div> Sold</span>
          </div>
        </div>

        <div
          ref={wrapRef}
          style={{ position:'relative', lineHeight:0, userSelect:'none', cursor: 'default' }}
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

      {/* Search Result Modal */}
      {searchResultModal && ReactDOM.createPortal(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={e => { if (e.target === e.currentTarget) setSearchResultModal(null); }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'28px 32px', maxWidth:'400px', width:'100%', boxShadow:'0 20px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button 
              onClick={() => setSearchResultModal(null)}
              style={{ position:'absolute', top:'16px', right:'16px', background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#94a3b8', lineHeight:1 }}
            >
              ×
            </button>
            
            {searchResultModal.found ? (
              <div>
                <div style={{ fontSize:'40px', marginBottom:'12px', textAlign: 'center' }}>🎯</div>
                <h3 style={{ margin:'0 0 16px', color:'#0f172a', fontWeight:900, fontSize:'22px', textAlign: 'center' }}>Plot Found!</h3>
                
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Plot ID</span>
                    <span style={{ color: '#1e293b', fontWeight: 900, fontSize: '15px' }}>{searchResultModal.plot.plotId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Status</span>
                    <span style={{ color: searchResultModal.plot.customer ? '#dc2626' : '#16a34a', fontWeight: 800, fontSize: '14px' }}>
                      {searchResultModal.plot.customer ? 'Sold / Booked' : 'Available'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Customer</span>
                    <span style={{ color: searchResultModal.plot.customer ? '#1e293b' : '#94a3b8', fontWeight: 800, fontSize: '14px' }}>
                      {searchResultModal.plot.customer || '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>🤷</div>
                <h3 style={{ margin:'0 0 8px', color:'#0f172a', fontWeight:900, fontSize: '20px' }}>Not Found</h3>
                <p style={{ margin:'0', color:'#64748b', fontSize:'15px' }}>
                  No plot or customer matched <strong style={{ color: '#1e293b' }}>"{searchResultModal.query}"</strong>.
                </p>
              </div>
            )}
            
            <button 
              onClick={() => setSearchResultModal(null)}
              style={{ width: '100%', padding:'12px', marginTop: '24px', borderRadius:'10px', border:'none', background:'#4f46e5', color:'white', fontWeight:800, cursor:'pointer', fontSize:'14px' }}>
              Close
            </button>
          </div>
        </div>
      , document.body)}

    </div>
  );
}
