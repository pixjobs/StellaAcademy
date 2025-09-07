'use client';

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';

type WarpProps = {
  autoStart?: boolean;
  density?: number;
  onCruise?: () => void;
  respectReducedMotion?: boolean; // ⬅️ NEW
};

export default function WarpDrive({
  autoStart = true,
  density = 1000,
  onCruise,
  respectReducedMotion = true, // default: respect; can be turned off
}: WarpProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const state = useMemo(() => ({
    speed: 0.7, streak: 0.55, zoom: 1, vignette: 0.3, flash: 0,
  }), []);

  useEffect(() => {
    const wrap = wrapRef.current!, canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    let W=0,H=0,CX=0,CY=0,MAXR=0;
    const resize = () => {
      W = canvas.width  = Math.floor(wrap.clientWidth * dpr);
      H = canvas.height = Math.floor(wrap.clientHeight * dpr);
      CX = W*0.5; CY = H*0.5; MAXR = Math.max(W,H)*0.7;
      ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled=false;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    const N = Math.max(200, Math.min(5000, density));
    type Star={a:number;r:number;z:number;s:number;c:number};
    const stars:Star[] = new Array(N).fill(0).map(()=>({
      a:Math.random()*Math.PI*2, r:Math.random()*(MAXR*0.6),
      z:Math.random()*0.9+0.1, s:Math.random()*0.9+0.1, c:Math.random()*0.6+0.4
    }));

    const setOverlayOpacity=(v:number)=>{ if(overlayRef.current) overlayRef.current.style.opacity=String(v); };
    const setFlash=(v:number)=>{ if(!flashRef.current) return; flashRef.current.style.opacity=String(v); flashRef.current.style.transform=`scale(${1+v*0.15})`; };

    let raf=0;
    const draw=()=>{ 
      ctx.fillStyle='rgba(4,10,22,0.5)'; ctx.fillRect(0,0,W,H);
      const {speed:sp, streak:st, zoom:zm}=state;
      ctx.save(); ctx.translate(CX,CY); ctx.scale(zm,zm);
      for(let i=0;i<N;i++){
        const p=stars[i];
        p.r+= sp*(1+p.s*0.45)*(p.z*1.1);
        if(p.r>MAXR){ p.a=Math.random()*Math.PI*2; p.r=Math.random()*(MAXR*0.12); p.z=Math.random()*0.9+0.1; p.s=Math.random()*0.9+0.1; p.c=Math.random()*0.6+0.4; }
        const x=Math.cos(p.a)*p.r, y=Math.sin(p.a)*p.r;
        const backR=p.r - sp*st*(1.4+p.s)*(p.z*1.2);
        const bx=Math.cos(p.a)*backR, by=Math.sin(p.a)*backR;
        const a=Math.min(1,0.15+p.c*0.85);
        ctx.strokeStyle=`rgba(170,225,255,${a})`;
        ctx.lineWidth=Math.max(1, p.s*dpr*(0.65+sp*0.05));
        ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(x,y); ctx.stroke();
      }
      ctx.restore();
      setOverlayOpacity(state.vignette); setFlash(state.flash);
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);

    const tl=gsap.timeline({ paused:true })
      .to(state,{speed:22,streak:1.05,zoom:1.12,duration:1.1,ease:'power3.in'})
      .to(state,{flash:1,duration:0.14,ease:'power1.out'},'<0.78')
      .to(state,{flash:0,duration:0.35,ease:'power2.out'},'>-0.04')
      .to(state,{vignette:0.55,duration:0.6,ease:'sine.out'},'<')
      .to(state,{speed:10,streak:0.9,zoom:1.06,duration:1.3,ease:'power2.out'})
      .eventCallback('onComplete', ()=>onCruise?.());

    gsap.to(state,{speed:0.8,streak:0.6,zoom:1.0,duration:1.0,ease:'power2.out'});

    // Reduced motion handling (can be disabled)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyRM = () => {
      if (respectReducedMotion && mq.matches) {
        tl.pause(0);
        state.speed=0.6; state.streak=0.5; state.zoom=1; state.flash=0; state.vignette=0.35;
        onCruise?.();
      }
    };
    mq.addEventListener?.('change', applyRM);
    applyRM();

    if (autoStart) tl.play(0);

    const onWarp=()=>tl.restart();
    window.addEventListener('stella:warp', onWarp);

    return ()=>{ window.removeEventListener('stella:warp', onWarp); cancelAnimationFrame(raf); ro.disconnect(); tl.kill(); gsap.killTweensOf(state); };
  }, [autoStart, density, respectReducedMotion, onCruise, state]);

  return (
    <div ref={wrapRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      <div ref={overlayRef} className="absolute inset-0" style={{opacity:0.3, background:'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.85) 100%)'}}/>
      <div ref={flashRef} className="absolute inset-0" style={{opacity:0, transform:'scale(1)', background:'radial-gradient(circle at center, rgba(255,255,255,0.85), rgba(160,220,255,0.35) 28%, rgba(255,255,255,0) 60%)', mixBlendMode:'screen'}}/>
    </div>
  );
}
