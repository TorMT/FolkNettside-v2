import test from "node:test";
import assert from "node:assert/strict";
import {albumsFromFolders,filterPhotoAlbums,photoFromDrive,publishedAlbums,photoCarouselWindow} from "../src/diverse/photo-feed-model.js";

const A="1ZAOVPYckueXZiHhjbjjYz873rJr2p5RN";
const B="1r_K_GWX2r-Kx6ZPfisAWzWCqIgWcPBzZ";
const C="1rCXvLY1jAGx-ulCBo960MqZ7_joRjRBg";

test("folder name becomes album category; filename sorting numeric and empty folders omitted",()=>{
  const folders=[
    {id:A,name:"DykkeTur08112026K2",files:[
      {id:C,name:"Panorama_v2_10.jpg",mimeType:"image/jpeg",modifiedTime:"2026-11-09"},
      {id:B,name:"Panorama_v2_02.jpg",mimeType:"image/jpeg",modifiedTime:"2026-11-08"},
      {id:"1-invalid",name:"notes.txt",mimeType:"text/plain"}]},
    {id:"abcdefghij1234",name:"Empty",files:[]}
  ];
  const out=albumsFromFolders(folders);
  assert.equal(out.length,1);
  assert.equal(out[0].category,"DykkeTur08112026K2");
  assert.deepEqual(out[0].photos.map(x=>x.name),["Panorama_v2_02.jpg","Panorama_v2_10.jpg"]);
});

test("published manifest only permits sanitized Drive IDs and selected keys",()=>{
  const out=publishedAlbums({schema:1,albums:[
    {id:A,title:'<img src=x onerror=alert(1)>',date:"2026-11-09",images:[
      {id:B,name:"Panorama 01"}, {id:"javascript:alert(1)",name:"Bad"}]}
  ]});
  assert.equal(out.length,1);
  assert.equal(out[0].photos.length,1);
  assert.match(out[0].photos[0].src,/^https:\/\/drive.google.com\/thumbnail\?id=/);
  assert.equal(out[0].photos[0].original,"https://drive.google.com/file/d/"+B+"/view");
});

test("no unsupported/private URLs or oversized images are indexed",()=>{
  assert.equal(photoFromDrive({id:B,name:"secret.html",mimeType:"text/html"}),null);
  assert.equal(photoFromDrive({id:B,name:"huge.jpg",mimeType:"image/jpeg",size:26_000_000}),null);
  assert.equal(publishedAlbums({schema:2,albums:[]}).length,0);
});

test("search matches album folder names and photo filename; category filter",()=>{
  const out=publishedAlbums({schema:1,albums:[
    {id:A,title:"DykkeTur",date:"2026-11-09",images:[{id:B,name:"Sjø 01"}]},
    {id:"1zFMkK1tJQZtFfQuTn6a2lNDeUO8kub2i",title:"Sommer",date:"2026-10-01",images:[{id:C,name:"Sol"}]}
  ]});
  assert.equal(filterPhotoAlbums(out,{query:"Sjø"}).length,1);
  assert.equal(filterPhotoAlbums(out,{category:"Sommer"})[0].title,"Sommer");
  assert.deepEqual(filterPhotoAlbums(out,{sort:"alpha"}).map(x=>x.title),["DykkeTur","Sommer"]);
});


test("four-up carousel keeps every visible row on one line of four images",()=>{
  assert.deepEqual(photoCarouselWindow(4,0),{page:0,pages:1,start:0,end:4});
  assert.deepEqual(photoCarouselWindow(5,0),{page:0,pages:2,start:0,end:4});
  assert.deepEqual(photoCarouselWindow(5,1),{page:1,pages:2,start:1,end:5});
  assert.deepEqual(photoCarouselWindow(10,1),{page:1,pages:3,start:4,end:8});
  assert.deepEqual(photoCarouselWindow(10,2),{page:2,pages:3,start:6,end:10});
  assert.deepEqual(photoCarouselWindow(10,10),{page:2,pages:3,start:6,end:10});
  assert.deepEqual(photoCarouselWindow(10,-9),{page:0,pages:3,start:0,end:4});
  assert.deepEqual(photoCarouselWindow(2,0),{page:0,pages:1,start:0,end:2});
  assert.deepEqual(photoCarouselWindow(0,0),{page:0,pages:1,start:0,end:0});
});
