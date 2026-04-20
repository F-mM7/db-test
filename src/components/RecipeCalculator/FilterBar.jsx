import { memo } from 'react';
import { POT_SIZE_MIN, POT_SIZE_MAX } from '../../hooks/useRecipeCalculator';

const FilterBar = memo(({ potSize, onIncrement, onDecrement }) => (
  <div className="filter-bar">
    <span className="filter-bar-label">鍋のサイズ</span>
    <div className="pot-size-controls">
      <button
        className="icon-btn icon-btn-step"
        onClick={onDecrement}
        disabled={potSize <= POT_SIZE_MIN}
      >
        -
      </button>
      <span className="pot-size-value">{potSize}</span>
      <button
        className="icon-btn icon-btn-step"
        onClick={onIncrement}
        disabled={potSize >= POT_SIZE_MAX}
      >
        +
      </button>
    </div>
  </div>
));

FilterBar.displayName = 'FilterBar';

export default FilterBar;
