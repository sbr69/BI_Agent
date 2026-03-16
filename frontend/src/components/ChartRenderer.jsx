import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, pivotData, formatNumber } from "../utils/chartHelpers";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-light/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
      <p className="text-text-primary font-semibold text-sm mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-medium">{formatNumber(entry.value)}</span>
        </p>
      ))}
    </div>
  );
};

function BarChartComponent({ data, xKey, yKeys, groupBy }) {
  if (groupBy && yKeys.length === 1) {
    const result = pivotData(data, xKey, yKeys[0], groupBy);
    if (result.pivotedData) {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={result.pivotedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {result.groups.map((group, i) => (
              <Bar key={group} dataKey={group} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {yKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartComponent({ data, xKey, yKeys, groupBy }) {
  if (groupBy && yKeys.length === 1) {
    const result = pivotData(data, xKey, yKeys[0], groupBy);
    if (result.pivotedData) {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={result.pivotedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {result.groups.map((group, i) => (
              <Line key={group} type="monotone" dataKey={group} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {yKeys.map((key, i) => (
          <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieChartComponent({ data, xKey, yKeys }) {
  const valueKey = yKeys[0] || Object.keys(data[0] || {}).find((k) => k !== xKey);
  const RADIAN = Math.PI / 180;

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={130} innerRadius={50} label={renderLabel} labelLine={false} animationBegin={0} animationDuration={800}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function AreaChartComponent({ data, xKey, yKeys, groupBy }) {
  if (groupBy && yKeys.length === 1) {
    const result = pivotData(data, xKey, yKeys[0], groupBy);
    if (result.pivotedData) {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={result.pivotedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {result.groups.map((group, i) => (
              <Area key={group} type="monotone" dataKey={group} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {yKeys.map((key, i) => (
          <Area key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ScatterChartComponent({ data, xKey, yKeys }) {
  const yKey = yKeys[0] || Object.keys(data[0] || {}).find((k) => k !== xKey);
  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey={xKey} name={xKey} tick={{ fontSize: 11 }} />
        <YAxis type="number" dataKey={yKey} name={yKey} tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
        <Legend />
        <Scatter name={`${xKey} vs ${yKey}`} data={data} fill={CHART_COLORS[0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

const CHART_MAP = {
  bar: BarChartComponent,
  line: LineChartComponent,
  pie: PieChartComponent,
  area: AreaChartComponent,
  scatter: ScatterChartComponent,
};

export default function ChartRenderer({ chart, index }) {
  const ChartComponent = CHART_MAP[chart.type];

  if (!ChartComponent) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="text-error">Unsupported chart type: {chart.type}</p>
      </div>
    );
  }

  if (!chart.data?.length) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="text-text-muted">No data available for this chart.</p>
      </div>
    );
  }

  return (
    <div
      className="glass rounded-2xl p-5 transition-all duration-300 hover:border-border-light hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-fade-in-up"
      style={{ animationDelay: `${index * 0.15}s` }}
      id={`chart-${index}`}
    >
      {/* Chart Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{chart.title}</h3>
        {chart.description && (
          <p className="text-sm text-text-muted mt-1">{chart.description}</p>
        )}
      </div>

      {/* Chart Body */}
      <ChartComponent
        data={chart.data}
        xKey={chart.xKey}
        yKeys={chart.yKeys}
        groupBy={chart.groupBy}
      />

      {/* Chart Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span>{chart.data.length} data points</span>
        <span className="capitalize">{chart.type} chart</span>
      </div>
    </div>
  );
}
