import knowledgeBase from '../../knowledgeBase.js';

function normalize(s='') {
  return s.toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
}

export function searchKnowledge(query, limit=3) {
  const q = normalize(query);
  const terms = q.split(/\s+/).filter(t => t.length > 2);
  return knowledgeBase
    .map(item => {
      const haystack = normalize([item.title, ...(item.keywords||[]), item.answer].join(' '));
      let score = 0;
      for (const term of terms) if (haystack.includes(term)) score += 1;
      for (const kw of item.keywords || []) if (q.includes(normalize(kw))) score += 4;
      return { ...item, score };
    })
    .filter(x => x.score > 0)
    .sort((a,b) => b.score-a.score)
    .slice(0,limit);
}
