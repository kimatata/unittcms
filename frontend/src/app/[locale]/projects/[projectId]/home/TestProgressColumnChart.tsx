import React from 'react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ProgressSeriesType } from '@/types/run';
import { testRunCaseStatus } from '@/config/selection';
import { ChartDataType } from '@/types/chart';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type Props = {
  progressSeries: ProgressSeriesType[];
  progressCategories: string[];
  theme: string | undefined;
};

export default function TestProgressBarChart({ progressSeries, progressCategories, theme }: Props) {
  const [chartData, setChartData] = useState<ChartDataType>({
    series: [],
    options: {
      labels: [],
      colors: [],
    },
  });

  useEffect(() => {
    const updateChartDate = () => {
      if (progressSeries) {
        const legendsLabelColors = testRunCaseStatus.map((itr) => {
          if (theme === 'light') {
            return 'black';
          } else {
            return 'white';
          }
        });

        const xaxisLabelColor = theme === 'light' ? 'black' : 'white';

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
              position: 'right',
              labels: {
                colors: legendsLabelColors,
              },
            },
            colors: testRunCaseStatus.map((itr) => {
              return itr.chartColor;
            }),
            xaxis: {
              type: 'datetime',
              categories: progressCategories,
              labels: {
                style: {
                  colors: xaxisLabelColor,
                },
              },
            },
            tooltip: {
              theme: theme,
            },
          },
        });
      }
    };

    updateChartDate();
  }, [progressSeries, progressCategories, theme]);

  return <Chart options={chartData.options} series={chartData.series} type="bar" width={'100%'} height={'100%'} />;
}
