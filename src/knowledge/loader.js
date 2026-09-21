import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const knowledgeRoot=path.resolve(here,'../../knowledge');

function walk(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory() ? walk(full) : (entry.isFile() && entry.name.endsWith('.md') ? [full] : []);
  });
}

function parseFrontmatter(raw,file) {
  const match=raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if(!match) return {meta:{},content:raw.trim()};
  const meta={};
  for(const line of match[1].split('\n')) {
    const i=line.indexOf(':');
    if(i<0) continue;
    const key=line.slice(0,i).trim();
    const value=line.slice(i+1).trim();
    meta[key]=key==='tags' ? value.split(',').map(x=>x.trim()).filter(Boolean) : value;
  }
  return {meta,content:match[2].trim()};
}

export function loadKnowledge() {
  if(!fs.existsSync(knowledgeRoot)) return [];
  return walk(knowledgeRoot).map(file=>{
    const {meta,content}=parseFrontmatter(fs.readFileSync(file,'utf8'),file);
    return {
      id:meta.id || path.basename(file,'.md'),
      title:meta.title || path.basename(file,'.md'),
      category:meta.category || 'general',
      tags:meta.tags || [],
      content,
      source:path.relative(knowledgeRoot,file).replaceAll('\\','/')
    };
  });
}
