"use client";

export function Decorations() {
  return (
    <>
      <style jsx>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(12px); }
        }
        @keyframes pulseSoft {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.05); }
        }
        @keyframes lineGrow {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>

      <div className="fixed inset-0 w-full h-screen pointer-events-none z-0" aria-hidden="true">
        {/* Soft brand-soft circle — warm glow in corner */}
        <div className="absolute -top-[10%] -right-[10%] w-64 h-64 rounded-full bg-[#f7e3d5]/40 blur-2xl"
          style={{ animation: "pulseSoft 8s ease-in-out infinite" }} />

        {/* Warm paper circle — secondary glow */}
        <div className="absolute bottom-[10%] left-[-5%] w-48 h-48 rounded-full bg-[#faf3e6]/60 blur-2xl"
          style={{ animation: "pulseSoft 10s ease-in-out infinite" }} />

        {/* Clothing tag rectangles — echoing BrandMark motif */}
        <div className="absolute top-[20%] left-[10%] w-20 h-12 border border-[#c1440e]/30 bg-[#c1440e]/5 rotate-3"
          style={{ animation: "floatUp 7s ease-in-out infinite" }}>
          <div className="absolute top-1 left-1 w-3 h-1 bg-[#c1440e]/40" />
          <div className="absolute top-3 left-1 w-2 h-1 bg-[#c1440e]/40" />
        </div>

        <div className="absolute top-[55%] right-[12%] w-16 h-10 border border-[#c1440e]/25 bg-[#c1440e]/5 -rotate-2"
          style={{ animation: "floatUp 9s ease-in-out infinite" }} />

        {/* Horizontal constructivist lines — like BrandMark tag lines */}
        <div className="absolute top-[35%] left-[60%] w-32 h-[1px] bg-[#8a7a66]/40"
          style={{ animation: "drift 11s ease-in-out infinite alternate" }} />
        <div className="absolute top-[65%] left-[20%] w-28 h-[1px] bg-[#c1440e]/30"
          style={{ animation: "drift 9s ease-in-out infinite alternate" }} />
        <div className="absolute top-[80%] left-[40%] w-24 h-[1px] bg-[#8a7a66]/30"
          style={{ animation: "drift 13s ease-in-out infinite alternate" }} />

        {/* Subtle dots rising */}
        <div className="absolute bottom-[15%] left-[25%] w-2 h-2 rounded-full bg-[#c1440e]/50"
          style={{ animation: "floatUp 6s ease-in-out infinite" }} />
        <div className="absolute bottom-[25%] left-[70%] w-2 h-2 rounded-full bg-[#8a7a66]/40"
          style={{ animation: "floatUp 8s ease-in-out infinite" }} />
        <div className="absolute bottom-[8%] left-[50%] w-2 h-2 rounded-full bg-[#c1440e]/40"
          style={{ animation: "floatUp 10s ease-in-out infinite" }} />

        {/* Warm diagonal line — soft constructivist accent */}
        <div className="absolute top-[40%] left-[-5%] w-[40%] h-[1px] bg-[#c1440e]/20 -skew-y-4"
          style={{ animation: "lineGrow 12s ease-in-out infinite alternate" }} />
      </div>
    </>
  );
}
