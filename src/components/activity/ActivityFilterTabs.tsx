import React from 'react';
import { GenericFilterTabs } from '../common/GenericFilterTabs';
import { useActivityStore, ActivityFilter } from '../../store/activityStore';

const FILTER_OPTIONS: ActivityFilter[] = ['All', 'deposit', 'claim', 'request', 'cancel'];

const getFilterLabel = (filter: ActivityFilter): string => {
  if (filter === 'All') return 'All';
  return filter.charAt(0).toUpperCase() + filter.slice(1);
};

interface ActivityFilterTabsProps {
  scrollEnabled?: boolean;
}

export const ActivityFilterTabs: React.FC<ActivityFilterTabsProps> = ({ scrollEnabled = true }) => {
  const { selectedFilter, setSelectedFilter } = useActivityStore();

  return (
    <GenericFilterTabs
      options={FILTER_OPTIONS}
      selectedOption={selectedFilter}
      onSelectOption={setSelectedFilter}
      scrollEnabled={scrollEnabled}
      getOptionLabel={getFilterLabel}
    />
  );
};