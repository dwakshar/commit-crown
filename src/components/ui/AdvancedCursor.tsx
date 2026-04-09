"use client";

import { useEffect, useRef, useState } from "react";

type CursorVariant = "default" | "interactive" | "text";

function getCursorVariant(target: EventTarget | null): CursorVariant {
  if (!(target instanceof Element)) {
    return "default";
  }

  if (
    target.closest(
      'input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]'
    )
  ) {
    return "text";
  }

  if (
    target.closest(
      'a, button, [role="button"], label[for], select, summary, [data-cursor="interactive"]'
    )
  ) {
    return "interactive";
  }

  return "default";
}

export function AdvancedCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const dotTrailRef = useRef({ x: 0, y: 0 });
  const pressedRef = useRef(false);
  const variantRef = useRef<CursorVariant>("default");
  const hasPositionRef = useRef(false);

  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>("default");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mediaQuery.matches) {
      return;
    }

    document.body.classList.add("has-advanced-cursor");

    const animate = () => {
      const cursor = cursorRef.current;
      const aura = auraRef.current;

      if (cursor && aura) {
        const target = targetRef.current;
        const current = currentRef.current;
        const dotTrail = dotTrailRef.current;

        current.x += (target.x - current.x) * 0.14;
        current.y += (target.y - current.y) * 0.14;
        dotTrail.x += (target.x - dotTrail.x) * 0.28;
        dotTrail.y += (target.y - dotTrail.y) * 0.28;

        const dx = target.x - dotTrail.x;
        const dy = target.y - dotTrail.y;
        const speed = Math.min(Math.hypot(dx, dy), 18);
        const activeVariant = variantRef.current;
        const isPressed = pressedRef.current;
        const dotScale = isPressed
          ? 0.82
          : activeVariant === "interactive"
          ? 1.65
          : activeVariant === "text"
          ? 0.72
          : 1;
        const auraScale = isPressed
          ? 0.9
          : activeVariant === "interactive"
          ? 1.45
          : activeVariant === "text"
          ? 0.78
          : 1;
        const auraOpacity = activeVariant === "interactive" ? 1 : 0.82;
        const pulseScale = 1 + speed / 60;

        cursor.style.transform = `translate3d(${dotTrail.x}px, ${dotTrail.y}px, 0) translate(-50%, -50%) scale(${dotScale})`;
        aura.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%) scale(${auraScale * pulseScale})`;
        aura.style.opacity = `${auraOpacity}`;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    const handleMove = (event: MouseEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      hasPositionRef.current = true;

      setVisible((wasVisible) => {
        if (!wasVisible) {
          currentRef.current = { x: event.clientX, y: event.clientY };
          dotTrailRef.current = { x: event.clientX, y: event.clientY };
        }

        return true;
      });

      setVariant(getCursorVariant(event.target));
    };

    const handlePointerLeave = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        hasPositionRef.current = false;
        pressedRef.current = false;
        setVisible(false);
        setPressed(false);
      }
    };

    const handlePointerEnter = () => {
      if (hasPositionRef.current) {
        setVisible(true);
      }
    };

    const handleDown = () => {
      pressedRef.current = true;
      setPressed(true);
    };
    const handleUp = () => {
      pressedRef.current = false;
      setPressed(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);
    document.addEventListener("mouseout", handlePointerLeave);
    document.addEventListener("mouseover", handlePointerEnter);

    return () => {
      document.body.classList.remove("has-advanced-cursor");
      hasPositionRef.current = false;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mouseout", handlePointerLeave);
      document.removeEventListener("mouseover", handlePointerEnter);
    };
  }, []);

  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  return (
    <div
      aria-hidden="true"
      className={`advanced-cursor-layer ${visible ? "is-visible" : ""} ${
        pressed ? "is-pressed" : ""
      }`}>
      <div
        ref={auraRef}
        className={`advanced-cursor-aura advanced-cursor-aura-${variant}`}
      />
      <div
        ref={cursorRef}
        className={`advanced-cursor-core advanced-cursor-core-${variant}`}>
        <span className="advanced-cursor-spark" />
      </div>
    </div>
  );
}
