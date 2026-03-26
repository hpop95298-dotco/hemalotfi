import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current!;
    const follower = followerRef.current!;


    gsap.set([cursor, follower], {
      xPercent: -50,
      yPercent: -50,
    });

    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.08,
        ease: "power3.out",
      });

      gsap.to(follower, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.35,
        ease: "power3.out",
      });
    };

    const handleMouseDown = () => {
      gsap.to([cursor, follower], {
        scale: 0.6,
        duration: 0.15,
      });
    };

    const handleMouseUp = () => {
      gsap.to([cursor, follower], {
        scale: 1,
        duration: 0.15,
      });
    };

   
    const addHoverEffect = () => {
      gsap.to(follower, {
        scale: 1.8,
        borderColor: "#00ffff",
        duration: 0.2,
      });
    };

    const removeHoverEffect = () => {
      gsap.to(follower, {
        scale: 1,
        borderColor: "rgba(255,255,255,0.4)",
        duration: 0.2,
      });
    };

    const hoverElements = document.querySelectorAll(
      "a, button, .cursor-hover"
    );

    hoverElements.forEach((el) => {
      el.addEventListener("mouseenter", addHoverEffect);
      el.addEventListener("mouseleave", removeHoverEffect);
    });

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full pointer-events-none z-[9999] mix-blend-difference shadow-[0_0_10px_#00ffff]"
      />

      {/* Circle */}
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-10 h-10 border border-white/40 rounded-full pointer-events-none z-[9998] mix-blend-difference transition-colors duration-200"
      />
    </>
  );
}