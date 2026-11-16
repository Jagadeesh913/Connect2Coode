import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PublicHubContent } from '../../shared/components/seo/PublicHubContent';
import type { PublicPageContent } from '../../core/metadata/publicPageContent';

describe('PublicHubContent Component', () => {
  const mockContent: PublicPageContent = {
    path: '/practice',
    title: 'Coding Practice',
    description: 'Practice coding problems by topic and difficulty.',
    heading: 'Coding Practice for Placement Interviews',
    introduction: 'Explore the problem catalog and workspace.',
    topics: ['Topic-based discovery', 'Difficulty filters', 'Browser coding workspace'],
  };

  it('renders heading, introduction, and topics list', () => {
    const handleSignIn = vi.fn();
    render(
      <MemoryRouter>
        <PublicHubContent content={mockContent} onSignIn={handleSignIn} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Coding Practice for Placement Interviews' })).toBeInTheDocument();
    expect(screen.getByText('Explore the problem catalog and workspace.')).toBeInTheDocument();
    expect(screen.getByText('Topic-based discovery')).toBeInTheDocument();
    expect(screen.getByText('Difficulty filters')).toBeInTheDocument();
  });

  it('triggers onSignIn callback when clicking sign in button', () => {
    const handleSignIn = vi.fn();
    render(
      <MemoryRouter>
        <PublicHubContent content={mockContent} onSignIn={handleSignIn} />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: 'Sign in to continue' });
    fireEvent.click(button);
    expect(handleSignIn).toHaveBeenCalledTimes(1);
  });

  it('disables sign-in button when signInDisabled is true', () => {
    const handleSignIn = vi.fn();
    render(
      <MemoryRouter>
        <PublicHubContent content={mockContent} onSignIn={handleSignIn} signInDisabled={true} />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: 'Sign in to continue' });
    expect(button).toBeDisabled();
  });

  it('renders links to other public preparation hubs', () => {
    const handleSignIn = vi.fn();
    render(
      <MemoryRouter>
        <PublicHubContent content={mockContent} onSignIn={handleSignIn} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'DSA Sheet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Company Preparation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aptitude Practice' })).toBeInTheDocument();
  });
});
