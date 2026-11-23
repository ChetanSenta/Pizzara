import './PageSkeleton.css';

const PageSkeleton = ({ cards = 6, type = 'cards' }) => (
  <div className="page-skeleton" aria-label="Loading" role="status">
    <div className="skeleton-heading" />
    {type === 'table' ? (
      <div className="skeleton-table">
        {Array.from({ length: cards }).map((_, index) => (
          <div className="skeleton-table-row" key={index}>
            <span /><span /><span /><span />
          </div>
        ))}
      </div>
    ) : (
      <div className="skeleton-grid">
        {Array.from({ length: cards }).map((_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton-image" />
            <div className="skeleton-line wide" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
    )}
  </div>
);

export default PageSkeleton;
