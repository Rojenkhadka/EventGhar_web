import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

// Helper component to expose context values
function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('ThemeContext – default state', () => {
  it('defaults to "dark" when localStorage has no saved theme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('eventghar_theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('applies data-theme attribute to document root on mount', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('ThemeContext – toggleTheme', () => {
  it('toggles from dark to light', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('Toggle'));
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('toggles from light back to dark', () => {
    localStorage.setItem('eventghar_theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('Toggle'));
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('updates data-theme attribute on document root after toggle', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('Toggle'));
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists new theme to localStorage after toggle', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('Toggle'));
    });
    expect(localStorage.getItem('eventghar_theme')).toBe('light');
  });

  it('double toggle returns to original theme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('Toggle'));
      fireEvent.click(screen.getByText('Toggle'));
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });
});

describe('ThemeContext – useTheme error guard', () => {
  it('throws when useTheme is used outside ThemeProvider', () => {
    // Suppress React's error boundary output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    spy.mockRestore();
  });
});
