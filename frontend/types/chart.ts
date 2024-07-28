import { ApexOptions } from 'apexcharts';

export type ChartDataType = {
  series: ApexOptions['series'];
  options: ApexOptions;
};

export type CaseTypeCountType = {
  type: number;
  count: number;
};

export type CasePriorityCountType = {
  priority: number;
  count: number;
};
