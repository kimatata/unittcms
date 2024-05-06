import React from "react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { testTypes } from "@/config/selection";
import { CaseTypeCountType } from "@/types/case";
import { HomeMessages } from "./page";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  typesCounts: CaseTypeCountType[];
  messages: HomeMessages;
};

export default function TestTypesDonutChart({ typesCounts, messages }: Props) {
  const [chartData, setChartData] = useState({
    series: [],
    options: {
      labels: [],
      colors: [],
    },
  });

  useEffect(() => {
    const updateChartDate = () => {
      if (typesCounts) {
        const series = testTypes.map((entry, index) => {
          const found = typesCounts.find((itr) => itr.type === index);
          return found ? found.count : 0;
        });

        const labels = testTypes.map((entry) => messages[entry.uid]);
        const colors = testTypes.map((entry) => entry.chartColor);

        setChartData({
          series,
          options: { labels, colors },
        });
      }
    };

    updateChartDate();
  }, [typesCounts]);

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
