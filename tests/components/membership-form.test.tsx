import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('First and Last'), 'Jane Smith')
  await user.type(screen.getByPlaceholderText('Email Address'), 'jane@example.com')
  await user.type(screen.getByPlaceholderText('Contact Number'), '3105550100')
  await user.type(screen.getByPlaceholderText('Enter Profession'), 'Architect')
  await user.type(screen.getByPlaceholderText('How/who referred you to Fescue?'), 'A friend')
}

describe('MembershipForm', () => {
  it('renders all required fields and submit button', () => {
    render(<MembershipForm />)

    expect(screen.getByPlaceholderText('First and Last')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Contact Number')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Profession')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('How/who referred you to Fescue?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
  })

  it('renders optional fields', () => {
    render(<MembershipForm />)

    expect(screen.getByPlaceholderText('Enter Zip')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /no/i })).toBeInTheDocument()
  })

  it('shows validation error when name is empty on submit', async () => {
    render(<MembershipForm />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() => {
      expect(screen.getByText(/enter your name/i)).toBeInTheDocument()
    })
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when phone is missing', async () => {
    render(<MembershipForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('First and Last'), 'Jane Smith')
    await user.type(screen.getByPlaceholderText('Email Address'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /apply/i }))

    // Error text is "Please enter your phone number." — more specific than the label
    await waitFor(() => {
      expect(screen.getByText('Please enter your phone number.')).toBeInTheDocument()
    })
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('shows confirmation state on successful submission', async () => {
    mockSubmit.mockResolvedValue({ success: "Thank you — we'll be in touch soon." })
    render(<MembershipForm />)
    const user = userEvent.setup()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() => {
      expect(screen.getByText("Thank you — we'll be in touch soon.")).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument()
  })

  it('shows server error message when action returns error', async () => {
    mockSubmit.mockResolvedValue({ error: 'Something went wrong.' })
    render(<MembershipForm />)
    const user = userEvent.setup()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument()
  })

  it('shows confirmation with duplicate flag (success, not error)', async () => {
    mockSubmit.mockResolvedValue({
      success: "We already have your request on file — we'll be in touch soon.",
      duplicate: true,
    })
    render(<MembershipForm />)
    const user = userEvent.setup()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() => {
      expect(screen.getByText(/already have your request/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument()
  })

  it('calls onSubmitted callback after successful submission', async () => {
    mockSubmit.mockResolvedValue({ success: "Thank you — we'll be in touch soon." })
    const onSubmitted = vi.fn()
    render(<MembershipForm onSubmitted={onSubmitted} />)
    const user = userEvent.setup()

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalledOnce()
    })
  })

  it('shows success without calling action when honeypot is filled', async () => {
    const onSubmitted = vi.fn()
    render(<MembershipForm onSubmitted={onSubmitted} />)
    const user = userEvent.setup()

    // Simulate a bot filling the hidden honeypot field
    const honeypot = document.getElementById('website') as HTMLInputElement
    fireEvent.change(honeypot, { target: { value: 'http://spam.example.com' } })

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() => {
      expect(screen.getByText("Thank you — we'll be in touch soon.")).toBeInTheDocument()
    })
    expect(mockSubmit).not.toHaveBeenCalled()
    expect(onSubmitted).toHaveBeenCalledOnce()
  })
})
