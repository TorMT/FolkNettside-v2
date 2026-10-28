import test from "node:test";
import assert from "node:assert/strict";
import {detectCSVDelimiter,filterDelimitedRows,parseDelimitedText} from "../src/viewers/csv-core.js";

test("multiline quoted CSV cells and escaped quotes remain correctly grouped",()=>{
 const rows=parseDelimitedText('name,description\r\n"Boat","A, B\r\nC"\r\n"R/V","He said ""Hi"""');
 assert.deepEqual(rows,[
  ["name","description"],["Boat","A, B\r\nC"],["R/V",'He said "Hi"']
 ]);
 assert.deepEqual(filterDelimitedRows(rows,"hi"),[rows[0],rows[2]]);
});
test("BOM/TSV, semicolon and bar delimiters are detected",()=>{
 assert.equal(detectCSVDelimiter("a;b\nc;d"),";");
 assert.equal(detectCSVDelimiter("a\tb\nc\td","data.tsv"),"\t");
 assert.equal(detectCSVDelimiter("a|b\nc|d","data.psv"),"|");
 assert.deepEqual(parseDelimitedText("\uFEFFname\tage\r\na\t22","\t"),
  [["name","age"],["a","22"]]);
});
test("unclosed quotes fail instead of returning silently corrupted rows",()=>{
 assert.throws(()=>parseDelimitedText('name,note\n"A,broken'),/unterminated quoted field/);
});

test("delimiter detection ignores a truncated long quoted field",()=>{
 const data='name;description\\r\\n"Boat";"'+"x".repeat(21000)+'"\\r\\n"Ship";"another"';
 assert.equal(detectCSVDelimiter(data,"long.csv"),";");
 assert.equal(parseDelimitedText(data,";")[1][1].length,21000);
});
test("delimiter detection skips embedded newlines inside the truncated quoted cell",()=>{
 const data='x|y\\n"first"|"hello\\n'+"x".repeat(21000)+'"\\n"next"|"ok"';
 assert.equal(detectCSVDelimiter(data,"long.csv"),"|");
});
