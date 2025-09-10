'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ServiceAutocomplete({ value, onChange, onSelect, placeholder = 'Descrição do serviço', src = '/api/services', extraParams = {} }) {
  const [q, setQ] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const abortRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { setQ(value || ''); }, [value]);

  useEffect(() => {
    function onDocClick(e){ if(!wrapRef.current) return; if(!wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    const query = q.trim();
    const controller = new AbortController();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = controller;
    const t = setTimeout(async () => {
      try {
        const url = new URL(src, window.location.origin);
        if (query) url.searchParams.set('q', query);
        if (extraParams && typeof extraParams === 'object') {
          for (const [k, v] of Object.entries(extraParams)) {
            if (v != null && String(v).trim() !== '') url.searchParams.set(k, String(v));
          }
        }
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error('bad status');
        const json = await res.json();
        setItems(Array.isArray(json.items) ? json.items : []);
      } catch (_) {
        // Fallback to local list when API is unavailable (static export/offline)
        try {
          const local = (extraParams && Array.isArray(extraParams._fallback)) ? extraParams._fallback : [];
          const norm = (s) => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
          const qn = norm(query);
          const brand = extraParams && extraParams.brand ? norm(extraParams.brand) : '';
          let filtered = local;
          if (brand) {
            filtered = filtered.filter(it => {
              const b = norm(it.brand || '');
              const n = norm(it.name || '');
              if (b) return b === brand;
              return brand && n.startsWith(brand + ' ');
            });
          }
          if (qn) filtered = filtered.filter(it => norm(it.name).includes(qn));
          setItems(filtered.slice(0, 20));
        } catch(_e) { setItems([]); }
      }
    }, 200);
    return () => { clearTimeout(t); controller.abort(); };
  }, [q, src, JSON.stringify(extraParams)]);

  function pick(item){
    setOpen(false);
    onChange?.(item.name);
    onSelect?.(item);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        className="input"
        placeholder={placeholder}
        value={q}
        onChange={(e)=>{ setQ(e.target.value); onChange?.(e.target.value); setOpen(true); }}
        onFocus={async ()=> {
          setOpen(true);
          // If nothing loaded yet, pre-load defaults (top items) so it works even with a prefilled value
          if (items.length === 0) {
            try {
              const controller = new AbortController();
              if (abortRef.current) abortRef.current.abort();
              abortRef.current = controller;
              const url = new URL(src, window.location.origin);
              if (extraParams && typeof extraParams === 'object') {
                for (const [k, v] of Object.entries(extraParams)) {
                  if (v != null && String(v).trim() !== '') url.searchParams.set(k, String(v));
                }
              }
              const res = await fetch(url.toString(), { signal: controller.signal });
              if (res.ok) {
                const json = await res.json();
                setItems(Array.isArray(json.items) ? json.items : []);
              } else {
                // fallback load
                const local = (extraParams && Array.isArray(extraParams._fallback)) ? extraParams._fallback : [];
                setItems(Array.isArray(local) ? local.slice(0,20) : []);
              }
            } catch (_) {
              const local = (extraParams && Array.isArray(extraParams._fallback)) ? extraParams._fallback : [];
              setItems(Array.isArray(local) ? local.slice(0,20) : []);
            }
          }
        }}
        autoComplete="off"
      />
      {open && items.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-soft max-h-64 overflow-auto">
          {items.map((it, idx)=> (
            <button key={idx} type="button" onClick={()=>pick(it)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50">
              <span className="truncate pr-2">{it.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// no currency display; suggestions only show description
