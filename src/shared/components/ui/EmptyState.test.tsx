import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState Component', () => {
  it('renders default title and description when none provided', () => {
    render(<EmptyState />);
    expect(screen.getByText('No records found')).toBeInTheDocument();
    expect(
      screen.getByText('There are no items matching your current filters or query.')
    ).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(
      <EmptyState
        title="No Bookmarks"
        description="Save your favorite problems to review them later."
      />
    );
    expect(screen.getByText('No Bookmarks')).toBeInTheDocument();
    expect(
      screen.getByText('Save your favorite problems to review them later.')
    ).toBeInTheDocument();
  });

  it('renders action button and handles clicks', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="Empty List"
        actionText="Refresh Questions"
        onAction={handleAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Refresh Questions' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
