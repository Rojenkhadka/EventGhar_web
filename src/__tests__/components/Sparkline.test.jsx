import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Sparkline from '../../components/Sparkline';

describe('Sparkline – rendering', () => {
  it('renders nothing when data is empty', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when data prop is not provided', () => {
    const { container } = render(<Sparkline />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when data is null', () => {
    const { container } = render(<Sparkline data={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an SVG element when data has values', () => {
    const { container } = render(<Sparkline data={[1, 3, 2, 5, 4]} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('uses default width of 120 and height of 44', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('120');
    expect(svg.getAttribute('height')).toBe('44');
  });

  it('respects custom width and height props', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} width={200} height={80} />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('200');
    expect(svg.getAttribute('height')).toBe('80');
  });

  it('sets the correct viewBox based on width and height', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} width={150} height={60} />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 150 60');
  });

  it('renders two <path> elements (area fill + line)', () => {
    const { container } = render(<Sparkline data={[10, 20, 15]} />);
    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(2);
  });

  it('renders with a single data point without crashing', () => {
    const { container } = render(<Sparkline data={[42]} />);
    // Single point: length - 1 = 0, causes divide-by-zero guard; should still render
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('applies the custom stroke colour to the line path', () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} stroke="#ff0000" />
    );
    const paths = container.querySelectorAll('path');
    const linePath = Array.from(paths).find(
      (p) => p.getAttribute('stroke') === '#ff0000'
    );
    expect(linePath).not.toBeNull();
  });

  it('applies the custom fill colour to the area path', () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} fill="rgba(0,255,0,0.2)" />
    );
    const paths = container.querySelectorAll('path');
    const areaPath = Array.from(paths).find((p) =>
      p.getAttribute('fill')?.includes('rgba')
    );
    expect(areaPath).not.toBeNull();
  });

  it('handles all-equal values (flat line) without crashing', () => {
    const { container } = render(<Sparkline data={[5, 5, 5, 5]} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('handles negative values without crashing', () => {
    const { container } = render(<Sparkline data={[-10, -5, 0, 5, 10]} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('preserves aspect ratio as "none"', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
  });
});
