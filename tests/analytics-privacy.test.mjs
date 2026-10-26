import test from "node:test";
import assert from "node:assert/strict";
import {
  analyticsConsentChoice,analyticsMeasurementId,safeAnalyticsPage,
  loadAnalytics,enableAnalytics,setAnalyticsConsent,trackPage,analyticsStatus,registerAnalyticsCourses
} from "../src/platform/analytics.js";

function fakeStorage(){
  const records=new Map();
  return {
    getItem:key=>records.get(key)||null,
    setItem:(key,value)=>records.set(key,String(value)),
    removeItem:key=>records.delete(key)
  };
}
const origin="https://tormt.github.io",path="/FolkNettside-v2/";
const url=hash=>origin+path+hash;
test("same legacy GA4 measurement ID is supported without accepting arbitrary script addresses",()=>{
  assert.equal(analyticsMeasurementId("G-BJ41MZJP0L"),"G-BJ41MZJP0L");
  for(const invalid of ["UA-123","G-abc","G-123<script>","G-1","",null])
    assert.equal(analyticsMeasurementId(invalid),"",String(invalid));
});
test("coarse routing strips hash parameters, course names, file names and query values",()=>{
  const paths=[
    ["#/engineering/kisssoft?file=patient.pdf","/engineering/kisssoft"],
    ["#/courses/5/TMR4182?student=Jane","/courses/course"],
    ["#/viewer/5/TMR4182/3?password=secret","/courses/viewer"],
    ["#/settings/engineering","/settings/engineering"],
    ["#/tools/python?code=confidential","/tools/python"],
    ["#/projects/my-private-slug","/projects/detail"]
  ];
  for(const [hash,expected] of paths){
    const found=safeAnalyticsPage(url(hash)+"&token=confidential");
    assert.equal(found?.route,expected);
    assert.doesNotMatch(JSON.stringify(found),/patient|Jane|password|secret|my-private-slug|confidential|TMR4182/);
  }
});
test("private, health, storage and account routes are never tracked",()=>{
  for(const name of [
    "diverse/medisin","diverse/diving","diverse/dive-map","diverse/brewing",
    "tools/vault","settings/connections","viewer/not/a/valid/route"
  ]){
    if(name.startsWith("viewer/"))continue;
    assert.equal(safeAnalyticsPage(url("#/"+name)),null,name);
  }
  assert.equal(safeAnalyticsPage(url("#/?q=email")+"?tracking=abc")?.route,"/");
});
test("full, limited and no-statistics choices have distinct verified network and event behavior",()=>{
  const prev={localStorage:globalThis.localStorage,document:globalThis.document,
    location:globalThis.location,gtag:globalThis.gtag,dataLayer:globalThis.dataLayer,
    __FOLK_ANALYTICS_ID__:globalThis.__FOLK_ANALYTICS_ID__};
  const storage=fakeStorage(),requests=[],calls=[];
  const location={origin,pathname:path,hash:"#/courses/5/TMR4182",
    href:url("#/courses/5/TMR4182?student=Jane")};
  try{
    globalThis.localStorage=storage;
    globalThis.location=location;
    globalThis.__FOLK_ANALYTICS_ID__="G-BJ41MZJP0L";
    registerAnalyticsCourses([{id:5,courses:[{code:"TMR4182"}]}]);
    globalThis.gtag=(...args)=>calls.push(args);
    globalThis.document={
      createElement:tag=>({tagName:tag,async:false,src:"",dataset:{}}),
      head:{append:item=>requests.push(item)}
    };
    assert.equal(analyticsConsentChoice(storage),"unset");
    assert.equal(loadAnalytics(),false,"No Google connection should be made before selection");
    assert.equal(enableAnalytics(),false);
    assert.equal(requests.length,0);
    assert.equal(calls.length,0);
    assert.equal(setAnalyticsConsent("denied",storage),"denied");
    assert.equal(loadAnalytics(),false);
    assert.equal(requests.length,0,"Complete refusal cannot load the Google tag");

    assert.equal(setAnalyticsConsent("limited",storage),"limited");
    assert.equal(requests.length,1,"Limited mode loads Google only after explicit choice");
    assert.match(requests[0].src,/googletagmanager.com\/gtag\/js\?id=G-BJ41MZJP0L/);
    assert.equal(calls[0][0],"consent");
    assert.equal(calls[0][1],"default");
    assert.equal(calls[0][2].analytics_storage,"denied");
    assert.equal(calls.find(x=>x[0]==="consent"&&x[1]==="update")?.[2].analytics_storage,"denied");
    assert.equal(calls.filter(x=>x[0]==="config").length,1);
    const views=()=>calls.filter(x=>x[0]==="event"&&x[1]==="page_view");
    assert.equal(views().length,1);
    assert.equal(views()[0][2].page_path,path+"#/courses/course");
    assert.equal(views()[0][2].course_code,undefined,"Limited measurement must avoid course-level dimensions");
    assert.doesNotMatch(JSON.stringify(calls),/student=Jane|password=|\/courses\/5\/TMR4182/);
    assert.equal(trackPage(),false,"Same page should not be sent twice");

    setAnalyticsConsent("granted",storage);
    assert.equal(requests.length,1,"Changing tiers must not load the script again");
    assert.equal(calls.filter(x=>x[0]==="consent"&&x[1]==="update").at(-1)?.[2].analytics_storage,"granted");
    assert.equal(views().length,2);
    assert.equal(views()[1][2].course_code,"TMR4182");
    assert.equal(views()[1][2].course_semester,"5");

    location.hash="#/diverse/medisin?name=Patient";location.href=url(location.hash);
    assert.equal(trackPage(),false,"Sensitive routes cannot be measured");
    location.hash="#/engineering/cad?file=blueprint.step";location.href=url(location.hash);
    assert.equal(trackPage(),true);
    assert.equal(views().at(-1)[2].page_path,path+"#/engineering/cad");
    assert.doesNotMatch(JSON.stringify(calls),/Patient|blueprint.step/);

    setAnalyticsConsent("denied",storage);
    const before=views().length;
    location.hash="#/cv";location.href=url(location.hash);
    assert.equal(trackPage(),false,"Explicit no-statistics must disable future manual events");
    assert.equal(views().length,before);
    assert.equal(analyticsStatus().active,false);
  }finally{
    for(const [key,value] of Object.entries(prev)){
      if(value===undefined)delete globalThis[key];
      else globalThis[key]=value;
    }
  }
});
