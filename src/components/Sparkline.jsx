import React from 'react';

const Sparkline = ({ data = [], width = 120, height = 44, stroke = '#fff', fill = 'rgba(255,255,255,0.08)' }) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const px = (i) => (i / (data.length - 1)) * width;
  const py = (v) => height - ((v - min) / range) * height;

  const points = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');

  // Build a smooth-ish path using simple polyline for small sparklines
  const pathD = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');

  // Area path for subtle fill
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={areaD} fill={fill} stroke="none" />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Sparkline;
