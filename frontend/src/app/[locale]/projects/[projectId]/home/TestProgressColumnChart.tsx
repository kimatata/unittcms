import React from "react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ProgressSeriesType } from "@/types/run";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  progressSeries: ProgressSeriesType[];
  progressCategories: string[];
};

export default function TestProgressBarChart({
  progressSeries,
  progressCategories,
}: Props) {
  const [chartData, setChartData] = useState({
    series: [],
    options: {
      labels: [],
      colors: [],
    },
  });

  useEffect(() => {
    const updateChartDate = () => {
      if (progressSeries) {
        setChartData({
          series: progressSeries,
          options: {
            chart: {
              toolbar: {
                show: false,
              },
              stacked: true,
            },
            legend: {
              position: "right",
            },
            xaxis: {
              type: "datetime",
              categories: progressCategories,
            },
          },
        });
      }
    };

    updateChartDate();
  }, [progressSeries, progressCategories]);

  return (
    <Chart
      options={chartData.options}
      series={chartData.series}
      type="bar"
      width={"100%"}
      height={"100%"}
    />
  );
}
