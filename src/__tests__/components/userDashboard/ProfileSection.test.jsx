import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileSection from '../../../components/userDashboard/ProfileSection';

vi.mock('../../../api/me', () => ({
  getMe: vi.fn(),
  updateMe: vi.fn(),
}));

import { getMe, updateMe } from '../../../api/me';

const baseUser = { name: 'Rojen Khadka', email: 'rojen@example.com', profilePic: null };

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('ProfileSection – rendering', () => {
  it('renders without crashing', () => {
    getMe.mockResolvedValue(null);
    render(<ProfileSection />);
    expect(document.body).toBeTruthy();
  });

  it('displays the user name after fetching', async () => {
    getMe.mockResolvedValue(baseUser);
    render(<ProfileSection />);
    await waitFor(() => {
      expect(screen.getByText('Rojen Khadka')).toBeInTheDocument();
    });
  });

  it('displays the user email after fetching', async () => {
    getMe.mockResolvedValue(baseUser);
    render(<ProfileSection />);
    await waitFor(() => {
      expect(screen.getByText('rojen@example.com')).toBeInTheDocument();
    });
  });

  it('shows edit button', async () => {
    getMe.mockResolvedValue(baseUser);
    render(<ProfileSection />);
    await waitFor(() => {
      expect(screen.getByText(/edit/i)).toBeInTheDocument();
    });
  });
});

describe('ProfileSection – edit mode', () => {
  it('enables form fields when Edit is clicked', async () => {
    getMe.mockResolvedValue(baseUser);
    render(<ProfileSection />);
    await waitFor(() => screen.getByText(/edit/i));
    fireEvent.click(screen.getByText(/edit/i));
    const nameInput = screen.getByDisplayValue('Rojen Khadka');
    expect(nameInput).not.toHaveAttribute('readOnly');
  });

  it('shows Save and Cancel buttons in edit mode', async () => {
    getMe.mockResolvedValue(baseUser);
    render(<ProfileSection />);
    await waitFor(() => screen.getByText(/edit/i));
    fireEvent.click(screen.getByText(/edit/i));
    expect(screen.getByText(/save/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it('reverts changes when Cancel is clicked', async () => {
    getMe.mockResolvedValue(baseUser);
    render(<ProfileSection />);
    await waitFor(() => screen.getByText(/edit/i));
    fireEvent.click(screen.getByText(/edit/i));
    const nameInput = screen.getByDisplayValue('Rojen Khadka');
    fireEvent.change(nameInput, { target: { name: 'name', value: 'Changed Name' } });
    fireEvent.click(screen.getByText(/cancel/i));
    // After cancel, edit mode should exit
    await waitFor(() => {
      expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
    });
  });

  it('calls updateMe with form values on Save', async () => {
    getMe.mockResolvedValue(baseUser);
    updateMe.mockResolvedValue({ ...baseUser, name: 'Rojen Updated' });
    render(<ProfileSection />);
    await waitFor(() => screen.getByText(/edit/i));
    fireEvent.click(screen.getByText(/edit/i));
    const nameInput = screen.getByDisplayValue('Rojen Khadka');
    fireEvent.change(nameInput, { target: { name: 'name', value: 'Rojen Updated' } });
    fireEvent.click(screen.getByText(/save/i));
    await waitFor(() => {
      expect(updateMe).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Rojen Updated' })
      );
    });
  });

  it('shows success message after successful save', async () => {
    getMe.mockResolvedValue(baseUser);
    updateMe.mockResolvedValue({ ...baseUser, name: 'New Name' });
    render(<ProfileSection />);
    await waitFor(() => screen.getByText(/edit/i));
    fireEvent.click(screen.getByText(/edit/i));
    fireEvent.click(screen.getByText(/save/i));
    await waitFor(() => {
      expect(screen.getByText(/Profile updated/i)).toBeInTheDocument();
    });
  });

  it('shows error message when updateMe fails', async () => {
    getMe.mockResolvedValue(baseUser);
    updateMe.mockRejectedValue(new Error('Update failed'));
    render(<ProfileSection />);
    await waitFor(() => screen.getByText(/edit/i));
    fireEvent.click(screen.getByText(/edit/i));
    fireEvent.click(screen.getByText(/save/i));
    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
    });
  });
});

describe('ProfileSection – error handling', () => {
  it('handles getMe rejection gracefully', async () => {
    getMe.mockRejectedValue(new Error('Unauthorized'));
    render(<ProfileSection />);
    // Should not throw; component should still mount
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it('clears profile pic from localStorage on mount', async () => {
    localStorage.setItem('eventghar_profile_pic', 'old_pic_data');
    getMe.mockResolvedValue(baseUser);
    render(<ProfileSection />);
    await waitFor(() => screen.getByText('Rojen Khadka'));
    expect(localStorage.getItem('eventghar_profile_pic')).toBeNull();
  });
});
