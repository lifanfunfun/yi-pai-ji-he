const colors = ['#ef6554','#f5b942','#69b878','#579fd8','#a88ad5','#f28bab'];
export function drawDemoArt(ctx,w,h,id) {
  ctx.save();ctx.fillStyle='#fffdf6';ctx.fillRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
  const ellipse=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x*w,y*h,rx*w,ry*h,0,0,Math.PI*2);ctx.fill();};
  if(id==='building') {
    const block=(x,y,bw,bh,color)=>{ctx.fillStyle=color;ctx.fillRect(x*w,y*h,bw*w,bh*h);ctx.fillStyle='#ffffff55';ctx.fillRect(x*w+4,y*h+4,bw*w-8,7);ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.strokeRect(x*w,y*h,bw*w,bh*h);};
    for(let col=0;col<7;col++) {
      const levels=[3,4,2,5,3,4,2][col];
      for(let level=0;level<levels;level++) block(.08+col*.12,.8-level*.12,.115,.115,colors[(col+level)%6]);
      ctx.fillStyle=colors[(col+3)%6];ctx.beginPath();ctx.moveTo((.07+col*.12)*w,(.8-levels*.12+.12)*h);ctx.lineTo((.14+col*.12)*w,(.68-levels*.12+.12)*h);ctx.lineTo((.21+col*.12)*w,(.8-levels*.12+.12)*h);ctx.closePath();ctx.fill();
    }
    block(.39,.84,.22,.075,'#eab94d');
  } else if(id==='papercut') {
    ctx.fillStyle='#f6dfca';ctx.fillRect(w*.03,h*.04,w*.94,h*.92);
    for(let i=0;i<7;i++) {
      const x=.12+i*.125,y=.42+Math.sin(i*1.7)*.14;
      ctx.fillStyle=colors[i%6];ctx.beginPath();ctx.moveTo(x*w,(y-.19)*h);ctx.lineTo((x+.05)*w,y*h);ctx.lineTo((x+.07)*w,(y+.25)*h);ctx.lineTo((x-.07)*w,(y+.25)*h);ctx.lineTo((x-.05)*w,y*h);ctx.closePath();ctx.fill();
      ellipse(x,y-.02,.037,.045,'#fff5df');
      ctx.strokeStyle=colors[(i+2)%6];ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x*w,(y+.27)*h);ctx.lineTo(x*w,h*.84);ctx.stroke();
    }
    for(let i=0;i<18;i++) ellipse(.07+i*.05,.92,.012,.013,colors[i%6]);
  } else if(id==='tiedye') {
    ctx.fillStyle='#eef5fb';ctx.fillRect(0,0,w,h);
    for(let k=0;k<3;k++) for(let ring=8;ring>=1;ring--) {
      ctx.strokeStyle=colors[(ring+k)%6];ctx.globalAlpha=.55;ctx.lineWidth=13;
      ctx.beginPath();for(let j=0;j<=100;j++){const a=j/100*Math.PI*2,r=ring*12+Math.sin(a*7+k)*5;const x=w*(.2+k*.3)+Math.cos(a)*r,y=h*(k===1?.36:.63)+Math.sin(a)*r; j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    }
    ctx.globalAlpha=1;
    for(let i=0;i<32;i++) ellipse(.04+(i*37%94)/100,.08+(i*23%83)/100,.006,.008,colors[i%6]);
  } else if(id==='decorative') {
    ctx.fillStyle='#b7d5cf';ctx.fillRect(w*.03,h*.04,w*.94,h*.92);
    for(let i=0;i<8;i++) {
      const x=.1+i*.115,y=.38+Math.sin(i)*.13;
      ctx.strokeStyle='#4b8969';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x*w,h*.88);ctx.quadraticCurveTo((x-.025)*w,h*.6,x*w,y*h);ctx.stroke();
      for(let p=0;p<7;p++) ellipse(x+Math.cos(p/7*Math.PI*2)*.036,y+Math.sin(p/7*Math.PI*2)*.05,.025,.034,colors[i%6]);
      ellipse(x,y,.017,.024,'#ffd86c');
      ellipse(x+.025,.69,.032,.015,'#69a379');
    }
    for(let i=0;i<40;i++) ellipse(.05+(i*41%90)/100,.09+(i*17%23)/100,.005,.007,'#fff8dc');
  } else {
    // Deliberately uneven strokes, shapes and dots, like a child's crayon drawing.
    for(let k=0;k<6;k++) {
      ctx.strokeStyle=colors[k];ctx.lineWidth=7+k%3*2;ctx.beginPath();
      for(let i=0;i<75;i++){const x=w*(.07+i*.0115),y=h*(.2+k*.11+Math.sin(i*.24+k)*.05+Math.sin(i*1.7)*.008);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    }
    ellipse(.16,.19,.06,.078,'#f5c843');
    ctx.strokeStyle='#ef6554';ctx.lineWidth=8;ctx.strokeRect(w*.62,h*.3,w*.15,h*.22);
    ctx.beginPath();ctx.moveTo(w*.59,h*.3);ctx.lineTo(w*.69,h*.16);ctx.lineTo(w*.81,h*.3);ctx.stroke();
    for(let i=0;i<28;i++) ellipse(.08+(i*31%84)/100,.13+(i*17%71)/100,.004+(i%3)*.003,.008,colors[i%6]);
  }
  ctx.restore();
}
