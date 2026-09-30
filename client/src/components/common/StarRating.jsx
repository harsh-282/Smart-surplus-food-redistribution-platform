import { useState } from 'react';

const StarRating = ({ value = 0, onChange = null, max = 5, readOnly = false, size = '1.25rem' }) => {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  return (
    <div className="star-rating" style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
      {[...Array(max)].map((_, idx) => {
        const starNum = idx + 1;
        const isFilled = starNum <= displayValue;
        
        return (
          <span
            key={starNum}
            onClick={() => !readOnly && onChange && onChange(starNum)}
            onMouseEnter={() => !readOnly && setHoverValue(starNum)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              fontSize: size,
              color: isFilled ? '#f59e0b' : '#d1d5db',
              transition: 'transform 0.15s ease, color 0.15s ease',
              transform: !readOnly && hoverValue === starNum ? 'scale(1.2)' : 'scale(1)',
              userSelect: 'none',
            }}
            title={!readOnly ? `${starNum} Star${starNum > 1 ? 's' : ''}` : ''}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
