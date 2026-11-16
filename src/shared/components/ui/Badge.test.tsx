import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Easy</Badge>);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Badge variant="easy">Easy Problem</Badge>);
    const badgeElement = container.querySelector('span');
    expect(badgeElement).toHaveClass('text-emerald-700');
  });

  it('applies hard variant styling', () => {
    const { container } = render(<Badge variant="hard">Hard Problem</Badge>);
    const badgeElement = container.querySelector('span');
    expect(badgeElement).toHaveClass('text-rose-700');
  });

  it('merges custom className without dropping defaults', () => {
    const { container } = render(<Badge className="custom-test-class">Test</Badge>);
    const badgeElement = container.querySelector('span');
    expect(badgeElement).toHaveClass('custom-test-class');
    expect(badgeElement).toHaveClass('inline-flex');
  });
});
