import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

export type DataPoint = {
  date: string;   // ISO date string
  value: number;
};

type Props = {
  data: DataPoint[];
  label?: string;
  unit?: string;
  height?: number;
  color?: string;
};

export default function TrendChart({
  data,
  label = 'Trend',
  unit = '',
  height = 180,
  color = '#4A90D9',
}: Props) {
  const WIDTH = 320;
  const PAD_L = 44;
  const PAD_R = 12;
  const PAD_T = 16;
  const PAD_B = 32;
  const chartW = WIDTH - PAD_L - PAD_R;
  const chartH = height - PAD_T - PAD_B;

  const { points, yMin, yMax, yTicks, xLabels } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], yMin: 0, yMax: 100, yTicks: [0, 50, 100], xLabels: [] };
    }

    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const values = sorted.map((d) => d.value);
    let rawMin = Math.min(...values);
    let rawMax = Math.max(...values);

    // Pad range by 10%
    const range = rawMax - rawMin || 1;
    rawMin = Math.max(0, rawMin - range * 0.1);
    rawMax = rawMax + range * 0.1;

    // Round to nice tick values
    const step = niceStep(rawMax - rawMin, 4);
    const ymin = Math.floor(rawMin / step) * step;
    const ymax = Math.ceil(rawMax / step) * step;

    const ticks: number[] = [];
    for (let v = ymin; v <= ymax; v += step) {
      ticks.push(Math.round(v * 100) / 100);
    }

    const minTs = new Date(sorted[0].date).getTime();
    const maxTs = new Date(sorted[sorted.length - 1].date).getTime();
    const tsRange = maxTs - minTs || 1;

    const pts = sorted.map((d) => ({
      x: PAD_L + ((new Date(d.date).getTime() - minTs) / tsRange) * chartW,
      y: PAD_T + chartH - ((d.value - ymin) / (ymax - ymin || 1)) * chartH,
      raw: d,
    }));

    // X-axis labels: first & last date
    const labels = [
      { x: PAD_L, text: shortDate(sorted[0].date) },
      { x: PAD_L + chartW, text: shortDate(sorted[sorted.length - 1].date) },
    ];

    return { points: pts, yMin: ymin, yMax: ymax, yTicks: ticks, xLabels: labels };
  }, [data, chartW, chartH]);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  // Build path d string
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  // Gradient fill path (area under from line to bottom)
  const fillD =
    pathD +
    ` L${points[points.length - 1].x.toFixed(1)},${PAD_T + chartH}` +
    ` L${points[0].x.toFixed(1)},${PAD_T + chartH} Z`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Svg width={WIDTH} height={height} viewBox={`0 0 ${WIDTH} ${height}`}>
        {/* Y-axis gridlines + labels */}
        {yTicks.map((v) => {
          const y = PAD_T + chartH - ((v - yMin) / (yMax - yMin || 1)) * chartH;
          return (
            <React.Fragment key={v}>
              <Line
                x1={PAD_L}
                x2={PAD_L + chartW}
                y1={y}
                y2={y}
                stroke="#E8E8E8"
                strokeWidth={1}
              />
              <SvgText
                x={PAD_L - 6}
                y={y + 4}
                fontSize={10}
                fill="#999"
                textAnchor="end"
              >
                {v % 1 === 0 ? v : v.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <SvgText
            key={i}
            x={l.x}
            y={PAD_T + chartH + 18}
            fontSize={10}
            fill="#999"
            textAnchor={i === 0 ? 'start' : 'end'}
          >
            {l.text}
          </SvgText>
        ))}

        {/* Fill area */}
        <Path d={fillD} fill={color} opacity={0.08} />

        {/* Line */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
        ))}
      </Svg>
      {unit && <Text style={styles.unitLabel}>{unit}</Text>}
    </View>
  );
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function niceStep(range: number, targetTicks: number): number {
  const rough = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  let nice: number;
  if (residual <= 1.5) nice = 1;
  else if (residual <= 3) nice = 2;
  else if (residual <= 7) nice = 5;
  else nice = 10;
  return nice * mag;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  unitLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { color: '#999', fontSize: 14 },
});
