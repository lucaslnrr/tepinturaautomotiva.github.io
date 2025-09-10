'use client';
import { useEffect, useRef } from 'react';

export default function ItemRow({ index, item, onChange, onRemove }){
  const descRef = useRef(null);
  useEffect(() => {
    if (index === 0 && descRef.current) {
      descRef.current.focus();
    }
  }, [index]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_40px] gap-2 items-center">
      <input
        ref={descRef}
        className="input"
        placeholder="Descrição (ex.: Pintura para-choque dianteiro)"
        value={item.desc}
        onChange={(e) => onChange(index, { ...item, desc: e.target.value })}
      />
      <input
        className="input text-right"
        inputMode="decimal"
        placeholder="Valor (R$)"
        value={item.unit}
        onChange={(e) =>
          onChange(index, {
            ...item,
            unit: e.target.value.replace(/[^0-9.,]/g, ''),
          })
        }
      />
      <button
        className="btn btn-outline"
        aria-label="Remover item"
        onClick={() => onRemove(index)}
      >
        -
      </button>
    </div>
  );
}

