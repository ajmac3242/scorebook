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
        paddingTop: '66.6%',
        position: 'relative',
        backgroundColor: '#FFFDF5', // Matching Moleskine theme
        backgroundImage: `
          linear-gradient(#D1D1D1 1px, transparent 1px),
          linear-gradient(90deg, #D1D1D1 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px', // Subtle grid pattern
        border: '1.5px solid #2D2D2D',
        borderRadius: '4px',
        cursor: 'crosshair',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.15,
          backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Basketball_half_court.svg/1024px-Basketball_half_court.svg.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          pointerEvents: 'none'
        }
      }}
    />
  );
};

export default BasketballCourt;
