import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Ellipse, Rect, Path, Circle } from 'react-native-svg';
import { useColors } from '../contexts/ThemeContext';

/* ── Palette ────────────────────────────────────────────────── */
const CLR = {
  inactive: '#E0D8CF',
  primary: '#E8443A',
  secondary: '#F5A623',
  body: '#CFC6BC',
  stroke: '#B8B0A6',
};

/* ── Shape primitives ───────────────────────────────────────── */
type Shape =
  | { t: 'e'; cx: number; cy: number; rx: number; ry: number }
  | { t: 'r'; x: number; y: number; w: number; h: number; rx?: number }
  | { t: 'c'; cx: number; cy: number; r: number }
  | { t: 'p'; d: string };

type Region = { id: string; shapes: Shape[] };

function draw(s: Shape, fill: string, stroke: string, key: string) {
  const sw = 0.5;
  switch (s.t) {
    case 'e':
      return <Ellipse key={key} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case 'r':
      return <Rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case 'c':
      return <Circle key={key} cx={s.cx} cy={s.cy} r={s.r} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case 'p':
      return <Path key={key} d={s.d} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
}

/* ════════════════════════════════════════════════════════════
 *  FRONT VIEW   (centred at x = 70)
 * ════════════════════════════════════════════════════════════ */

const FRONT_STATIC: Shape[] = [
  // Head
  { t: 'e', cx: 70, cy: 18, rx: 12, ry: 14 },
  // Neck
  { t: 'r', x: 64, y: 32, w: 12, h: 10, rx: 3 },
  // Clavicle / shoulder bridge
  { t: 'r', x: 28, y: 42, w: 84, h: 10, rx: 4 },
  // Left forearm
  { t: 'r', x: 17, y: 100, w: 11, h: 56, rx: 4 },
  // Right forearm
  { t: 'r', x: 112, y: 100, w: 11, h: 56, rx: 4 },
  // Left hand
  { t: 'e', cx: 22, cy: 160, rx: 4, ry: 5 },
  // Right hand
  { t: 'e', cx: 118, cy: 160, rx: 4, ry: 5 },
  // Hip bridge
  { t: 'r', x: 44, y: 138, w: 52, h: 16, rx: 6 },
  // Left knee
  { t: 'r', x: 44, y: 234, w: 16, h: 14, rx: 6 },
  // Right knee
  { t: 'r', x: 80, y: 234, w: 16, h: 14, rx: 6 },
  // Left foot
  { t: 'r', x: 42, y: 294, w: 14, h: 10, rx: 4 },
  // Right foot
  { t: 'r', x: 84, y: 294, w: 14, h: 10, rx: 4 },
];

const FRONT_MUSCLES: Region[] = [
  {
    id: 'shoulders_side',
    shapes: [
      { t: 'e', cx: 30, cy: 50, rx: 6, ry: 8 },
      { t: 'e', cx: 110, cy: 50, rx: 6, ry: 8 },
    ],
  },
  {
    id: 'shoulders_front',
    shapes: [
      { t: 'e', cx: 40, cy: 48, rx: 8, ry: 6 },
      { t: 'e', cx: 100, cy: 48, rx: 8, ry: 6 },
    ],
  },
  {
    id: 'chest',
    shapes: [
      { t: 'p', d: 'M42,52 Q40,58 40,66 Q40,78 54,80 L70,80 L70,52 Z' },
      { t: 'p', d: 'M98,52 Q100,58 100,66 Q100,78 86,80 L70,80 L70,52 Z' },
    ],
  },
  {
    id: 'biceps',
    shapes: [
      { t: 'e', cx: 24, cy: 78, rx: 6, ry: 22 },
      { t: 'e', cx: 116, cy: 78, rx: 6, ry: 22 },
    ],
  },
  {
    id: 'core',
    shapes: [{ t: 'r', x: 48, y: 82, w: 44, h: 56, rx: 6 }],
  },
  {
    id: 'quads',
    shapes: [
      { t: 'p', d: 'M44,154 L68,154 Q69,196 65,234 L47,234 Q43,196 44,154 Z' },
      { t: 'p', d: 'M72,154 L96,154 Q97,196 93,234 L75,234 Q71,196 72,154 Z' },
    ],
  },
  {
    id: 'tibialis',
    shapes: [
      { t: 'e', cx: 53, cy: 268, rx: 6, ry: 24 },
      { t: 'e', cx: 87, cy: 268, rx: 6, ry: 24 },
    ],
  },
];

/* ════════════════════════════════════════════════════════════
 *  BACK VIEW   (centred at x = 210)
 * ════════════════════════════════════════════════════════════ */

const BACK_STATIC: Shape[] = [
  // Head
  { t: 'e', cx: 210, cy: 18, rx: 12, ry: 14 },
  // Neck
  { t: 'r', x: 204, y: 32, w: 12, h: 10, rx: 3 },
  // Shoulder bridge
  { t: 'r', x: 168, y: 42, w: 84, h: 10, rx: 4 },
  // Left forearm
  { t: 'r', x: 157, y: 100, w: 11, h: 56, rx: 4 },
  // Right forearm
  { t: 'r', x: 252, y: 100, w: 11, h: 56, rx: 4 },
  // Left hand
  { t: 'e', cx: 162, cy: 160, rx: 4, ry: 5 },
  // Right hand
  { t: 'e', cx: 258, cy: 160, rx: 4, ry: 5 },
  // Hip bridge
  { t: 'r', x: 184, y: 138, w: 52, h: 16, rx: 6 },
  // Left knee
  { t: 'r', x: 184, y: 234, w: 16, h: 14, rx: 6 },
  // Right knee
  { t: 'r', x: 220, y: 234, w: 16, h: 14, rx: 6 },
  // Left foot
  { t: 'r', x: 182, y: 294, w: 14, h: 10, rx: 4 },
  // Right foot
  { t: 'r', x: 224, y: 294, w: 14, h: 10, rx: 4 },
];

const BACK_MUSCLES: Region[] = [
  {
    id: 'traps',
    shapes: [
      { t: 'p', d: 'M196,42 L210,34 L224,42 L228,58 L192,58 Z' },
    ],
  },
  {
    id: 'rear_delt',
    shapes: [
      { t: 'e', cx: 172, cy: 50, rx: 6, ry: 8 },
      { t: 'e', cx: 248, cy: 50, rx: 6, ry: 8 },
    ],
  },
  {
    id: 'mid_back',
    shapes: [{ t: 'r', x: 197, y: 56, w: 26, h: 34, rx: 4 }],
  },
  {
    id: 'lats',
    shapes: [
      { t: 'p', d: 'M180,56 L197,56 L194,100 L178,90 Z' },
      { t: 'p', d: 'M223,56 L240,56 L242,90 L226,100 Z' },
    ],
  },
  {
    id: 'lower_back',
    shapes: [{ t: 'r', x: 199, y: 92, w: 22, h: 40, rx: 4 }],
  },
  {
    id: 'triceps',
    shapes: [
      { t: 'e', cx: 164, cy: 78, rx: 6, ry: 22 },
      { t: 'e', cx: 256, cy: 78, rx: 6, ry: 22 },
    ],
  },
  {
    id: 'glutes',
    shapes: [
      { t: 'e', cx: 198, cy: 150, rx: 11, ry: 12 },
      { t: 'e', cx: 222, cy: 150, rx: 11, ry: 12 },
    ],
  },
  {
    id: 'hamstrings',
    shapes: [
      { t: 'p', d: 'M184,164 L208,164 Q209,200 205,234 L187,234 Q183,200 184,164 Z' },
      { t: 'p', d: 'M212,164 L236,164 Q237,200 233,234 L215,234 Q211,200 212,164 Z' },
    ],
  },
  {
    id: 'calves',
    shapes: [
      { t: 'e', cx: 193, cy: 268, rx: 7, ry: 24 },
      { t: 'e', cx: 227, cy: 268, rx: 7, ry: 24 },
    ],
  },
];

/* ── Component ──────────────────────────────────────────────── */
type Props = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

export default function MuscleMap({ primaryMuscles, secondaryMuscles }: Props) {
  const c = useColors();
  const fill = (id: string) => {
    if (primaryMuscles.includes(id)) return CLR.primary;
    if (secondaryMuscles.includes(id)) return CLR.secondary;
    return CLR.inactive;
  };

  return (
    <View style={st.wrap}>
      <View style={st.labelRow}>
        <Text style={[st.label, { color: c.textSecondary }]}>FRONT</Text>
        <Text style={[st.label, { color: c.textSecondary }]}>BACK</Text>
      </View>

      <Svg viewBox="0 0 280 310" style={st.svg}>
        {/* ── Front body ── */}
        {FRONT_STATIC.map((s, i) => draw(s, CLR.body, CLR.stroke, `fs${i}`))}
        {FRONT_MUSCLES.map((r) =>
          r.shapes.map((s, i) => draw(s, fill(r.id), CLR.stroke, `fm_${r.id}_${i}`)),
        )}

        {/* ── Back body ── */}
        {BACK_STATIC.map((s, i) => draw(s, CLR.body, CLR.stroke, `bs${i}`))}
        {BACK_MUSCLES.map((r) =>
          r.shapes.map((s, i) => draw(s, fill(r.id), CLR.stroke, `bm_${r.id}_${i}`)),
        )}
      </Svg>

      {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
        <View style={st.legend}>
          {primaryMuscles.length > 0 && (
            <View style={st.legendItem}>
              <View style={[st.dot, { backgroundColor: CLR.primary }]} />
              <Text style={[st.legendText, { color: c.textSecondary }]}>Primary</Text>
            </View>
          )}
          {secondaryMuscles.length > 0 && (
            <View style={st.legendItem}>
              <View style={[st.dot, { backgroundColor: CLR.secondary }]} />
              <Text style={[st.legendText, { color: c.textSecondary }]}>Secondary</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 4 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1.2,
  },
  svg: { width: '100%', aspectRatio: 280 / 310 },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#777' },
});
