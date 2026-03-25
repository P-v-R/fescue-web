import type { StructureResolver } from 'sanity/structure'
import { createHubPane } from './components/hub-pane'
import type { HubItem } from './components/hub-pane'

const marketingItems: HubItem[] = [
  {
    id: 'homePage',
    icon: '🏠',
    title: 'Homepage',
    description:
      'The public-facing home page — hero text, feature strip photos, clubhouse carousel, our story, and partner logos.',
  },
  {
    id: 'aboutPage',
    icon: '📖',
    title: 'About Page',
    description: 'The "About" page content visible to visitors on the public website.',
  },
]

const clubItems: HubItem[] = [
  {
    id: 'announcement',
    icon: '📢',
    title: 'Announcement Banner',
    description:
      "A highlighted notice shown at the top of every member's dashboard. Use this for urgent news, closures, or upcoming events.",
  },
  {
    id: 'bulletin',
    icon: '📋',
    title: 'Bulletin Board',
    description:
      'News posts and updates that appear in the member dashboard feed. Members see these when they log in. Pinned posts stay at the top.',
  },
  {
    id: 'champions',
    icon: '🏆',
    title: 'Club Champions',
    description:
      'The leaderboard that displays member achievements by year. Add a new entry each season to recognise the champion.',
  },
]

const MarketingHub = createHubPane(marketingItems)
const ClubHub = createHubPane(clubItems)

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Fescue Club')
    .items([

      // ── 📣 Marketing Site ────────────────────────────────────────────────
      S.listItem()
        .title('📣 Marketing Site')
        .child(
          S.component(MarketingHub)
            .title('Marketing Site')
            .child((id) => {
              if (id === 'homePage')
                return S.document().schemaType('homePage').documentId('homePage').title('Homepage')
              if (id === 'aboutPage')
                return S.document()
                  .schemaType('aboutPage')
                  .documentId('aboutPage')
                  .title('About Page')
              return S.list().title('Not found').items([])
            }),
        ),

      // ── 🏌️ Club Management ───────────────────────────────────────────────
      S.listItem()
        .title('🏌️ Club Management')
        .child(
          S.component(ClubHub)
            .title('Club Management')
            .child((id) => {
              if (id === 'announcement')
                return S.document()
                  .schemaType('announcement')
                  .documentId('announcement')
                  .title('Announcement Banner')
              if (id === 'bulletin')
                return S.documentTypeList('bulletinPost')
                  .title('Bulletin Board')
                  .defaultOrdering([
                    { field: 'pinned', direction: 'desc' },
                    { field: 'publishedAt', direction: 'desc' },
                  ])
              if (id === 'champions')
                return S.documentTypeList('clubChampion')
                  .title('Club Champions')
                  .defaultOrdering([{ field: 'year', direction: 'desc' }])
              return S.list().title('Not found').items([])
            }),
        ),
    ])
