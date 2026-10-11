'use strict';
const $=id=>document.getElementById(id);
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function text(id,value){$(id).textContent=value;}
let sourceRegistry=null;
/* Historical research is scored separately from the prospective prediction ledger. */
let historicalRenderedKey='';
function renderHistoricalReplay(){
  const d=sourceRegistry?.historical_replay;if(!d)return;
  const filter=$('historical-filter').value,key=d.prediction_sha256+':'+filter;
  if(key===historicalRenderedKey)return;historicalRenderedKey=key;
  const percent=p=>(100*p).toFixed(1)+'%',score=p=>p.toFixed(4);
  text('historical-caption',d.rows.length+'份合约 · '+d.underlying_event_groups+'个发布事件组 · 第一轮 / 第二轮 / 当时市场');
  const metrics=$('historical-metrics');metrics.replaceChildren();
  for(const [name,key,cls] of [['第一轮固定规则','round1_probability','first'],['第二轮联网回放','round2_probability','second'],['原历史市场价','market_probability','market']]){
    const m=d.summary.all[key],card=node('div',undefined,'historical-score '+cls);
    card.append(node('span',name),node('strong',score(m.brier)),node('small','Brier · 越低越好'),node('p','方向正确 '+m.correct+'/'+m.n+' · '+(m.accuracy*100).toFixed(0)+'%'));metrics.append(card);
  }
  const platforms=$('historical-platforms');platforms.replaceChildren();
  for(const platform of ['Polymarket','Kalshi']){
    const s=d.summary[platform],box=node('section',undefined,'historical-platform');box.append(node('h4',platform+' · 10题'));
    for(const [label,key,cls] of [['第一轮','round1_probability','first'],['第二轮','round2_probability','second'],['市场','market_probability','market']]){
      const m=s[key],row=node('div',undefined,'historical-bar-row');row.append(node('span',label));
      const track=node('div',undefined,'historical-bar-track'),bar=node('div',undefined,'historical-bar '+cls);bar.style.width=Math.min(100,m.brier/.25*100)+'%';track.append(bar);row.append(track,node('b',score(m.brier)));box.append(row);
    }
    box.append(node('p',platform==='Kalshi'?'第二轮仍输给市场，也低于第一轮表现。':'第二轮分数改善；已知答案的回放不能证明样本外优势。'));platforms.append(box);
  }
  const ci=d.group_bootstrap_market_minus_round2_95pct;
  text('historical-boundary','全部猜NO：75%。按8个发布事件组重采样，市场减第二轮 Brier 的95%区间为 '+score(ci[0])+' 至 '+score(ci[1])+'，跨过零；也无法消除已知答案偏差。');
  const body=$('historical-rows');body.replaceChildren();const rows=d.rows.filter(r=>filter==='all'||r.platform===filter);text('historical-count',rows.length+'题 · 概率均指YES');
  for(const r of rows){
    const tr=node('tr'),q=node('td');q.append(node('strong',r.exam_id+' · '+r.question),node('small',r.platform+' · 截止 '+r.information_cutoff.replace('T',' ').replace('+00:00',' UTC')));tr.append(q);
    for(const key of ['round1_probability','round2_probability','market_probability']){const td=node('td',percent(r[key]),key==='round2_probability'?'historical-current':'');tr.append(td);}
    tr.append(node('td',r.result?'YES':'NO'));const research=node('td'),details=node('details');details.append(node('summary','依据与反证'),node('p',r.reasoning),node('p','反对YES：'+r.against_yes),node('p','反对NO：'+r.against_no),node('p','更新依据：'+r.update_reason),node('p','情景拆解：'+r.fermi));
    details.append(node('p','市场采样：'+r.price_timestamp+' · '+r.price_kind));if(r.quality_flags.length)details.append(node('p','报价限制：'+r.quality_flags.join('；')));
    for(const source of r.sources){try{const u=new URL(source.url);if(u.protocol!=='https:')continue;const a=node('a',source.id+' · '+source.published_on+' ↗');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';details.append(a);}catch{}}
    research.append(details);tr.append(research);body.append(tr);
  }
  text('historical-sync','沿用原信息截止与开盘日UTC日末市场价，市场多约一天信息，部分报价陈旧或过宽。没有可执行策略与完整成本数据，盈利未计算。');
}
$('historical-filter').addEventListener('change',()=>{historicalRenderedKey='';renderHistoricalReplay();});

fetch('./data.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(d=>{sourceRegistry={historical_replay:d};text('recorded-date',new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(d.recorded_at))+' · 台北');renderHistoricalReplay();}).catch(()=>{text('historical-caption','记录读取失败，请刷新后重试。');});
