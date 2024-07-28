import React from 'react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { testTypes } from '@/config/selection';
import { TestTypeMessages } from '@/types/testType';
import { CaseTypeCountType, ChartDataType } from '@/types/chart';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type Props = {
  typesCounts: CaseTypeCountType[];
  testTypeMessages: TestTypeMessages;
  theme: string | undefined;
};

export default function TestTypesDonutChart({ typesCounts, testTypeMessages, theme }: Props) {
  const [chartData, setChartData] = useState<ChartDataType>({
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

        const labels = testTypes.map((entry) => testTypeMessages[entry.uid]);
        const colors = testTypes.map((entry) => entry.chartColor);
        const legend = {
          labels: {
            colors: testTypes.map((entry) => {
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
  }, [typesCounts, theme]);

  return <Chart options={chartData.options} series={chartData.series} type="donut" width={'100%'} height={'100%'} />;
}
