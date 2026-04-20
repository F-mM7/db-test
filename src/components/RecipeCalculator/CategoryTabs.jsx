import { memo } from 'react';

export const SUMMARY_TAB = '__summary__';

const CategoryTabs = memo(({ categories, activeTab, onSelect, selectedCount }) => (
  <div className="category-tabs">
    {categories.map(category => (
      <button
        key={category}
        className={`tab ${activeTab === category ? 'active' : ''}`}
        onClick={() => onSelect(category)}
      >
        {category}
      </button>
    ))}
    <button
      className={`summary-tab tab ${activeTab === SUMMARY_TAB ? 'active' : ''}`}
      onClick={() => onSelect(SUMMARY_TAB)}
    >
      集計
      {selectedCount > 0 && (
        <span className="summary-tab-badge badge badge--solid-red badge--sm">{selectedCount}</span>
      )}
    </button>
  </div>
));

CategoryTabs.displayName = 'CategoryTabs';

export default CategoryTabs;
