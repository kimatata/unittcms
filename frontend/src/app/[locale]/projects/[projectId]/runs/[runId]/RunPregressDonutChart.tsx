import React from 'react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { testRunCaseStatus } from '@/config/selection';
import { RunStatusCountType } from '@/types/run';
import { TestRunCaseStatusMessages } from '@/types/status';
import { ChartDataType } from '@/types/chart';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type Props = {
  statusCounts: RunStatusCountType[];
  testRunCaseStatusMessages: TestRunCaseStatusMessages;
  theme: string | undefined;
};

export default function RunProgressDounut({ statusCounts, testRunCaseStatusMessages, theme }: Props) {
  const [chartData, setChartData] = useState<ChartDataType>({
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

        const labels = testRunCaseStatus.map((entry) => testRunCaseStatusMessages[entry.uid]);
        const colors = testRunCaseStatus.map((entry) => entry.chartColor);
        const legend = {
          labels: {
            colors: testRunCaseStatus.map((entry) => {
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
  }, [statusCounts, theme]);

  return <Chart options={chartData.options} series={chartData.series} type="donut" width={'100%'} height={'100%'} />;
}
