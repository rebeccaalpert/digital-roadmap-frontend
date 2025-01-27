import './lifecycle.scss';
import React, { lazy, useEffect, useState } from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import {
  Bullseye,
  Button,
  Card,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Stack,
} from '@patternfly/react-core';
import { getLifecycleChanges } from '../../api';
import { ErrorObject } from '../../types/ErrorObject';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
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
  [{ x: 'RHEL 8.3', y0: new Date('2023-01'), y: new Date('2024-06'), packageType: 'Retired' }],
  [
    {
      x: 'RHEL 8.7',
      y0: new Date('2023-01'),
      y: new Date('2025-10'),
      packageType: 'Support ends within 6 months',
    },
  ],
  [{ x: 'RHEL 9.0', y0: new Date('2024-08'), y: new Date('2025-06'), packageType: 'Not installed' }],
  [{ x: 'RHEL 9.1', y0: new Date('2023-01'), y: new Date('2027-10'), packageType: 'Supported' }],
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

  const resetFilters = () => {
    setNameFilter('');
    setFilteredChartData(lifecycleChartData);
    setFilteredTableData(relevantLifecycleChanges);
  };

  if (isLoading) {
    return (
      <div>
        <Bullseye>
          <Spinner />
        </Bullseye>
      </div>
    );
  }

  // placeholder for later
  if (error) {
    return <div>{error.message}</div>;
  }

  const emptyState = (
    <Bullseye>
      <EmptyState variant={EmptyStateVariant.sm}>
        <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} titleText="No results found" headingLevel="h2" />
        <EmptyStateBody>Clear all filters and try again.</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="link" onClick={resetFilters}>
              Clear all filters
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </Bullseye>
  );

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
          {filteredChartData.length === 0 || filteredTableData.length === 0 ? (
            emptyState
          ) : (
            <>
              <LifecycleChart lifecycleData={filteredChartData} />
              <LifecycleTable lifecycleData={filteredTableData} />
            </>
          )}
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
