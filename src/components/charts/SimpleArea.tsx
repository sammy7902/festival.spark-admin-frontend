/**
 * Simple Area Chart Component
 * Lightweight chart without gradients
 */

interface DataPoint {
  date: string;
  value: number;
}

interface SimpleAreaProps {
  data: DataPoint[];
  height?: number;
}

export const SimpleArea = ({ data, height = 200 }: SimpleAreaProps) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400"
        style={{ height: `${height}px` }}
      >
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);

  const padding = 40;
  const chartWidth = 600;
  const chartHeight = height - padding * 2;

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    const y =
      padding +
      chartHeight -
      ((point.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    return { x, y, value: point.value };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={height} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + chartHeight - ratio * chartHeight;
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          );
        })}

        {/* Area */}
        <path d={areaPath} fill="#f3f4f6" stroke="none" />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#374151"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="#374151"
            className="hover:r-6 transition-all"
          />
        ))}

        {/* Labels */}
        {points.map((point, index) => {
          if (index % Math.ceil(data.length / 5) !== 0 && index !== data.length - 1) {
            return null;
          }
          const date = new Date(point.value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          return (
            <text
              key={index}
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {date}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

