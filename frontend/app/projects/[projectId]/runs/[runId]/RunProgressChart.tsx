import React from "react";
import { useState } from "react";
import Chart from "react-apexcharts";

// type Props = {
//   projectId: string;
// };

const testCases = [
  { name: "Passed", value: 12, color: "#17c964" },
  { name: "Failed", value: 3, color: "#f31260" },
  { name: "Skipped", value: 14, color: "#71717a" },
  { name: "Untested", value: 32, color: "#d4d4d8" },
];

// export default function RunProgressChart({ projectId }: Props) {
export default function RunProgressChart() {
  const [chartData, setChartData] = useState({
    series: testCases.map((entry) => {
      return {
        name: entry.name,
        data: [entry.value],
      };
    }),
    options: {
      chart: {
        type: "bar",
        height: 100,
        stacked: true,
        stackType: "100%",
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
        },
      },
      colors: testCases.map((entry) => {
        return entry.color;
      }),
      legend: {
        show: false,
      },
      yaxis: {
        show: false,
      },
      xaxis: {
        labels: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      grid: {
        show: false,
        padding: {
          top: -20,
          bottom: -20,
          left: -20,
        },
      },
    },
  });
  return (
    <div>
      <h1>Progress</h1>
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="bar"
        width={500}
        height={100}
      />
    </div>
  );
}
