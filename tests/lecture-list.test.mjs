import test from "node:test";
import assert from "node:assert/strict";
import {viewerKind} from "../src/viewers/registry.js";
import {
  lectureProvider,parseLectureText,normalizeLectureList,groupedLectures
} from "../src/video/lecture-list.js";
import {createProgressStore} from "../src/video/progress-store.js";

const data={
  videos:[
    {title:"Forelesning 10 del A",url:"https://www.youtube.com/watch?v=fkk7xVuNJ2Y",
      group:"Forelesning 10",part:"A",description:"Trykk i rør",
      themes:["Bernoulli","trykk"],group_description:"Kapittel 3"},
    {title:"Forelesning 2 del A",url:"https://youtu.be/4fsvYAdbGes",
      group:"Forelesning 2",part:"A",themes:["Oppdrift"]},
    {title:"Forelesning 2 del B",url:"https://www.youtube.com/watch?v=aGaS2E2iNh4",
      group:"Forelesning 2",part:"B",themes:["Strømning"]}
  ]
};

test("Original V1 Forelesning.json and .txt routes open the native video playlist",()=>{
  assert.equal(viewerKind({name:"Forelesning.json",kind:"JSON"}),"lecture-list");
  assert.equal(viewerKind({path:"./semesters/3/Fluid/filer/Forelesning.txt"}),"lecture-list");
  assert.equal(viewerKind({kind:"PLAYLIST",path:"./list.json"}),"lecture-list");
  assert.equal(viewerKind({name:"course.json",kind:"JSON"}),"text");
  assert.equal(viewerKind({name:"lecture.mp4",kind:"VIDEO"}),"video");
});
test("Validated YouTube, Panopto and Drive URLs never use executable schemes",()=>{
  assert.equal(lectureProvider("https://youtu.be/fkk7xVuNJ2Y")?.kind,"youtube");
  assert.equal(lectureProvider("https://www.youtube.com/watch?v=fkk7xVuNJ2Y")?.embed,
    "https://www.youtube-nocookie.com/embed/fkk7xVuNJ2Y");
  assert.equal(lectureProvider("https://drive.google.com/file/d/abcdef123456/preview")?.kind,"drive");
  assert.equal(lectureProvider("https://example.panopto.com/Panopto/Pages/Viewer.aspx?id=2ad54662-7337-4b58-a849-03ebdb674b12")?.kind,"panopto");
  assert.equal(lectureProvider("javascript:alert(1)"),null);
  assert.equal(lectureProvider("http://example.com/video"),null);
  assert.equal(lectureProvider("https://www.youtube.com/watch?v=bad"),null);
});
test("Original V1 group, part, theme and metadata are preserved with natural sorting",()=>{
  const videos=normalizeLectureList(data);
  assert.equal(videos.length,3);
  const grouped=groupedLectures(videos);
  assert.deepEqual(grouped.map(g=>g.id),["Forelesning 2","Forelesning 10"]);
  assert.equal(grouped[1].description,"Kapittel 3");
  assert.equal(grouped[0].videos[1].part,"B");
  assert.deepEqual(groupedLectures(videos,{query:"Bernoulli"}).map(g=>g.id),["Forelesning 10"]);
  assert.deepEqual(groupedLectures(videos,{query:"Oppdrift"}).map(g=>g.id),["Forelesning 2"]);
  assert.deepEqual(groupedLectures(videos,{query:"Kapittel 3"}).map(g=>g.id),["Forelesning 10"]);
});
test("Duplicate/unsafe URLs cannot populate playlist and individual watched filters persist",()=>{
  const raw=normalizeLectureList({videos:[
    ...data.videos,
    data.videos[0],
    {title:"Unsafe",url:"javascript:alert(1)"}
  ]});
  assert.equal(raw.length,3);
  const records=new Map();
  const store=createProgressStore({
    getItem:key=>records.get(key)||null,
    setItem:(key,value)=>records.set(key,value),
    removeItem:key=>records.delete(key)
  });
  store.write({url:raw[0].id},{watched:true,position:34,duration:120});
  const grouped=groupedLectures(raw,{unwatchedOnly:true,
    isWatched:x=>Boolean(store.read({url:x.id}).watched)});
  assert.equal(grouped.reduce((sum,g)=>sum+g.videos.length,0),2);
  store.clear({url:raw[0].id});
  assert.equal(groupedLectures(raw,{unwatchedOnly:true,
    isWatched:x=>Boolean(store.read({url:x.id}).watched)})
    .reduce((sum,g)=>sum+g.videos.length,0),3);
});
test("Plain-text lecture lists and markdown link notation are supported",()=>{
  const parsed=parseLectureText("# Forelesninger\nForelesning 1: https://youtu.be/fkk7xVuNJ2Y\n[Forelesning 2](https://www.youtube.com/watch?v=4fsvYAdbGes)\nmalformed");
  assert.equal(normalizeLectureList(parsed).length,2);
});
