import test from "node:test";
import assert from "node:assert/strict";
import {findIndices} from "../src/viewers/dom-search.js";

test("text search is case-insensitive and non-overlapping",()=>{
  assert.deepEqual(findIndices("Hydro hydro HYDRO","hydro"),[0,6,12]);
});

test("empty search has no matches",()=>{
  assert.deepEqual(findIndices("abc",""),[]);
});

test("unicode text remains searchable",()=>{
  assert.deepEqual(findIndices("Øving 01 og øving 02","øVING"),[0,12]);
});
