import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { registry } from '../registry';
import { visibleToys } from '../../shell/registry';
import { renderApp } from '../../shell/test-support/renderApp';

describe('Pond Leap — registration', () => {
  it('is registered as a Draft Toy', () => {
    const entry = registry.find((t) => t.id === 'pond-leap');
    expect(entry?.title).toBe('Pond Leap');
    expect(entry?.draft).toBe(true);
  });

  it('has a Card in a Preview Deployment', async () => {
    renderApp('/', { toys: visibleToys(registry, 'preview') });
    const card = await screen.findByRole('link', { name: /Pond Leap/ });
    expect(card).toHaveTextContent(/draft/i);
  });

  it('has no Card in production', async () => {
    renderApp('/', { toys: visibleToys(registry, 'production') });
    await screen.findByText('Tiny toys for tiny humans');
    expect(screen.queryByRole('link', { name: /Pond Leap/ })).toBeNull();
  });
});
