/** Small local visual fallback for common LaTeX commands.
 * No arbitrary HTML, TeX package execution or external resources.
 * Not a full TeX renderer; KaTeX remains authoritative when available.
 */
const SYMBOLS={
 alpha:"α",beta:"β",gamma:"γ",delta:"δ",Delta:"Δ",epsilon:"ε",
 eta:"η",theta:"θ",Theta:"Θ",lambda:"λ",Lambda:"Λ",mu:"μ",nu:"ν",
 pi:"π",Pi:"Π",rho:"ρ",sigma:"σ",Sigma:"Σ",tau:"τ",omega:"ω",Omega:"Ω",
 nabla:"∇",partial:"∂",infty:"∞",sum:"∑",int:"∫",
 cdot:"·",times:"×",pm:"±",mp:"∓",leq:"≤",geq:"≥",
 approx:"≈",neq:"≠",rightarrow:"→",to:"→",leftarrow:"←",sqrt:"√",
};
const escape=ch=>String(ch).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function simpleLatexMathHTML(source){
 let index=0;
 const value=String(source).slice(0,32000);
 const group=()=>{
   while(value[index]===" ")index++;
   if(value[index]==="{"){
     index++;
     return parse("}");
   }
   return atom();
 };
 const atom=()=>{
   if(index>=value.length)return "";
   const c=value[index++];
   if(c==="\\"){
     if(value[index]==="\\"){index++;return "<span class='latex-newline'></span>"}
     const m=value.slice(index).match(/^[A-Za-z]+/);
     const command=m?m[0]:value[index]||"";
     index+=command.length;
     if(command==="frac"||command==="dfrac"||command==="tfrac"){
       const numerator=group(),denominator=group();
       return '<span class="latex-native-frac"><span>'+numerator+'</span><span>'+denominator+"</span></span>";
     }
     if(command==="sqrt")return '<span class="latex-native-sqrt">√<span>'+group()+"</span></span>";
     if(["mathrm","text","mathbf","mathit","operatorname"].includes(command))return '<span class="latex-native-text">'+group()+"</span>";
     if(command==="begin"||command==="end"){group();return ""}
     if(command==="left"||command==="right")return "";
     if(command==="quad")return "\u2003";
     if(command==="qquad")return "\u2003\u2003";
     if(command===","||command===";")return "\u2009";
     return SYMBOLS[command]?escape(SYMBOLS[command]):escape("\\"+command);
   }
   if(c==="^"||c==="_"){
     const v=group();
     return c==="^"?"<sup>"+v+"</sup>":"<sub>"+v+"</sub>";
   }
   if(c==="{")return parse("}");
   if(c==="&")return "\u2002";
   if(c==="\n")return " ";
   return escape(c);
 };
 const parse=close=>{
   const parts=[];
   while(index<value.length&&value[index]!==close)parts.push(atom());
   if(close&&value[index]===close)index++;
   return parts.join("");
 };
 return '<span class="latex-native-math">'+parse("")+"</span>";
}
