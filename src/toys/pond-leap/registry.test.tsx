import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { registry } from '../registry';
import { visibleToys } from '../../shell/registry';
import { renderApp } from '../../shell/test-support/renderApp';

describe('Pond Leap — registration', () => {
  it('is registered as a live Toy', () => {
    const entry = registry.find((t) => t.id === 'pond-leap');
    expect(entry?.title).toBe('Pond Leap');
    expect(entry?.draft).toBeUndefined();
  });

  it('has a Card in a Preview Deployment, with no draft mark', async () => {
    renderApp('/', { toys: visibleToys(registry, 'preview') });
    const card = await screen.findByRole('link', { name: /Pond Leap/ });
    expect(card).not.toHaveTextContent(/draft/i);
  });

  it('has a Card in production', async () => {
    renderApp('/', { toys: visibleToys(registry, 'production') });
    const card = await screen.findByRole('link', { name: /Pond Leap/ });
    expect(card).toHaveAttribute('href', '/toy/pond-leap');
  });
});
