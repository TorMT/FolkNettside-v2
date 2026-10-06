export const semesters=Array.from({length:10},(_,i)=>i+1);

export const courses=[
 ["TMR4182","Marin konstruksjon","Skrog, styrke, FEM og konstruksjonslære.",["Konstruksjon","FEM","Skrog"]],
 ["TMR4175","Hydrostatikk og stabilitet","Likevekt, oppdrift, stabilitet og lastetilfeller.",["Hydrostatikk","Stabilitet","Last"]],
 ["TMR4145","Skipsmotstand","Motstand, propulsjon og effektivitet.",["Motstand","Propulsjon","CFD"]],
 ["TMR4120","Strømningsmekanikk","Strømning, rør, tap og anvendelser.",["Fluid","Rør","Tap"]],
 ["TMA4100","Matematikk 4","Differensialligninger og numerikk.",["Matematikk","Numerikk"]],
 ["TME4100","Termodynamikk","Termodynamiske systemer og sykluser.",["Termodynamikk","Energi"]]
];

export const resources=[
 {section:"Forelesninger",name:"lecture-01.pdf",label:"Forelesning 01 - hydrostatikk",path:"./examples/semesters/5/TMR4182/Forelesninger/lecture-01.pdf",kind:"PDF"},
 {section:"Kok",name:"kok-example.md",label:"Kok - eksempelnotater",path:"./examples/semesters/5/TMR4182/Kok/kok-example.md",kind:"MD"},
 {section:"Kok",name:"hydro-demo.py",label:"Kok - hydro demo kode",path:"./examples/semesters/5/TMR4182/Kok/hydro-demo.py",kind:"PY"},
 {section:"Kok",name:"hydro-data.csv",label:"Kok - hydro testdata",path:"./examples/semesters/5/TMR4182/Kok/hydro-data.csv",kind:"CSV"},
 {section:"Kok",name:"formula-demo.html",label:"Kok - HTML formelark",path:"./examples/semesters/5/TMR4182/Kok/formula-demo.html",kind:"HTML"},
 {section:"Kok",name:"hydro-demo.ipynb",label:"Kok - notebook",path:"./examples/semesters/5/TMR4182/Kok/hydro-demo.ipynb",kind:"IPYNB"},
 {section:"Modeller",name:"wedge.stl",label:"Wedge testmodell",path:"./examples/models/wedge.stl",kind:"STL"},
 {section:"Modeller",name:"assembly-demo.3mf",label:"3MF assembly - hull + thruster",path:"./examples/models/assembly-demo.3mf",kind:"3MF"}
];

export const components=[
 "Vessel","Hull","Deck","Machinery",
 "Main Thruster PS","Main Thruster SB","Tunnel Thruster","Battery Pack"
];

export const navLabels={courses:"Courses"};
