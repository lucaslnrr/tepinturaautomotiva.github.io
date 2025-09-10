'use client';
import { useEffect, useMemo, useReducer } from 'react';
import ItemRow from '@/components/ItemRow';
import InstallPromptButton from '@/components/InstallPromptButton';
import { buildPdf } from '@/lib/pdf';

const initialState = {
  company: { contacts: 'Av. Exemplo, 123 • Franca-SP • (16) 99999-0000' },
  meta: {
    number: genNumber(),
    date: new Date().toLocaleDateString('pt-BR'),
    validade: 7,
    seller: 'Atendente',
    pagamento: 'PIX / Cartão / À vista',
    prazo: '3 a 7 dias úteis',
    obs: 'Garantia de pintura com verniz automotivo. Peças sujeitas a avaliação técnica.'
  },
  client: { name:'', whatsapp:'', email:'' },
  vehicle: { marca:'', modelo:'', placa:'', cor:'', ano:'', chassi:'', km:'' },
  items: [
    { desc:'Pintura de para-choque', unit:'350' }
  ],
  totals: { discount: 0, addition: 0 }
};

function reducer(state, action){
  switch(action.type){
    case 'SET': return { ...state, ...action.payload };
    case 'FIELD': return { ...state, [action.path[0]]: { ...state[action.path[0]], [action.path[1]]: action.value } };
    case 'ITEM_SET':
      const items = state.items.slice();
      items[action.index] = action.item;
      return { ...state, items };
    case 'ITEM_ADD': return { ...state, items:[...state.items, { desc:'', unit:'' }] };
    case 'ITEM_REMOVE':
      const arr = state.items.slice(); arr.splice(action.index,1); return { ...state, items: arr.length?arr:[{desc:'',unit:''}] };
    case 'RESET': return initialState;
    default: return state;
  }
}

export default function Page(){
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(()=>{ try{ localStorage.setItem('orc_te', JSON.stringify(state)); }catch(e){} },[state]);
  useEffect(()=>{ try{ const s = JSON.parse(localStorage.getItem('orc_te')); if(s) dispatch({type:'SET', payload:s}); }catch(e){} },[]);

  const totals = useMemo(()=>{
    const subtotal = state.items.reduce((acc,it)=> acc + parseBR(it.unit||0), 0);
    const discount = parseBR(state.totals.discount||0);
    const addition  = parseBR(state.totals.addition||0);
    const total = Math.max(0, subtotal - discount + addition);
    return { subtotal, discount, addition, total };
  },[state.items, state.totals]);

  async function onGenerate(){
    const blob = await buildPdf(state);
    const file = new File([blob], `orcamento-TEPintura-${state.meta.number}.pdf`, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files:[file] })) {
      try{ await navigator.share({ title:'Orçamento TE Pintura', text:'Segue orçamento.', files:[file] }); return; }catch(e){}
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
    alert('PDF baixado. Anexe manualmente no WhatsApp.');
  }

  function onClear(){
    if(confirm('Limpar formulário?')){
      dispatch({type:'RESET'});
      try{ localStorage.removeItem('orc_te'); }catch(e){}
    }
  }

  return (
    <div className="container py-3">
      <header className="flex flex-wrap items-center gap-3 my-2">
        <img src="/logo_te.svg" alt="TE Pintura" className="h-10 w-auto"/>
        <div>
          <div className="text-lg font-bold">Talão de Orçamento</div>
          <div className="text-xs text-gray-500">TE Pintura Automotiva</div>
        </div>
        <div className="ml-auto text-right w-full sm:w-auto">
          <div className="text-xs text-gray-500">Nº</div>
          <div className="text-lg font-mono">{state.meta.number}</div>
        </div>
      </header>

      <main className="grid gap-3">
        <section className="card p-3 grid gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="label">Cliente</div>
              <input className="input" placeholder="Nome completo"
                     value={state.client.name}
                     onChange={e=>dispatch({type:'FIELD', path:['client','name'], value:e.target.value})}/>
            </div>
            <div>
              <div className="label">WhatsApp</div>
              <input className="input" placeholder="(16) 9 9999-0000" inputMode="tel"
                     value={state.client.whatsapp}
                     onChange={e=>dispatch({type:'FIELD', path:['client','whatsapp'], value:e.target.value})}/>
            </div>
            <div>
              <div className="label">E-mail</div>
              <input className="input" placeholder="cliente@email.com"
                     value={state.client.email}
                     onChange={e=>dispatch({type:'FIELD', path:['client','email'], value:e.target.value})}/>
            </div>
            <div>
              <div className="label">Atendente</div>
              <input className="input" placeholder="Seu nome"
                     value={state.meta.seller}
                     onChange={e=>dispatch({type:'FIELD', path:['meta','seller'], value:e.target.value})}/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="label">Data</div>
              <input className="input" value={state.meta.date}
                     onChange={e=>dispatch({type:'FIELD', path:['meta','date'], value:e.target.value})}/>
            </div>
            <div>
              <div className="label">Validade (dias)</div>
              <input className="input" inputMode="numeric" value={state.meta.validade}
                     onChange={e=>dispatch({type:'FIELD', path:['meta','validade'], value:e.target.value})}/>
            </div>
          </div>
        </section>

        <section className="card p-3 grid gap-3">
          <div className="text-sm font-semibold text-gray-600">Dados do veículo</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="input" placeholder="Marca" value={state.vehicle.marca} onChange={e=>dispatch({type:'FIELD', path:['vehicle','marca'], value:e.target.value})}/>
            <input className="input" placeholder="Modelo" value={state.vehicle.modelo} onChange={e=>dispatch({type:'FIELD', path:['vehicle','modelo'], value:e.target.value})}/>
            <input className="input" placeholder="Placa" value={state.vehicle.placa} onChange={e=>dispatch({type:'FIELD', path:['vehicle','placa'], value:e.target.value})}/>
            <input className="input" placeholder="Cor" value={state.vehicle.cor} onChange={e=>dispatch({type:'FIELD', path:['vehicle','cor'], value:e.target.value})}/>
            <input className="input" placeholder="Ano" inputMode="numeric" value={state.vehicle.ano} onChange={e=>dispatch({type:'FIELD', path:['vehicle','ano'], value:e.target.value})}/>
            <input className="input" placeholder="Chassi" value={state.vehicle.chassi} onChange={e=>dispatch({type:'FIELD', path:['vehicle','chassi'], value:e.target.value})}/>
            <input className="input" placeholder="KM" inputMode="numeric" value={state.vehicle.km} onChange={e=>dispatch({type:'FIELD', path:['vehicle','km'], value:e.target.value})}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="input" placeholder="Condição de pagamento (ex.: PIX / Cartão / 3x)" value={state.meta.pagamento} onChange={e=>dispatch({type:'FIELD', path:['meta','pagamento'], value:e.target.value})}/>
            <input className="input" placeholder="Prazo de execução" value={state.meta.prazo} onChange={e=>dispatch({type:'FIELD', path:['meta','prazo'], value:e.target.value})}/>
          </div>
        </section>

        <section className="card p-3 grid gap-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-600">Itens do orçamento</div>
            <button className="btn btn-outline" onClick={()=>dispatch({type:'ITEM_ADD'})}>+ Item</button>
          </div>
          <div className="grid gap-2">
            {state.items.map((item, i)=> (
              <ItemRow key={i} index={i}
                       item={item}
                       onChange={(index, it)=>dispatch({type:'ITEM_SET', index, item:it})}
                       onRemove={(index)=>dispatch({type:'ITEM_REMOVE', index})} />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t">
            <div>
              <div className="label">Desconto (R$)</div>
              <input className="input text-right" inputMode="decimal"
                     value={state.totals.discount}
                     onChange={e=>dispatch({type:'SET', payload:{ totals:{...state.totals, discount:e.target.value} }})} />
            </div>
            <div>
              <div className="label">Acréscimo (R$)</div>
              <input className="input text-right" inputMode="decimal"
                     value={state.totals.addition}
                     onChange={e=>dispatch({type:'SET', payload:{ totals:{...state.totals, addition:e.target.value} }})} />
            </div>
            <div className="flex items-end justify-end">
              <div className="text-right">
                <div className="text-xs text-gray-500">Subtotal</div>
                <div className="font-semibold">{brl(totals.subtotal)}</div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-2xl font-extrabold">{brl(totals.total)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="card p-3 grid gap-2">
          <div className="label">Observações</div>
          <textarea className="input" rows={4}
                    value={state.meta.obs}
                    onChange={e=>dispatch({type:'FIELD', path:['meta','obs'], value:e.target.value})}/>
        </section>

        <div className="sticky-actions mt-1">
          <div className="card p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button className="btn btn-outline" onClick={onClear}>Limpar</button>
            <button className="btn btn-primary" onClick={onGenerate}>Gerar PDF & Compartilhar</button>
          </div>
          <div className="mt-2">
            <InstallPromptButton />
          </div>
          <p className="text-[11px] text-gray-500 text-center mt-1">O botão de compartilhar usa o recurso nativo do Android quando disponível.</p>
        </div>
      </main>
    </div>
  )
}

function genNumber(){
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
}

function parseBR(x){
  if(typeof x === 'number') return x;
  if(!x) return 0;
  return Number(String(x).replace(/\./g,'').replace(',','.')) || Number(x) || 0;
}

function brl(n){
  return new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(Number(n||0));
}
