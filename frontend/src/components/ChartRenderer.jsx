import React, { useState, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, pivotData, formatNumber } from "../utils/chartHelpers";
import {
  Download, Maximize2, X, BarChart3, LineChart as LineIcon,
  PieChart as PieIcon, AreaChart as AreaIcon, ScatterChart as ScatterIcon,
} from "lucide-react";
import { exportChartCSV } from "../utils/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg p-3 shadow-lg">
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

const CHART_TYPE_OPTIONS = [
  { type: "bar", icon: BarChart3, label: "Bar" },
  { type: "line", icon: LineIcon, label: "Line" },
  { type: "pie", icon: PieIcon, label: "Pie" },
  { type: "area", icon: AreaIcon, label: "Area" },
  { type: "scatter", icon: ScatterIcon, label: "Scatter" },
];

export default function ChartRenderer({ chart, index = 0, onTypeChange }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [overrideType, setOverrideType] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportPDF, setExportPDF] = useState(false);

  const activeType = overrideType || chart.type;
  const ChartComponent = CHART_MAP[activeType];
  
  const chartRef = useRef(null);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await exportChartCSV(chart.data, chart.title || "chart_export");
    } catch { /* ignore */ }
    setExporting(false);
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    setExportPDF(true);
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.text(chart.title || "Chart Export", 10, 10);
      pdf.addImage(imgData, "PNG", 10, 20, pdfWidth - 20, pdfHeight - 20);
      pdf.save(`${chart.title || "chart_export"}.pdf`);
    } catch { /* ignore */ }
    setExportPDF(false);
  };

  const handleTypeChange = (newType) => {
    setOverrideType(newType);
    if (onTypeChange) onTypeChange(newType);
  };

  if (!ChartComponent) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="text-error">Unsupported chart type: {activeType}</p>
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

  const chartContent = (
    <div ref={chartRef} className="bg-white p-2 w-full h-full">
      <ChartComponent
        data={chart.data}
        xKey={chart.xKey}
        yKeys={chart.yKeys}
        groupBy={chart.groupBy}
      />
      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span>{chart.data.length} data points</span>
        <span className="capitalize">{activeType} chart</span>
      </div>
    </div>
  );

  // Toolbar with chart type switcher, export, fullscreen
  const toolbar = (
    <div className="flex items-center gap-1 mb-3">
      {/* Chart type switcher */}
      <div className="flex items-center gap-0.5 bg-surface-light rounded-lg p-0.5 mr-2">
        {CHART_TYPE_OPTIONS.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            title={label}
            className={`p-1.5 rounded-md transition-colors ${
              activeType === type
                ? "bg-white shadow text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
      {/* Export CSV */}
      <button
        onClick={handleExportCSV}
        disabled={exporting}
        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-text-muted hover:text-text-secondary hover:bg-surface-light transition-colors disabled:opacity-50"
        title="Download CSV"
      >
        <Download size={13} />
        <span className="hidden sm:inline">CSV</span>
      </button>
      <button
        onClick={handleExportPDF}
        disabled={exportPDF}
        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-text-muted hover:text-text-secondary hover:bg-surface-light transition-colors disabled:opacity-50"
        title="Download PDF"
      >
        <Download size={13} />
        <span className="hidden sm:inline">PDF</span>
      </button>
      {/* Fullscreen */}
      <button
        onClick={() => setFullscreen(true)}
        className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-light transition-colors"
        title="Fullscreen"
      >
        <Maximize2 size={13} />
      </button>
    </div>
  );

  return (
    <>
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: `${index * 0.15}s` }}
        id={`chart-${index}`}
      >
        {toolbar}
        {chartContent}
      </div>

      {/* Fullscreen Modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-8 animate-fade-in" onClick={() => setFullscreen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-auto p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold text-text-primary mb-1">{chart.title}</h2>
            {chart.description && <p className="text-sm text-text-muted mb-4">{chart.description}</p>}
            <div style={{ height: "60vh" }}>
              <ChartComponent
                data={chart.data}
                xKey={chart.xKey}
                yKeys={chart.yKeys}
                groupBy={chart.groupBy}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
