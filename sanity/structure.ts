import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Fescue Club')
    .items([
      // ── Pages ──────────────────────────────────────────────────────────────
      S.listItem()
        .title('Homepage')
        .id('homePage')
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage')
            .title('Homepage'),
        ),

      S.listItem()
        .title('About Page')
        .id('aboutPage')
        .child(
          S.document()
            .schemaType('aboutPage')
            .documentId('aboutPage')
            .title('About Page'),
        ),

      S.listItem()
        .title('Announcement Banner')
        .id('announcement')
        .child(
          S.document()
            .schemaType('announcement')
            .documentId('announcement')
            .title('Announcement Banner'),
        ),

      S.divider(),

      // ── Content ────────────────────────────────────────────────────────────
      S.listItem()
        .title('Bulletin Board')
        .child(
          S.documentTypeList('bulletinPost')
            .title('Bulletin Posts')
            .defaultOrdering([
              { field: 'pinned', direction: 'desc' },
              { field: 'publishedAt', direction: 'desc' },
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Club Champions')
        .child(
          S.documentTypeList('clubChampion')
            .title('Club Champions')
            .defaultOrdering([{ field: 'year', direction: 'desc' }]),
        ),
    ])
