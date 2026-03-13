import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Fescue Club')
    .items([
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
        .title('Social Calendar')
        .child(
          S.documentTypeList('socialEvent')
            .title('Social Events')
            .defaultOrdering([{ field: 'date', direction: 'asc' }]),
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
