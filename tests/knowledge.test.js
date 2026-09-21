import test from 'node:test';
import assert from 'node:assert/strict';
import { loadKnowledge } from '../src/knowledge/loader.js';
import { searchKnowledge } from '../src/knowledge/search.js';

test('loads structured knowledge documents',()=>{
  const docs=loadKnowledge();
  assert.ok(docs.length >= 8);
  assert.ok(docs.some(x=>x.id==='sector-auto-parts'));
});

test('finds auto-parts alternatives',()=>{
  const hits=searchKnowledge('هل يدعم البرنامج قطع الغيار البديلة ورقم OEM؟',3);
  assert.equal(hits[0]?.id,'sector-auto-parts');
});

test('finds contracting project cost center knowledge',()=>{
  const hits=searchKnowledge('كيف يتم ربط المشروع بمركز التكلفة في المقاولات؟',3);
  assert.equal(hits[0]?.id,'sector-contracting');
});

test('finds ZATCA guidance',()=>{
  const hits=searchKnowledge('عندي فاتورة مرفوضة من هيئة الزكاة ZATCA',3);
  assert.equal(hits[0]?.id,'zatca-overview');
});
