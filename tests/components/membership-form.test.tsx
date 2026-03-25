import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/app/(public)/membership/actions', () => ({
  submitMembershipRequestAction: vi.fn(),
}))

import { MembershipForm } from '@/app/(public)/membership/membership-form'
import { submitMembershipRequestAction } from '@/app/(public)/membership/actions'

const mockSubmit = submitMembershipRequestAction as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MembershipForm', () => {
  it('renders all form fields and submit button', () => {
    render(<MembershipForm />)

    expect(screen.getByPlaceholderText('James Morrison')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('james@example.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Anything you'd like us to know…")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /request membership/i })).toBeInTheDocument()
  })

  it('shows validation error when name is empty on submit', async () => {
    render(<MembershipForm />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /request membership/i }))

    await waitFor(() => {
      expect(screen.getByText(/full name/i, { selector: 'p' })).toBeInTheDocument()
    })
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when email is empty on submit', async () => {
    render(<MembershipForm />)
    const user = userEvent.setup()

    // Type a name but leave email empty — zod catches it, no HTML5 constraint fires
    await user.type(screen.getByPlaceholderText('James Morrison'), 'Jane Smith')
    await user.click(screen.getByRole('button', { name: /request membership/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('shows confirmation state on successful submission', async () => {
    mockSubmit.mockResolvedValue({ success: 'Thank you — your request has been received.' })
    render(<MembershipForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('James Morrison'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('james@example.com'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /request membership/i }))

    await waitFor(() => {
      expect(screen.getByText('Thank you — your request has been received.')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /request membership/i })).not.toBeInTheDocument()
  })

  it('shows server error message when action returns error', async () => {
    mockSubmit.mockResolvedValue({ error: 'Something went wrong.' })
    render(<MembershipForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('James Morrison'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('james@example.com'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /request membership/i }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /request membership/i })).toBeInTheDocument()
  })

  it('passes message to action when filled in', async () => {
    mockSubmit.mockResolvedValue({ success: 'Received.' })
    render(<MembershipForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('James Morrison'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('james@example.com'), 'jane@example.com')
    await user.type(screen.getByPlaceholderText("Anything you'd like us to know…"), 'Hello!')
    await user.click(screen.getByRole('button', { name: /request membership/i }))

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Hello!',
      })
    })
  })

  it('shows confirmation with duplicate flag (success, not error)', async () => {
    mockSubmit.mockResolvedValue({
      success: 'Thank you — your request has been received.',
      duplicate: true,
    })
    render(<MembershipForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('James Morrison'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('james@example.com'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /request membership/i }))

    await waitFor(() => {
      expect(screen.getByText('Thank you — your request has been received.')).toBeInTheDocument()
    })
  })
})
