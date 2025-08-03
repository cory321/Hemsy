import { render } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Breadcrumbs } from './Breadcrumbs';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Breadcrumbs', () => {
  it('renders nothing for dashboard root', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it('renders breadcrumbs for clients page', () => {
    mockUsePathname.mockReturnValue('/clients');
    const { getByText } = render(<Breadcrumbs />);
    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('Clients')).toBeInTheDocument();
  });

  it('renders breadcrumbs for client details page', () => {
    mockUsePathname.mockReturnValue(
      '/clients/123e4567-e89b-12d3-a456-426614174000'
    );
    const { getByText } = render(<Breadcrumbs />);
    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('Clients')).toBeInTheDocument();
    expect(getByText('Client Details')).toBeInTheDocument();
  });

  it('renders breadcrumbs for new client page', () => {
    mockUsePathname.mockReturnValue('/clients/new');
    const { getByText } = render(<Breadcrumbs />);
    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('Clients')).toBeInTheDocument();
    expect(getByText('New')).toBeInTheDocument();
  });
});
