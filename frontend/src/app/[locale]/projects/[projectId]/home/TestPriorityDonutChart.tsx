import React from 'react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { priorities } from '@/config/selection';
import { CasePriorityCountType } from '@/types/case';
import { HomeMessages } from './page';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type Props = {
  priorityCounts: CasePriorityCountType[];
  messages: HomeMessages;
  theme: string;
};

export default function TestPriorityDonutChart({ priorityCounts, messages, theme }: Props) {
  const [chartData, setChartData] = useState({
    series: [],
    options: {
      labels: [],
      colors: [],
    },
  });

  useEffect(() => {
    const updateChartDate = () => {
      if (priorityCounts) {
        const series = priorities.map((entry, index) => {
          const found = priorityCounts.find((itr) => itr.priority === index);
          return found ? found.count : 0;
        });

        const labels = priorities.map((entry) => messages[entry.uid]);
        const colors = priorities.map((entry) => entry.chartColor);
        const legend = {
          labels: {
            colors: priorities.map((entry) => {
              if (theme === 'light') {
                return 'black';
              } else {
                return 'white';
              }
            }),
          },
        };

        setChartData({
          series,
          options: { labels, colors, legend },
        });
      }
    };

    updateChartDate();
  }, [priorityCounts, theme]);

  return <Chart options={chartData.options} series={chartData.series} type="donut" width={'100%'} height={'100%'} />;
}
