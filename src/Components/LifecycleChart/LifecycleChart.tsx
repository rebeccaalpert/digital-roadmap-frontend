import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartLine,
  ChartTooltip,
  ChartVoronoiContainer,
} from '@patternfly/react-charts';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';

interface LifecycleChartProps {
  lifecycleData: Stream[] | SystemLifecycleChanges[];
}

interface ChartDataObject {
  x: string;
  y0: Date;
  y: Date;
  packageType: string;
  version: string;
  numSystems: string;
  name: string;
}

const LifecycleChart: React.FC<LifecycleChartProps> = ({ lifecycleData }: LifecycleChartProps) => {
  //check data type and contruct a chart array
  const checkDataType = (lifecycleData: Stream[] | SystemLifecycleChanges[]) => {
    if (!lifecycleData || lifecycleData.length === 0) {
      return '';
    }
    if ('arch' in lifecycleData[0]) {
      return 'appLifecycle';
    }
    return 'lifecycle';
  };

  const dataType = checkDataType(lifecycleData);
  const updatedLifecycleData: ChartDataObject[][] = [];
  const years: { [key: string]: Date } = {};

  const formatChartData = (
    name: string,
    startDate: string,
    endDate: string,
    packageType: string,
    version: string,
    numSystems: string
  ) => {
    return updatedLifecycleData.push([
      {
        x: name,
        y0: new Date(startDate),
        y: new Date(endDate),
        packageType,
        version,
        numSystems,
        name,
      },
    ]);
  };

  const addInterstitialYears = (yearsObject: { [key: string]: Date }) => {
    const years = Object.keys(yearsObject).sort();
    if (years.length < 2) {
      return yearsObject;
    }

    let startYear = parseInt(years[0]);
    const endYear = parseInt(years[years.length - 1]);

    while (startYear < endYear) {
      const yearString = String(startYear);
      if (!(yearString in yearsObject)) {
        yearsObject[yearString] = new Date(`January 1 ${yearString}`);
      }
      startYear++;
    }

    return yearsObject;
  };

  // We use this to deduplicate years and add on the last year as a data point
  // Years always start with January, but the end date may be June 2023
  // We want the axis to end with January 1 of the following year if the end date isn't already January
  const formatYearAxisData = (start: string, end: string) => {
    const endDate = new Date(end);
    const startYear = new Date(start).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric' });
    const endYear = endDate.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric' });
    years[startYear] = new Date(`January 1 ${startYear}`);
    years[endYear] = new Date(`January 1 ${endYear}`);
    if (endDate.getMonth() > 0) {
      endDate.setFullYear(endDate.getFullYear() + 1);
      const endDateAsString = endDate.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric' });
      years[endDateAsString] = new Date(`January 1 ${endDateAsString}`);
    }
  };

  const constructLifecycleData = (lifecycleData: Stream[] | SystemLifecycleChanges[]) => {
    if (!dataType) {
      return;
    }
    if (dataType === 'appLifecycle') {
      (lifecycleData as Stream[]).forEach((item) => {
        if (item.start_date === 'Unknown' || item.end_date === 'Unknown' || item.rhel_major_version === 8) {
          return;
        }
        formatChartData(
          `${item.name} ${item.stream}`,
          item.start_date,
          item.end_date,
          'Supported',
          `${item.rhel_major_version}`,
          `${item.systems ?? 'N/A'}`
        );
        formatYearAxisData(item.start_date, item.end_date);
      });
    } else {
      (lifecycleData as SystemLifecycleChanges[]).forEach((item) => {
        if (item.release_date === 'Unknown' || item.retirement_date === 'Unknown') {
          return;
        }
        formatChartData(
          item.name,
          item.release_date,
          item.retirement_date,
          'Supported',
          `${item.major}.${item.minor}`,
          `${item.count ?? 'N/A'}`
        );
        formatYearAxisData(item.release_date, item.retirement_date);
      });
    }
    addInterstitialYears(years);
  };

  constructLifecycleData(lifecycleData);

  // get unique package types
  const uniqueTypes = [...new Set(updatedLifecycleData.flat().map((d) => d.packageType))];

  // group by package type
  const groupedData = uniqueTypes.map((type) => ({
    packageType: type,
    datapoints: updatedLifecycleData
      .flat()
      .filter((d) => d.packageType === type)
      .map((d) => ({
        name: d.name,
        packageType: d.packageType,
        version: d.version,
        numSystems: d.numSystems,
        x: d.x,
        y: d.y,
        y0: d.y0,
      })),
  }));

  const formatDate = (date: Date) => {
    const dateString = date?.toLocaleDateString('en-US', { timeZone: 'UTC' });
    return dateString;
  };

  const fetchTicks = () => {
    return updatedLifecycleData.map((data) => {
      return data[0].x;
    });
  };

  return (
    <div className="drf-lifecycle__chart" tabIndex={0}>
      <svg aria-hidden height="0" width="0" style={{ display: 'block' }}>
        <defs>
          <pattern
            id="pattern1"
            patternUnits="userSpaceOnUse"
            patternContentUnits="userSpaceOnUse"
            width="5"
            height="5"
            x="0"
            y="0"
          >
            <rect width="5" height="5" fill="white" />
            <path
              d="M 0 5 L 5 0 M -0.5 0.5 L 0.5 -0.5 M 4.5 5.5 L 5.5 4.5"
              height="5"
              width="5"
              stroke="var(--pf-v5-global--success-color--100)"
              strokeWidth="2"
              patternTransform="scale(1.4 1.4)"
            ></path>
          </pattern>
        </defs>
      </svg>
      <Chart
        legendAllowWrap
        ariaDesc="Support timelines of packages and RHEL versions"
        ariaTitle="Lifecycle bar chart"
        containerComponent={
          <ChartVoronoiContainer
            labelComponent={<ChartTooltip constrainToVisibleArea />}
            labels={({ datum }) => {
              if (datum.name && datum.y0) {
                return `Name: ${datum.name}\nRelease: ${datum.version}\nSupport Type: ${datum.packageType}\nSystems: ${
                  datum.numSystems
                }\nStart: ${formatDate(new Date(datum.y0))}\nEnd: ${formatDate(new Date(datum.y))}`;
              }
              return formatDate(new Date());
            }}
          />
        }
        legendData={[
          { name: 'Supported' },
          { name: 'Support ends within 6 months' },
          { name: 'Retired' },
          { name: 'Not installed' },
          { name: 'Upcoming release' },
        ]}
        legendPosition="bottom-left"
        name="chart5"
        padding={{
          bottom: 60, // Adjusted to accommodate legend
          left: 160,
          right: 50, // Adjusted to accommodate tooltip
          top: 20,
        }}
        // adjust this by number of items
        height={updatedLifecycleData.length * 15 + 300}
        width={900}
        patternScale={['url("#pattern1")', '', '', '', '', '']}
        colorScale={[
          'var(--pf-v5-global--success-color--100)',
          'var(--pf-v5-global--danger-color--100)',
          'var(--pf-v5-global--warning-color--100)',
          'var(--pf-v5-global--palette--blue-200)',
          'var(--pf-v5-global--palette--blue-100)',
          'var(--pf-v5-global--default-color--300)',
        ]}
      >
        {Object.values(years).length > 0 && (
          <ChartAxis
            dependentAxis
            showGrid
            tickValues={Object.values(years)}
            tickFormat={(t: Date) => t.toLocaleDateString('en-US', { year: 'numeric' })}
          />
        )}
        <ChartAxis showGrid tickValues={fetchTicks()} />
        <ChartGroup horizontal>
          {groupedData.map((data, index) => (
            <ChartBar
              data={data.datapoints}
              key={index}
              style={{
                data: {
                  stroke: ({ datum }) => datum.fill,
                },
              }}
            />
          ))}
        </ChartGroup>
        <ChartLine
          y={() => Date.now()}
          y0={() => Date.now()}
          style={{
            data: {
              stroke: 'black',
              strokeWidth: 0.5,
            },
          }}
        />
      </Chart>
    </div>
  );
};

export default LifecycleChart;
