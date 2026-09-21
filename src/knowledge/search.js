import { loadKnowledge } from './loader.js';

const documents=loadKnowledge();

function normalize(s='') {
  return s.toLowerCase()
    .replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')
    .replace(/[^\p{L}\p{N}\s-]/gu,' ')
    .replace(/\s+/g,' ').trim();
}

const stop=new Set(['هل','على','الى','إلى','في','من','عن','هذا','هذه','مع','عندي','عند','كيف','ما','هو','هي','او','أو','the','is','a']);

function terms(text) {
  return [...new Set(normalize(text).split(' ').filter(x=>x.length>1 && !stop.has(x)))];
}

export function searchKnowledge(query,limit=4) {
  const q=normalize(query);
  const qTerms=terms(query);

  return documents.map(doc=>{
    const title=normalize(doc.title);
    const tags=(doc.tags||[]).map(normalize);
    const body=normalize(doc.content);
    let score=0;
    const matched=[];

    for(const tag of tags) {
      if(tag && q.includes(tag)) { score+=8; matched.push(tag); }
      else for(const term of qTerms) if(tag.includes(term) || term.includes(tag)) { score+=3; matched.push(term); }
    }
    for(const term of qTerms) {
      if(title.includes(term)) score+=4;
      if(body.includes(term)) score+=1;
    }
    if(normalize(doc.category) && q.includes(normalize(doc.category))) score+=2;

    return {...doc,score,matched:[...new Set(matched)]};
  }).filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,limit);
}

export function knowledgeStats() {
  return {
    documents:documents.length,
    categories:[...new Set(documents.map(x=>x.category))].sort()
  };
}
