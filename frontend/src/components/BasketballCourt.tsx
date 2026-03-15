import React from 'react';
import { Box } from '@mui/material';

const BasketballCourt: React.FC<{ onCoordClick: (x: number, y: number) => void }> = ({ onCoordClick }) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onCoordClick(x, y);
  };

  return (
    <Box
      onClick={handleClick}
      data-testid="basketball-court"
      sx={{
        width: '100%',
        paddingTop: '66.6%', // 3:2 Aspect Ratio for half court or similar
        position: 'relative',
        backgroundColor: '#e0e0e0',
        backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Basketball_half_court.svg/1024px-Basketball_half_court.svg.png")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        border: '2px solid #333',
        cursor: 'crosshair'
      }}
    />
  );
};

export default BasketballCourt;
