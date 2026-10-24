import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {courseViewerNeighbors} from "../src/viewers/course-file-navigation.js";

test("next/previous stay within section and follow natural file ordering",()=>{
  const course={semester:5,code:"Marin-Dynamikk",resources:[
    {section:"Øving 7",name:"Øving10.pdf",label:"10"},
    {section:"Øving 1",name:"Other.pdf"},
    {section:"Øving 7",name:"Øving2.pdf",label:"2"},
    {section:"Øving 7",name:"Øving1.pdf",label:"1"},
  ]};
  const first=courseViewerNeighbors(course,3);
  assert.equal(first.position,1);
  assert.equal(first.total,3);
  assert.equal(first.previous,null);
  assert.deepEqual(first.next,{index:2,label:"2",href:"#/viewer/5/Marin-Dynamikk/2"});
  const middle=courseViewerNeighbors(course,2);
  assert.equal(middle.previous.index,3);
  assert.equal(middle.next.index,0);
  assert.equal(courseViewerNeighbors(course,0).next,null);
  assert.equal(courseViewerNeighbors(course,1).total,1);
  assert.equal(courseViewerNeighbors(course,1).previous,null);
});

test("nested folders are sorted first and names are encoded",()=>{
  const course={semester:1,code:"genkjemi",resources:[
    {section:"filer",name:"Loose.pdf",folders:[]},
    {section:"filer",name:"2.pdf",label:"Øving 2",folders:["Øving10"]},
    {section:"filer",name:"10.pdf",label:"Øving 10",folders:["Øving2"]},
    {section:"filer",name:"1.pdf",folders:["Øving2"]},
  ]};
  const result=courseViewerNeighbors(course,3);
  assert.equal(result.total,4);
  assert.equal(result.previous,null);
  assert.equal(result.next.index,2);
  assert.equal(result.position,1);
  assert.equal(courseViewerNeighbors(course,1).next.index,0);
});

test("out-of-range and invalid routes do not provide navigation links",()=>{
  const course={semester:5,code:"Marin-Dynamikk",resources:[{section:"A",name:"A.pdf"}]};
  assert.deepEqual(courseViewerNeighbors(course,42),{
    previous:null,next:null,position:0,total:0
  });
  assert.equal(courseViewerNeighbors({...course,code:"../../private"},0).total,0);
  assert.equal(courseViewerNeighbors({...course,semester:-1},0).total,0);
  assert.equal(courseViewerNeighbors(null,0).total,0);
});

test("file viewer renders real links, without relying on click-only handlers",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  const viewer=readFileSync(new URL("../src/viewers/viewer-shell.js",import.meta.url),"utf8");
  assert.match(app,/fileNavigation:courseViewerNeighbors/);
  assert.match(viewer,/href="\$\{escapeHTML\(resource\.fileNavigation\.previous\.href\)\}"/);
  assert.match(viewer,/href="\$\{escapeHTML\(resource\.fileNavigation\.next\.href\)\}"/);
  assert.match(viewer,/aria-label="Neste fil:/);
});
