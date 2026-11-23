import { useEffect, useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ value, onChange, placeholder = 'Search...', icon }) => {
  const [draft, setDraft] = useState(value || '');

  useEffect(() => setDraft(value || ''), [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => onChange(draft), 300);
    return () => window.clearTimeout(timer);
  }, [draft, onChange]);

  return (
    <div className="search-bar">
      {icon ?? <span className="search-icon" aria-hidden="true">⌕</span>}
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {draft && (
        <button type="button" aria-label="Clear search" onClick={() => { setDraft(''); onChange(''); }}>×</button>
      )}
    </div>
  );
};

export default SearchBar;
