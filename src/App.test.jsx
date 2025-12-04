import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the lazy loaded components to avoid suspense issues in tests
jest.mock('./pages/index.jsx', () => {
  return function DummyPages() {
    return <div data-testid="pages-content">Pages Content</div>;
  };
});

test('renders app without crashing', () => {
  render(<App />);
  const linkElement = screen.getByTestId('pages-content');
  expect(linkElement).toBeInTheDocument();
});
