import React from "react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Button, Tooltip } from "@nextui-org/react";
import { RotateCw } from "lucide-react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const testCases = [
  { name: "Passed", value: 12, color: "#059669" },
  { name: "Failed", value: 3, color: "#f87171" },
  { name: "Retest", value: 4, color: "#fbbf24" },
  { name: "Skipped", value: 14, color: "#4b5563" },
  { name: "Untested", value: 32, color: "#e5e7eb" },
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
    <div className="w-96 h-72">
      <div className="flex items-center">
        <h4 className="font-bold">Progress</h4>
        <Tooltip content="Refresh">
          <Button
            isIconOnly
            size="sm"
            className="rounded-full bg-transparent ms-1"
            onPress={() => console.log("refresh")}
          >
            <RotateCw size={16} />
          </Button>
        </Tooltip>
      </div>

      <Chart
        options={chartData.options}
        series={chartData.series}
        type="donut"
        width={"100%"}
        height={"100%"}
      />
    </div>
  );
}
