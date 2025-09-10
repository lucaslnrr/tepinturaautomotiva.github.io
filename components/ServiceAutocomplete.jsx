'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ServiceAutocomplete({ value, onChange, onSelect, placeholder = 'Descrição do serviço' }) {
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
    if (!query) { setItems([]); return; }
    const controller = new AbortController();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = controller;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/services?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!res.ok) throw new Error('bad status');
        const json = await res.json();
        setItems(Array.isArray(json.items) ? json.items : []);
      } catch (_) { /* ignore */ }
    }, 200);
    return () => { clearTimeout(t); controller.abort(); };
  }, [q]);

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
        onFocus={()=> setOpen(true)}
        autoComplete="off"
      />
      {open && items.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-soft max-h-64 overflow-auto">
          {items.map((it, idx)=> (
            <button key={idx} type="button" onClick={()=>pick(it)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between">
              <span className="truncate pr-2">{it.name}</span>
              {typeof it.price === 'number' && (
                <span className="text-xs text-gray-600 whitespace-nowrap">{brl((it.price||0)/100)}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function brl(n){
  return new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(Number(n||0));
}

