# Changelog

## [1.1.1](https://github.com/P-v-R/fescue-web/compare/fescue-web-v1.1.0...fescue-web-v1.1.1) (2026-03-26)


### Bug Fixes

* release-please target-branch should be main not staging ([14343b6](https://github.com/P-v-R/fescue-web/commit/14343b63c718d990dc23df49298897d5bb11c422))

## [1.1.0](https://github.com/P-v-R/fescue-web/compare/fescue-web-v1.0.2...fescue-web-v1.1.0) (2026-03-25)


### Features

* add custom OG image — navy background with badge logo ([c6cda1b](https://github.com/P-v-R/fescue-web/commit/c6cda1b691d76a7f7bc31dc44991671b96290fc5))
* add Release Please for automated release PRs and changelog ([d9216e3](https://github.com/P-v-R/fescue-web/commit/d9216e3bf911f0a3feb283ea9c7d43aa5ae40800))
* add static Google Maps location section to about page ([997287f](https://github.com/P-v-R/fescue-web/commit/997287f334b38169791d3547e836604de0ed1f1e))
* booking confirmation email + per-purpose from addresses ([037f279](https://github.com/P-v-R/fescue-web/commit/037f27966184df3ae7589cd4d04b1b9707a69a1e))
* clubhouse carousel with crossfade + Sanity schema update ([9ae340d](https://github.com/P-v-R/fescue-web/commit/9ae340d4c5c11c9020bff970b7dfdcf5201922cd))
* CMS-controlled homepage and about page content via Sanity ([4490983](https://github.com/P-v-R/fescue-web/commit/4490983c8feb6e27874b7e8a01715d96662603e9))
* collect phone and discord on member onboarding ([792cbe5](https://github.com/P-v-R/fescue-web/commit/792cbe5b3d63570c1f21129557cdcc7244eeddf6))
* event photo upload via Supabase Storage ([c9fe399](https://github.com/P-v-R/fescue-web/commit/c9fe3996988626e1bf08961124661f9ecf1ad693))
* events & RSVP system + full-bleed homepage feature photo ([46c99ce](https://github.com/P-v-R/fescue-web/commit/46c99cecfb1404c4540d0c03ee1d4ef75ca759fd))
* expanded admin panel — dashboard stats, member search, profiles, book on behalf ([314e701](https://github.com/P-v-R/fescue-web/commit/314e701116fafa15c0183674c22d3f09901f787f))
* member contact info and directory ([ba88683](https://github.com/P-v-R/fescue-web/commit/ba8868313e470577701b1ba56ef97638617ecc2f))
* member directory redesign + member_since field ([bc9272c](https://github.com/P-v-R/fescue-web/commit/bc9272cda9d2c2b4e3b2245fa346c354dd87e14a))
* member directory redesign + member_since field ([488424e](https://github.com/P-v-R/fescue-web/commit/488424e412a81ef98732bb541f2a32c47cd57e9e))
* member directory redesign, member_since field, quail public nav ([739f116](https://github.com/P-v-R/fescue-web/commit/739f116ec4b74b3ab1ce4de2d078c0167e2e28a9))
* member self-registration + admin approval flow ([c40703f](https://github.com/P-v-R/fescue-web/commit/c40703fa6672aef595f87cd3e4f6ec08e15da52a))
* membership pipeline, club champion, member directory cards, phone formatting ([c250188](https://github.com/P-v-R/fescue-web/commit/c2501887b6c119b19360935c0456b0085944b064))
* mobile-first booking experience + calendar UX fix ([9f01a00](https://github.com/P-v-R/fescue-web/commit/9f01a0087f5fd1d32a92411007f5cffefd03da3b))
* **mobile:** all bays view uses scrollable grid like desktop ([4117c14](https://github.com/P-v-R/fescue-web/commit/4117c1406d7370ad6af0816067526c338d9ceacd))
* **mobile:** view toggle (By Bay / All Bays) + member name on bookings ([697cca1](https://github.com/P-v-R/fescue-web/commit/697cca1d09eb7342df09256723aaa2165204f732))
* personalised invites, duplicate prevention, rescind ([bd48911](https://github.com/P-v-R/fescue-web/commit/bd48911cd42f55ecef5c8b15a02865e019f09264))
* personalised welcome heading on invite page ([c75ca4f](https://github.com/P-v-R/fescue-web/commit/c75ca4fba53be694b1eee0969ef8704c7cd0d8e3))
* public page polish — paper texture, contrast fixes, placeholder styling ([b60f220](https://github.com/P-v-R/fescue-web/commit/b60f220f88108ddf1201f129e42ed72e92ff4e78))
* reservation UX improvements + member card readability ([b5bf679](https://github.com/P-v-R/fescue-web/commit/b5bf679dc600f54a038a721492ef7a053b8098b2))
* run Supabase migrations automatically on release to main ([1784d38](https://github.com/P-v-R/fescue-web/commit/1784d38bc56e2f117ef04262d2f8b0173b6fad58))
* sanity cms homepage/about content control + announcement ticker ([7126c5b](https://github.com/P-v-R/fescue-web/commit/7126c5bdfe44186203eafb9315768ce32ddbd33a))


### Bug Fixes

* add 30min to duration_minutes type in Booking and NewBooking ([25e2f86](https://github.com/P-v-R/fescue-web/commit/25e2f8675eafe567f261754a838b8559dc9ad566))
* allow Supabase Storage hostname for next/image ([2015dd2](https://github.com/P-v-R/fescue-web/commit/2015dd25b04a36b1ec00a385a8d1934eb67bdf4b))
* cleanup setTimeout memory leaks and parallelize server fetches ([c793b2e](https://github.com/P-v-R/fescue-web/commit/c793b2edc666e3c2b914b9c25db5ca70d08a9d7b))
* event timezone off-by-one-day in calendar and edit form ([ed7e4b0](https://github.com/P-v-R/fescue-web/commit/ed7e4b038536cb30aee8464f8acfe448ed413ef8))
* include remaining admin actions changes ([903f70e](https://github.com/P-v-R/fescue-web/commit/903f70e6a9d88b0a48d7c685533e3e1b12d2d433))
* lint formatting on members directory page ([e5c09fd](https://github.com/P-v-R/fescue-web/commit/e5c09fd893708050ac4e1addad8ab94012c625a9))
* make Active Members heading a link to /admin/members ([dfd9d5a](https://github.com/P-v-R/fescue-web/commit/dfd9d5a538261d1dcf4a64715de91bf6b2a6dc18))
* make Resend from address configurable via env var ([d84851b](https://github.com/P-v-R/fescue-web/commit/d84851b3de40a95206570553f7b61e8e372d7765))
* member directory cards stack on mobile to prevent misaligned columns ([1ae7e40](https://github.com/P-v-R/fescue-web/commit/1ae7e40cf735b2d78e95eb0d34bef723740b3f53))
* push only tag on release, not a commit to main ([0113990](https://github.com/P-v-R/fescue-web/commit/0113990aba43d1b951bb17c5d7b83de832e40818))
* reduce paper texture opacity by 33% ([9c828c1](https://github.com/P-v-R/fescue-web/commit/9c828c1f6b06225b1f0b7e07b89005409a6eeab7))
* remove Bay 4 — club has Bay 1, 2, 3 and Big Bay only ([2ea74ac](https://github.com/P-v-R/fescue-web/commit/2ea74ac1cad0f6009b5808255663f6ab31188dcc))
* remove member table from admin tab, keep only link to /admin/members ([306afc5](https://github.com/P-v-R/fescue-web/commit/306afc5308c236e81b65d90135a8e1f164fda202))
* replace CSS tooltip with Radix tooltip on bay timeline — fixes clipping and hover area ([3f87186](https://github.com/P-v-R/fescue-web/commit/3f87186b94afe97abb663517523a75917f33dcb9))
* replace Edit Contact Info button with pencil icon next to section header ([9e85856](https://github.com/P-v-R/fescue-web/commit/9e858563be2829ab808756a988c540979acf3e42))
* reservation grid contrast and member names on booked cells ([88016fe](https://github.com/P-v-R/fescue-web/commit/88016fe457b68aa2c000e8a554e87727f59bdc75))
* resolve infinite recursion in admin RLS policies using security definer function ([731fff6](https://github.com/P-v-R/fescue-web/commit/731fff681fae145fe88e0690cd23234371f2e974))
* resolve RLS recursion on bookings, bays, invites, and membership_requests ([fb2ab9e](https://github.com/P-v-R/fescue-web/commit/fb2ab9eb6729883f10c9688e824f42cb85ca4001))
* rich hover tooltips on admin bay timeline showing member, time, guests ([db09ef6](https://github.com/P-v-R/fescue-web/commit/db09ef66aa94e07645fbff42018a58672ad7f251))
* set metadataBase to resolve OG image URLs ([e2ef8cd](https://github.com/P-v-R/fescue-web/commit/e2ef8cd5c690ab2ef2c37ee990a1b14a8691147b))
* tighten member directory cards to 3-column grid with aligned labels ([0cf96e5](https://github.com/P-v-R/fescue-web/commit/0cf96e51fcb119517f0405da50126de0e6262a03))
* use mix-blend-multiply for high-quality logo on dark backgrounds ([35af7b2](https://github.com/P-v-R/fescue-web/commit/35af7b22cf4f970eb2c66236228bf60485cbc163))
* use supabase link before db push in release workflow ([a1eb578](https://github.com/P-v-R/fescue-web/commit/a1eb578eed9caf4c5d36ae7916ff3b604c001ddd))
