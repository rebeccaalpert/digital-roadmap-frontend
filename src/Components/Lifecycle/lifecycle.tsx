import './lifecycle.scss';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { Card, Stack } from '@patternfly/react-core';
import { getLifecycleChanges } from '../../api';
import { ErrorObject } from '../../types/ErrorObject';

// const SelectOptionVariations = lazy(() => import('../FilterComponents/LifecycleDropdown'));

const LifecycleChart = lazy(() => import('../../Components/LifecycleChart/lifecycleChart'));
const LifecycleTable = lazy(() => import('../../Components/LifecycleTable/lifecycleTable'));
const LifecycleFilters = lazy(() => import('../../Components/LifecycleFilters/LifecycleFilters'));

type LifecycleChanges = {
  name: string;
  release: string;
  major: number;
  minor: number;
  release_date: Date;
  retirement_date: Date;
  systems: number;
};

/* const LifecycleColumnNames = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release Date',
  retirement_date: 'Retirement Date',
  systems: 'Systems',
};*/

// Start = y0, end = y
const lifecycleChartData = [
  [{ x: 'Node.js 16', y0: new Date('2023-01'), y: new Date('2024-06'), packageType: 'Retired' }],
  [
    {
      x: 'gcc-toolset 12',
      y0: new Date('2023-01'),
      y: new Date('2025-10'),
      packageType: 'Support ends within 6 months',
    },
  ],
  [{ x: 'Ruby 3.1', y0: new Date('2024-08'), y: new Date('2025-06'), packageType: 'Not installed' }],
  [{ x: 'gcc-toolset 12', y0: new Date('2023-01'), y: new Date('2027-10'), packageType: 'Supported' }],
  [{ x: 'Ruby 3.0', y0: new Date('2024-08'), y: new Date('2025-06'), packageType: 'Upcoming release' }],
];

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {
  const emptyLifecycleChanges: LifecycleChanges[] = [];
  const [relevantLifecycleChanges, setLifecycleChanges] = useState(emptyLifecycleChanges);
  const [filteredTableData, setFilteredTableData] = useState(emptyLifecycleChanges);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject>();
  const [filteredChartData, setFilteredChartData] = useState(lifecycleChartData);

  const fetchData = () => {
    setIsLoading(true);
    getLifecycleChanges()
      .then((data: never[]) => {
        const upcomingChangesParagraphs: LifecycleChanges[] = data || [];
        setLifecycleChanges(upcomingChangesParagraphs);
        setFilteredTableData(upcomingChangesParagraphs);
        setIsLoading(false);
      })
      .catch(() => {
        // Dispatch notif here
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterData = (name: string) => {
    if (nameFilter !== '') {
      const newChartData = lifecycleChartData.filter((datum) => datum[0].x.toLowerCase().includes(name.toLowerCase()));
      setFilteredChartData(newChartData);
      const newTableData = relevantLifecycleChanges.filter((datum) => {
        const product = `${datum.name.toLowerCase()} ${datum.major}.${datum.minor}`;
        return product.includes(name.toLowerCase());
      });
      setFilteredTableData(newTableData);
    } else {
      setFilteredChartData(lifecycleChartData);
      setFilteredTableData(relevantLifecycleChanges);
    }
  };

  const onNameFilterChange = (name: string) => {
    setNameFilter(name);
    filterData(name);
  };

  // placeholder for later
  if (isLoading) {
    return <div>Loading</div>;
  }

  // placehodler for later
  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <React.Fragment>
      <Stack hasGutter>
        <Card>
          <LifecycleFilters
            nameFilter={nameFilter}
            setNameFilter={(name: string) => onNameFilterChange(name)}
            setIsLoading={(isLoading: boolean) => setIsLoading(isLoading)}
            setError={(error: ErrorObject) => setError(error)}
          />
          <LifecycleChart lifecycleData={filteredChartData} />
          <LifecycleTable lifecycleData={filteredTableData} />
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
