import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Ellipse, Path } from 'react-native-svg';

export type StumpProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  position: 'top' | 'bottom';
  seed: number; // 0..1
  tipHeight?: number; // px
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function Stump({ x, y, width, height, position, seed, tipHeight = 40 }: StumpProps) {
  const w = Math.max(2, Math.floor(width));
  const h = Math.max(2, Math.floor(height));
  const capH = Math.min(tipHeight, Math.max(18, Math.floor(Math.min(42, h * 0.5))));
  const r = Math.min(34, Math.floor(w * 0.48));

  // Deterministic small variations
  const knotChance = seed > 0.35 ? 1 : 0; // roughly 65%
  const knotY = clamp(
    position === 'top' ? h - capH - 14 - Math.floor((seed * 97) % (h * 0.5)) : 14 + Math.floor((seed * 113) % (h * 0.5)),
    10,
    h - capH - 10
  );
  const knotX = clamp(8 + Math.floor(((seed * 31) % 1) * (w - 18)), 8, w - 10);
  const groove1 = clamp(10 + Math.floor(((seed * 3.1) % 1) * (w - 26)), 8, w - 18);
  const groove2 = clamp(8 + Math.floor(((seed * 7.7) % 1) * (w - 22)), 6, w - 16);

  // Cap position (ellipse center)
  const capCy = position === 'top' ? h - capH / 2 : capH / 2;

  // Bark body path with square corners on the screen-attached side
  const bodyPath = (() => {
    if (position === 'top') {
      // square at top, rounded at bottom
      return [
        `M0,0 H${w} V${h - r}`,
        `Q${w},${h} ${w - r},${h}`,
        `H${r}`,
        `Q0,${h} 0,${h - r} Z`,
      ].join(' ');
    }
    // position === 'bottom' → rounded at top, square at bottom
    return [
      `M0,${r}`,
      `Q0,0 ${r},0`,
      `H${w - r}`,
      `Q${w},0 ${w},${r}`,
      `V${h} H0 Z`,
    ].join(' ');
  })();

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <SvgLinearGradient id="bark" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#5e3b1a" />
            <Stop offset="0.5" stopColor="#82552a" />
            <Stop offset="1" stopColor="#a06e3b" />
          </SvgLinearGradient>
          <SvgLinearGradient id="edgeShade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity="0.0" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.12" />
          </SvgLinearGradient>
        </Defs>
        {/* Bark body with per-side rounding */}
        <Path d={bodyPath} fill="url(#bark)" />
        {/* Side highlight/shadow */}
        <Rect x={4} y={position === 'top' ? 0 : capH} width={5} height={h - (position === 'top' ? 0 : capH)} fill="rgba(255,255,255,0.08)" rx={6} />
        <Rect x={w - 11} y={position === 'top' ? 0 : capH} width={7} height={h - (position === 'top' ? 0 : capH)} fill="rgba(0,0,0,0.22)" rx={6} />
        {/* Grooves */}
        <Rect x={groove1} y={position === 'top' ? 0 : capH} width={3} height={h - (position === 'top' ? 0 : capH)} fill="rgba(0,0,0,0.18)" rx={2} />
        <Rect x={groove2} y={position === 'top' ? 0 : capH} width={2} height={h - (position === 'top' ? 0 : capH)} fill="rgba(255,255,255,0.06)" rx={2} />
        {/* Knot */}
        {knotChance ? (
          <Ellipse cx={knotX} cy={knotY} rx={position === 'top' ? 6 : 7} ry={position === 'top' ? 6 : 7} fill="#6b4426" stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
        ) : null}
        {/* Cap outer rim (oval) */}
        <Ellipse cx={w / 2} cy={capCy} rx={(w - 2) / 2} ry={capH / 2} fill="#cda778" />
        {/* Cap inner fill */}
        <Ellipse cx={w / 2} cy={capCy} rx={(w - 12) / 2} ry={(capH - 10) / 2} fill="#ead7bf" />
        {/* Removed thin wide oval highlight as requested */}
        {/* Cap rings */}
        <Ellipse cx={w / 2} cy={capCy} rx={(w - 28) / 2} ry={(capH - 18) / 2} fill="none" stroke="rgba(139,92,53,0.22)" strokeWidth={1} />
        <Ellipse cx={w / 2} cy={capCy} rx={(w - 42) / 2} ry={(capH - 24) / 2} fill="none" stroke="rgba(139,92,53,0.16)" strokeWidth={1} />
        {/* Removed dark edge shading on the rounded end */}
      </Svg>
    </View>
  );
}

export default React.memo(Stump);


