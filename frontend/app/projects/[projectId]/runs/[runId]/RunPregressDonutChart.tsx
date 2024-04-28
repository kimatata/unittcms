import React from "react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { testRunCaseStatus } from "@/config/selection";
import { RunStatusCountType } from "@/types/run";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  statusCounts: RunStatusCountType[];
};

export default function RunProgressDounut({ statusCounts }: Props) {
  const [chartData, setChartData] = useState({
    series: [],
    options: {
      labels: [],
      colors: [],
    },
  });

  useEffect(() => {
    const updateChartDate = () => {
      if (statusCounts) {
        const series = testRunCaseStatus.map((entry, index) => {
          const found = statusCounts.find((itr) => itr.status === index);
          return found ? found.count : 0;
        });

        const labels = testRunCaseStatus.map((entry) => entry.name);
        const colors = testRunCaseStatus.map((entry) => entry.chartColor);

        setChartData({
          series,
          options: { labels, colors },
        });
      }
    };

    updateChartDate();
  }, [statusCounts]);

  return (
    <Chart
      options={chartData.options}
      series={chartData.series}
      type="donut"
      width={"100%"}
      height={"100%"}
    />
  );
}
