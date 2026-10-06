import test from "node:test";
import assert from "node:assert/strict";
import {solveFrame2D} from "../src/structure/frame2d.js";

const near=(actual,expected,tol=1e-9)=>assert.ok(Math.abs(actual-expected)<=tol,`expected ${actual} ≈ ${expected}`);

test("axial bar matches PL/EA",()=>{
  const E=210e9,A=.01,L=2,P=100e3;
  const r=solveFrame2D({
    nodes:[{id:1,x:0,y:0},{id:2,x:L,y:0}],
    elements:[{id:"e1",n1:1,n2:2,E,A,I:1e-6}],
    supports:[{node:1,ux:true,uy:true,rz:true},{node:2,uy:true,rz:true}],
    loads:[{node:2,fx:P}]
  });
  near(r.nodes[1].ux,P*L/(E*A),1e-12);
  near(r.nodes[0].rx,-P,1e-6);
});

test("cantilever tip load matches Euler-Bernoulli solution",()=>{
  const E=210e9,I=8e-6,A=.02,L=3,P=20e3;
  const r=solveFrame2D({
    nodes:[{id:"root",x:0,y:0},{id:"tip",x:L,y:0}],
    elements:[{id:"beam",n1:"root",n2:"tip",E,A,I}],
    supports:[{node:"root",ux:true,uy:true,rz:true}],
    loads:[{node:"tip",fy:-P}]
  });
  const tip=r.nodes[1],root=r.nodes[0];
  near(tip.uy,-P*L**3/(3*E*I),1e-10);
  near(tip.rz,-P*L**2/(2*E*I),1e-10);
  near(root.ry,P,1e-6);
  near(root.rm,P*L,1e-5);
});

test("inclined axial member transforms global response correctly",()=>{
  const E=70e9,A=.005,I=2e-6,L=Math.sqrt(2),P=10e3;
  const r=solveFrame2D({
    nodes:[{id:1,x:0,y:0},{id:2,x:1,y:1}],
    elements:[{id:"diag",n1:1,n2:2,E,A,I}],
    supports:[{node:1,ux:true,uy:true,rz:true},{node:2,rz:true}],
    loads:[{node:2,fx:P/Math.sqrt(2),fy:P/Math.sqrt(2)}]
  });
  const extension=P*L/(E*A);
  near(r.nodes[1].ux,extension/Math.sqrt(2),1e-10);
  near(r.nodes[1].uy,extension/Math.sqrt(2),1e-10);
});
