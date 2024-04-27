import React from "react";
import { useState } from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const testCases = [
  { name: "Passed", value: 12, color: "#17c964" },
  { name: "Failed", value: 3, color: "#f31260" },
  { name: "Skipped", value: 14, color: "#71717a" },
  { name: "Untested", value: 32, color: "#d4d4d8" },
];

export default function RunProgressDounut() {
  const [chartData, setChartData] = useState({
    series: testCases.map((entry) => {
      return entry.value;
    }),
    options: {
      labels: testCases.map((entry) => {
        return entry.name;
      }),
      colors: testCases.map((entry) => {
        return entry.color;
      }),
    },
  });
  return (
    <div>
      <h1>Progress</h1>
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="donut"
        width={400}
        height={400}
      />
    </div>
  );
}
