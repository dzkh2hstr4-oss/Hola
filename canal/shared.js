// Palm silhouette SVG path generator
function palm(x, baseY, h, lean, scale){
  const topX = x + lean, topY = baseY - h;
  let s = `<path d="M${x-8*scale},${baseY} Q${x+lean*0.3},${baseY-h*0.5} ${topX-3*scale},${topY} L${topX+3*scale},${topY} Q${x+lean*0.3+10*scale},${baseY-h*0.5} ${x+8*scale},${baseY} Z" fill="#12061f"/>`;
  const fronds = [[-150,1],[-120,1.1],[-80,1],[-40,0.9],[-10,0.8],[20,0.9],[60,1],[100,1.1],[140,0.95],[180,0.9]];
  for (const [ang,len] of fronds){
    const a = ang*Math.PI/180, L = 110*scale*len;
    const ex = topX + Math.cos(a)*L, ey = topY + Math.sin(a)*L*0.55 + L*0.35;
    const cx = topX + Math.cos(a)*L*0.5, cy = topY - 30*scale;
    s += `<path d="M${topX},${topY} Q${cx},${cy} ${ex},${ey} Q${cx},${cy+22*scale} ${topX},${topY+6*scale} Z" fill="#12061f"/>`;
  }
  return s;
}
