'use client';
import { useEffect, useRef } from 'react';
import ServiceAutocomplete from '@/components/ServiceAutocomplete';

export default function ItemRow({ index, item, onChange, onRemove }){
  const descRef = useRef(null);
  useEffect(() => {
    if (index === 0 && descRef.current) {
      descRef.current.focus();
    }
  }, [index]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_40px] gap-2 items-center">
      <ServiceAutocomplete
        value={item.desc}
        onChange={(val)=> onChange(index, { ...item, desc: val })}
        onSelect={(svc)=> {
          // If service has a default price, auto-fill when unit is empty
          const priceStr = typeof svc.price === 'number' ? String((svc.price/100).toFixed(2)).replace('.',',') : item.unit;
          onChange(index, { ...item, desc: svc.name, unit: item.unit || priceStr });
        }}
        placeholder="Descrição (ex.: Pintura para-choque dianteiro)"
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
