import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentSlide } from '@/app/display/content-slide'
import type { BulletinPost } from '@/lib/sanity/types'
import type { Event } from '@/lib/supabase/types'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makePost(overrides: Partial<BulletinPost> = {}): BulletinPost {
  return {
    _id: 'post-1',
    _type: 'bulletinPost',
    title: 'Summer Tournament Registration Open',
    body: [
      {
        _type: 'block',
        _key: 'b1',
        children: [
          {
            _type: 'span',
            _key: 's1',
            marks: [],
            text: 'Registration for the summer tournament is now open to all members.',
          },
        ],
        markDefs: [],
        style: 'normal',
      },
    ] as BulletinPost['body'],
    pinned: false,
    archived: false,
    publishedAt: '2026-06-01T12:00:00Z',
    ...overrides,
  }
}

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-1',
    title: 'Member Guest Tournament',
    description: 'Annual member-guest event at the club.',
    starts_at: '2026-07-15T14:00:00Z',
    ends_at: null,
    location: 'Fescue Golf Club',
    image_url: null,
    rsvp_enabled: false,
    created_by: null,
    created_at: '2026-06-01T00:00:00Z',
    ...overrides,
  }
}

// ─── Bulletin post slide ──────────────────────────────────────────────────────

describe('ContentSlide — bulletin post', () => {
  it('renders the post title', () => {
    render(<ContentSlide item={{ kind: 'post', data: makePost() }} />)
    expect(screen.getByText('Summer Tournament Registration Open')).toBeInTheDocument()
  })

  it('renders the BULLETIN BOARD category label', () => {
    render(<ContentSlide item={{ kind: 'post', data: makePost() }} />)
    expect(screen.getByText(/bulletin board/i)).toBeInTheDocument()
  })

  it('renders the body excerpt', () => {
    render(<ContentSlide item={{ kind: 'post', data: makePost() }} />)
    expect(
      screen.getByText(/registration for the summer tournament/i),
    ).toBeInTheDocument()
  })

  it('renders the published date when present', () => {
    render(<ContentSlide item={{ kind: 'post', data: makePost() }} />)
    expect(screen.getByText(/june 1, 2026/i)).toBeInTheDocument()
  })

  it('omits the date element when publishedAt is null', () => {
    render(<ContentSlide item={{ kind: 'post', data: makePost({ publishedAt: null }) }} />)
    expect(screen.queryByText(/june/i)).not.toBeInTheDocument()
  })

  it('renders without crashing when body is null', () => {
    expect(() =>
      render(<ContentSlide item={{ kind: 'post', data: makePost({ body: null }) }} />),
    ).not.toThrow()
    // Title still present
    expect(screen.getByText('Summer Tournament Registration Open')).toBeInTheDocument()
  })

  it('truncates body excerpts longer than 240 characters and appends ellipsis', () => {
    const longText = 'A'.repeat(250)
    const post = makePost({
      body: [
        {
          _type: 'block',
          _key: 'b1',
          children: [{ _type: 'span', _key: 's1', marks: [], text: longText }],
          markDefs: [],
          style: 'normal',
        },
      ] as BulletinPost['body'],
    })
    render(<ContentSlide item={{ kind: 'post', data: post }} />)
    expect(screen.getByText(/…$/)).toBeInTheDocument()
  })

  it('does not append ellipsis when excerpt is under 240 characters', () => {
    const shortText = 'B'.repeat(239)
    const post = makePost({
      body: [
        {
          _type: 'block',
          _key: 'b1',
          children: [{ _type: 'span', _key: 's1', marks: [], text: shortText }],
          markDefs: [],
          style: 'normal',
        },
      ] as BulletinPost['body'],
    })
    render(<ContentSlide item={{ kind: 'post', data: post }} />)
    expect(screen.queryByText(/…/)).not.toBeInTheDocument()
  })

  it('renders the club logo image', () => {
    render(<ContentSlide item={{ kind: 'post', data: makePost() }} />)
    expect(screen.getByRole('img', { name: /fescue golf club/i })).toBeInTheDocument()
  })

  it('concatenates text from multiple body blocks', () => {
    const post = makePost({
      body: [
        {
          _type: 'block',
          _key: 'b1',
          children: [{ _type: 'span', _key: 's1', marks: [], text: 'First sentence.' }],
          markDefs: [],
          style: 'normal',
        },
        {
          _type: 'block',
          _key: 'b2',
          children: [{ _type: 'span', _key: 's2', marks: [], text: 'Second sentence.' }],
          markDefs: [],
          style: 'normal',
        },
      ] as BulletinPost['body'],
    })
    render(<ContentSlide item={{ kind: 'post', data: post }} />)
    expect(screen.getByText(/first sentence.*second sentence/i)).toBeInTheDocument()
  })

  it('ignores non-block body nodes (e.g. images)', () => {
    const post = makePost({
      body: [
        {
          _type: 'image',
          _key: 'img1',
          asset: { _ref: 'ref', _type: 'reference' },
        },
        {
          _type: 'block',
          _key: 'b1',
          children: [{ _type: 'span', _key: 's1', marks: [], text: 'Only this.' }],
          markDefs: [],
          style: 'normal',
        },
      ] as unknown as BulletinPost['body'],
    })
    render(<ContentSlide item={{ kind: 'post', data: post }} />)
    expect(screen.getByText('Only this.')).toBeInTheDocument()
  })
})

// ─── Event slide ─────────────────────────────────────────────────────────────

describe('ContentSlide — event', () => {
  it('renders the event title', () => {
    render(<ContentSlide item={{ kind: 'event', data: makeEvent() }} />)
    expect(screen.getByText('Member Guest Tournament')).toBeInTheDocument()
  })

  it('renders the UPCOMING EVENT category label', () => {
    render(<ContentSlide item={{ kind: 'event', data: makeEvent() }} />)
    expect(screen.getByText(/upcoming event/i)).toBeInTheDocument()
  })

  it('renders the event date', () => {
    render(<ContentSlide item={{ kind: 'event', data: makeEvent() }} />)
    expect(screen.getByText(/july 15/i)).toBeInTheDocument()
  })

  it('renders the event time', () => {
    render(<ContentSlide item={{ kind: 'event', data: makeEvent() }} />)
    // starts_at is 14:00 UTC = 2:00 PM UTC (locale-dependent but should include a time)
    expect(screen.getByText(/·/)).toBeInTheDocument()
  })

  it('renders the location when present', () => {
    render(<ContentSlide item={{ kind: 'event', data: makeEvent() }} />)
    expect(screen.getByText('Fescue Golf Club')).toBeInTheDocument()
  })

  it('omits the location element when location is null', () => {
    render(
      <ContentSlide item={{ kind: 'event', data: makeEvent({ location: null }) }} />,
    )
    expect(screen.queryByText('Fescue Golf Club')).not.toBeInTheDocument()
  })

  it('renders the description when present', () => {
    render(<ContentSlide item={{ kind: 'event', data: makeEvent() }} />)
    expect(screen.getByText(/annual member-guest event/i)).toBeInTheDocument()
  })

  it('omits the description element when description is null', () => {
    render(
      <ContentSlide item={{ kind: 'event', data: makeEvent({ description: null }) }} />,
    )
    expect(screen.queryByText(/annual member-guest event/i)).not.toBeInTheDocument()
  })

  it('truncates descriptions longer than 200 characters with ellipsis', () => {
    const event = makeEvent({ description: 'C'.repeat(210) })
    render(<ContentSlide item={{ kind: 'event', data: event }} />)
    expect(screen.getByText(/…$/)).toBeInTheDocument()
  })

  it('does not truncate descriptions of 200 characters or fewer', () => {
    const event = makeEvent({ description: 'C'.repeat(200) })
    render(<ContentSlide item={{ kind: 'event', data: event }} />)
    expect(screen.queryByText(/…/)).not.toBeInTheDocument()
  })

  it('renders the club logo image', () => {
    render(<ContentSlide item={{ kind: 'event', data: makeEvent() }} />)
    expect(screen.getByRole('img', { name: /fescue golf club/i })).toBeInTheDocument()
  })

  it('renders without crashing when all optional fields are null', () => {
    const event = makeEvent({ description: null, location: null, ends_at: null })
    expect(() =>
      render(<ContentSlide item={{ kind: 'event', data: event }} />),
    ).not.toThrow()
  })
})
