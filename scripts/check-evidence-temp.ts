import {questions} from '../src/lib/product/content';
console.log(JSON.stringify(questions.find(q=>q.id==='STR-H-1')?.evidence));
