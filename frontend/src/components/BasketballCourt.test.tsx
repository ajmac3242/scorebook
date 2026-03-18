import { render, screen, fireEvent } from '@testing-library/react';
import BasketballCourt from './BasketballCourt';
import { describe, it, expect, vi } from 'vitest';

describe('BasketballCourt Component', () => {
  it('renders SVG court', () => {
    const { container } = render(<BasketballCourt onCoordClick={vi.fn()} />);

    // Check for some SVG elements
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    expect(container.querySelector('rect')).toBeInTheDocument();
    expect(container.querySelector('circle')).toBeInTheDocument();
  });

  it('calls onCoordClick when clicked', () => {
    const onCoordClick = vi.fn();
    render(<BasketballCourt onCoordClick={onCoordClick} />);

    // Using a more generic way to find the SVG since getByRole might fail depending on tags
    const svg = document.querySelector('svg');
    if (!svg) throw new Error('SVG not found');

    // Mock getBoundingClientRect
    svg.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    });

    fireEvent.click(svg, { clientX: 50, clientY: 50 });

    expect(onCoordClick).toHaveBeenCalledWith(50, 50);
  });
});
