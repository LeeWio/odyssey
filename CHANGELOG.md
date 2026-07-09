# [1.7.0](https://github.com/LeeWio/odyssey/compare/v1.6.0...v1.7.0) (2026-07-09)


### Features

* **blog:** implement core blog reader, test playground, and active floating toc ([76865b7](https://github.com/LeeWio/odyssey/commit/76865b70f335a2fc71c9a5c906fd41ec03977f88))
* **home:** redesign digital sanctuary home page, implement SSR-safe theme loader, and date-picker test page ([af2217e](https://github.com/LeeWio/odyssey/commit/af2217e1b1c776f4a599d2a93cb970d759c40995))

# [1.6.0](https://github.com/LeeWio/odyssey/compare/v1.5.0...v1.6.0) (2026-07-03)


### Features

* **portfolio:** implement dynamic Investment Wisdom card with world-class master quotes ([b7e4e84](https://github.com/LeeWio/odyssey/commit/b7e4e84940fcb1ba599759577c4194ff44bbaf7e))

# [1.5.0](https://github.com/LeeWio/odyssey/compare/v1.4.0...v1.5.0) (2026-07-03)


### Features

* **portfolio:** implement dynamic Investment Wisdom card with world-class master quotes ([8ef5e13](https://github.com/LeeWio/odyssey/commit/8ef5e13d2de22eff0e7d0dcb7c5bfb54dcee1560))

# [1.4.0](https://github.com/LeeWio/odyssey/compare/v1.3.0...v1.4.0) (2026-07-03)


### Features

* **portfolio:** integrate HeroUI Pro PieChart with Custom Tooltip and restructure layout ([f7115d0](https://github.com/LeeWio/odyssey/commit/f7115d0cf5928ded2fafa735c452d7f980901901))

# [1.3.0](https://github.com/LeeWio/odyssey/compare/v1.2.0...v1.3.0) (2026-07-03)


### Features

* **portfolio:** integrate HeroUI Pro PieChart for dynamic Asset Allocation and remove unused icon imports ([4c16983](https://github.com/LeeWio/odyssey/commit/4c169837006bfcca2b653943895986f9e5c19cea))

# [1.2.0](https://github.com/LeeWio/odyssey/compare/v1.1.0...v1.2.0) (2026-07-03)


### Features

* **portfolio:** remove market index bar ticker, redundant separators, and unused icon imports ([a65b572](https://github.com/LeeWio/odyssey/commit/a65b5728b3c6fce261ae933543e5bc504b1858fa))

# [1.1.0](https://github.com/LeeWio/odyssey/compare/v1.0.0...v1.1.0) (2026-07-03)


### Features

* **portfolio:** upgrade metrics row with HeroUI Pro KPIGroup and add tactile active card scale transitions ([ccd79e1](https://github.com/LeeWio/odyssey/commit/ccd79e1f147d96e207ba64c966a633508381b348))

# 1.0.0 (2026-07-03)


### Bug Fixes

* add missing prop types for IntlProvider to resolve TS errors ([635795b](https://github.com/LeeWio/odyssey/commit/635795b9548be3a83d3bb5020e821bd6571dd9ff))
* **auth:** import missing gsap library in log-in modal ([84adb82](https://github.com/LeeWio/odyssey/commit/84adb829c87ce42325c25f7773b729aaed12e363))
* **auth:** prevent focus ring clipping in modals using negative margin ([afc8e31](https://github.com/LeeWio/odyssey/commit/afc8e318cceed71a0adcd5136f2962ff9eab857a))
* **auth:** resolve login step transition freeze ([a0b20c8](https://github.com/LeeWio/odyssey/commit/a0b20c884a69117e9fac1a4b25e470be567af971))
* **auth:** resolve querySelectorAll syntax error in GSAP animation ([fb8a2ce](https://github.com/LeeWio/odyssey/commit/fb8a2ce41bde9aef252cee021dd229861154cb20))
* **auth:** resolve React 19 form transition abort error ([65fb346](https://github.com/LeeWio/odyssey/commit/65fb3466fcbe02cf45a9c649240bde0777ca99ba))
* **command-palette:** clear search input value upon closing and translate all Chinese keywords into English ([1cbdbdf](https://github.com/LeeWio/odyssey/commit/1cbdbdf316dbe940115cd9730f26c2c2d7fbd8d9))
* **dashboard:** preserve pie chart colors for empty device data ([cb96cb6](https://github.com/LeeWio/odyssey/commit/cb96cb6d662df080e8b3fdae164c30949a1d6f1a))
* **dashboard:** refine KPI row loading state with granular skeletons ([c4b2365](https://github.com/LeeWio/odyssey/commit/c4b2365900b5b87dc7b11ead15d996bcf706d11e))
* **dashboard:** resolve maximum update depth infinite loop inside PermissionsPage ([bc6565e](https://github.com/LeeWio/odyssey/commit/bc6565e2f0cd9d549bdc693808ec663ad51a90c6))
* **file:** use unique backend fileName UUID instead of originalName for DELETE request ([5eca999](https://github.com/LeeWio/odyssey/commit/5eca999eb4188ca2d5a43602bd96c09813c9814f))
* **hero:** remove duplicate containerVariants definition ([522e8e7](https://github.com/LeeWio/odyssey/commit/522e8e7ba9445d02e7b9b6ac0ff1733a727f31a3))
* **i18n:** configure default timeZone for next-intl ([1f5febe](https://github.com/LeeWio/odyssey/commit/1f5febebea07487fca41078ae05c6816fa064112))
* **i18n:** provide timeZone to NextIntlClientProvider to resolve hydration warning ([2513fbc](https://github.com/LeeWio/odyssey/commit/2513fbccf63cde7c36ad63c824ff456b8e405058))
* **moments:** resolve dashboard sheet portal blocking by passing portalContainer to Modal and AlertDialog Backdrops ([08210a9](https://github.com/LeeWio/odyssey/commit/08210a9eab2fb8c701bee7aff6ac54438bbf17d2))
* **navbar:** wrap Avatar in Button within Dropdown.Trigger ([f83f165](https://github.com/LeeWio/odyssey/commit/f83f165c0252fd43bd8c949b6a99d71a9402b99a))
* remove capture stopPropagation on TagGroup wrapper to restore command dialog keyboard navigation ([1354dda](https://github.com/LeeWio/odyssey/commit/1354ddab4de550dcdf14ff826563ac99f85fff44))
* resolve SSR hydration mismatch on dashboard page caused by Redux auth state ([8ee0607](https://github.com/LeeWio/odyssey/commit/8ee0607c6f6ed2f695152e5c8e76a3d7bd56631c))
* restore useMounted hook in Navbar for safe hydration ([7b21750](https://github.com/LeeWio/odyssey/commit/7b217502feccad3cefe2038678f6b020343ac8d9))
* revert command palette scopes to use Chip to restore keyboard navigation ([6177730](https://github.com/LeeWio/odyssey/commit/6177730d352616e69cdb1b4f8deec2c4b527cdc7))
* **rich-text:** correct TextMenu shouldShow logic to exclude link selections ([7bbb394](https://github.com/LeeWio/odyssey/commit/7bbb39428118576a0b742e58c852ec8fbebbf9e4))
* **rich-text:** force-override Modal.Container centering to ensure document fullscreen is 100% full height/width ([46d4ca4](https://github.com/LeeWio/odyssey/commit/46d4ca49d04d8b3e79236f824df4626271a16503))
* safe selectors for dashboard state to prevent crash with persisted stale data ([a0a69ce](https://github.com/LeeWio/odyssey/commit/a0a69cedc66cce285d8ed7cb2b46a64296435e28))
* **ui:** resolve hydration error and types in animated numbers ([a0e511c](https://github.com/LeeWio/odyssey/commit/a0e511cf7ba85387c83d8d8e027ddfe125f4c495))


### Features

* add dashboard API endpoints and schemas ([3abc530](https://github.com/LeeWio/odyssey/commit/3abc530db514becd1c1ae40d593a9ed9277b068e))
* add dashboard sheet skeleton based on HeroUI Pro demo ([e856fde](https://github.com/LeeWio/odyssey/commit/e856fde98bd66160b21f2726d2b968420019a5b3))
* add global dashboard state to UI slice and dispatch via command palette ([7e0ba16](https://github.com/LeeWio/odyssey/commit/7e0ba16310fac62ceba26129f575fb20ade363c0))
* **auth:** add toast notifications for sendOtp endpoint ([f8df008](https://github.com/LeeWio/odyssey/commit/f8df008d6cd9bb620749cd548be73c22cea6429e))
* **blog:** implement StockLedger section with native Carousel & Card ([6809d0a](https://github.com/LeeWio/odyssey/commit/6809d0a0e3c81d03c8180ed1b46e668311b0a7c6))
* **blog:** refactor OrbitalCarousel to static layout and optimize TrueFocus ([88c451a](https://github.com/LeeWio/odyssey/commit/88c451af926763501ebb21c628cb34d31fcc4b1e)), closes [hi#impact](https://github.com/hi/issues/impact)
* **comment,moment:** implement public timeline, admin moderation DataGrid and threading controllers ([d7dc8d4](https://github.com/LeeWio/odyssey/commit/d7dc8d424c4f23d6931dc6c2aed0d3660ec39929))
* complete complex sidebar integration with gravity-ui icons in DashboardSheet ([da676ed](https://github.com/LeeWio/odyssey/commit/da676ed87a402f34ba4246fcde5e10b391095780))
* complete dashboard analytics update with daily trends and Top Content ranking ([c0c2e5c](https://github.com/LeeWio/odyssey/commit/c0c2e5ce85e246b3c9f26f7853c9883f4b3e6e6d))
* consolidate UI state and implement global sheet state management ([8d202af](https://github.com/LeeWio/odyssey/commit/8d202af2d0d31c47004ddd1e4c2b734aa88a1427))
* **dashboard:** add autoplay carousel widget and implement bento box grid layout ([59b9482](https://github.com/LeeWio/odyssey/commit/59b9482fa06a57385cbedc302d1c8847bd067232))
* **dashboard:** enhance dashboard footer with settings and refactor theme switch ([c3eca67](https://github.com/LeeWio/odyssey/commit/c3eca679fe1c91791fa47b6d7753bd4b7a42c48a))
* **dashboard:** implement categories/tags CRUD and 3D goodies orbital showcase ([8f62fc7](https://github.com/LeeWio/odyssey/commit/8f62fc746c51836f0157a2a71dc2f88bc71a3f3d))
* **dashboard:** implement dynamic time range switching (7D/30D/90D/12M) ([b59eecf](https://github.com/LeeWio/odyssey/commit/b59eecf2fe477dab5bbc73951cb409479aa9e377))
* **dashboard:** implement full Roles & Permissions RBAC management panel ([5d4c7a4](https://github.com/LeeWio/odyssey/commit/5d4c7a4508771a98117d6816a69b6819aba235f2))
* **dashboard:** implement premium calendar widget in action center ([cf3ab2d](https://github.com/LeeWio/odyssey/commit/cf3ab2ddcbe3d5b90386641f563d2cdd2e0b3198))
* **dashboard:** integrate backend API for top channels ([3466261](https://github.com/LeeWio/odyssey/commit/3466261de06cd86e13031ac6d618276d588e4797))
* **dashboard:** integrate backend API for top pages ([0c7a346](https://github.com/LeeWio/odyssey/commit/0c7a34694937d22c8fe682ea365b0bb7db8d9f57))
* **dashboard:** integrate backend API for traffic by device ([fe70c02](https://github.com/LeeWio/odyssey/commit/fe70c02ef1dffed336e7ccf8411ffa15605309f5))
* **dashboard:** integrate comments, moments, and materials panels into administrative console ([56e9060](https://github.com/LeeWio/odyssey/commit/56e906035d7dda0dd2e587b4f8e223d90cc01205))
* **dashboard:** integrate live market data in Stocks widget ([2676ae2](https://github.com/LeeWio/odyssey/commit/2676ae2479136681d8aa8a8f2d0282e6efa2c4c4))
* **dashboard:** integrate summary metrics and real-time sparklines for performance KPIs ([590949a](https://github.com/LeeWio/odyssey/commit/590949a40caab23196628afe6d75a5e3822bac3e))
* **dashboard:** integrate timeSeries and growthRate for sessions over time ([1577ee0](https://github.com/LeeWio/odyssey/commit/1577ee0a155c0097176fb77d08eb30d4d321f94d))
* **dashboard:** migrate template dashboard into sheet overlay ([999dcda](https://github.com/LeeWio/odyssey/commit/999dcda054c6a7e8e3f7eade99f5bb66bb4a7957))
* **dashboard:** refine UI layout, spacing, and semantic styling ([2e1c200](https://github.com/LeeWio/odyssey/commit/2e1c2001dadd91c43631cc8e1ac2206813eda977))
* **dashboard:** resolve popover flickering inside sheet dialog and implement full user actions ([37e8f91](https://github.com/LeeWio/odyssey/commit/37e8f91efe8fb2cc4f077902e3c7daa281918aa5))
* **editor:** add Create New Post command to palette and refine Redux control ([603c9bc](https://github.com/LeeWio/odyssey/commit/603c9bc97723c148c477246fd2b6eaf538fb5ee6))
* **editor:** integrate HeroUI Pro RichTextEditor with autosave support ([6bc3699](https://github.com/LeeWio/odyssey/commit/6bc3699d3e60789aab93dcda78778f37497cadfa))
* **editor:** integrate RichText modal with global Redux state and fix API infinite loop ([73124d7](https://github.com/LeeWio/odyssey/commit/73124d7dfce042863a18d3de0bf568051a7203d9))
* **file:** implement upload DropZone test page following official HeroUI Pro specification ([ddd5d1b](https://github.com/LeeWio/odyssey/commit/ddd5d1b542b632e72538fdf71399846f61bfb56a))
* finalize auth modal switching logic and real OTP integration ([f853b42](https://github.com/LeeWio/odyssey/commit/f853b42cd75fa638360272ec189d7a0b0c8aee75))
* **hero:** completely revamp hero section with Galaxy background and Framer Motion ([f41fbc4](https://github.com/LeeWio/odyssey/commit/f41fbc40c9ef927db0c05ea4e66d3bd356e56f1c))
* **hero:** integrate React Bits BlurText component ([84b13fb](https://github.com/LeeWio/odyssey/commit/84b13fbcc5b6ecd418aa69b6465607a5da856355))
* **home:** implement minimalist time and weather widget ([50aa8b5](https://github.com/LeeWio/odyssey/commit/50aa8b53a2670e14d8e70a51db23f45af3e3f5bc))
* **icons:** add premium music player icon set ([5ec2dc0](https://github.com/LeeWio/odyssey/commit/5ec2dc07c56e39e65ad2f9a22de2b1264d335d73))
* **icons:** add SunMaxFillIcon, MoonFillIcon and DisplayFillIcon with reactive gradients ([8ff2044](https://github.com/LeeWio/odyssey/commit/8ff2044ac638d908a5fdeaa143fe6acb24da39fb))
* implement animated auth modals and user dropdown in navbar ([6c1c5ff](https://github.com/LeeWio/odyssey/commit/6c1c5ff7126d872d7a26e487efe2003569cf101c))
* implement dashboard visualization with RBAC and HeroUI components ([1cfa8cd](https://github.com/LeeWio/odyssey/commit/1cfa8cd24b18ab2e5aa1a7da1cba589fe7ab48a9))
* implement dynamic theme CSS loading and fix brutalism dark mode ([de444ed](https://github.com/LeeWio/odyssey/commit/de444ede524a0e04a51dd363eea52e8d7f8b3eee))
* implement real-time dashboard analytics with HeroUI Pro components ([ac2039f](https://github.com/LeeWio/odyssey/commit/ac2039f8bd67fcdd0c2fdcccc045cab19985785d))
* implement rich mashup Dashboard panel with HeroUI Pro components ([07b3472](https://github.com/LeeWio/odyssey/commit/07b34721ab943a6b2619650f94232466a08d9eea))
* implement robust internationalization with next-intl and cookie-based switching ([b2c61f1](https://github.com/LeeWio/odyssey/commit/b2c61f109f3c3c1c9e2ba5d91dea5f86e785f565))
* integrate HeroUI Pro, next-themes, and global Command+K shortcut ([9aff4b2](https://github.com/LeeWio/odyssey/commit/9aff4b2713918ce21fe038257f66f9d81080d273))
* integrate real OTP login flow and enhance auth modals ([0ff4bde](https://github.com/LeeWio/odyssey/commit/0ff4bdea13078e68d2b1f6713363ddebe6c2ab58))
* **layout:** implement 3-column dashboard layout and update Galaxy styling ([9fe3d00](https://github.com/LeeWio/odyssey/commit/9fe3d00a7c56487d44efe41811f692dfee2c07e5))
* **market:** support individual period switching for market indices using new symbol-based API ([695fbbe](https://github.com/LeeWio/odyssey/commit/695fbbef8227c255af16f36b5678394add0ba556))
* **navbar:** add smooth staggered entrance animation ([ab0452f](https://github.com/LeeWio/odyssey/commit/ab0452f1517e3d8a6e5f742907acf519681fe885))
* **portfolio:** implement stock ledger module, build clean dashboard UI, and resolve all repository ESLint errors ([c1f487f](https://github.com/LeeWio/odyssey/commit/c1f487f768383eb34df990956ce7b135870a4186))
* **project:** unify theme layers, optimize RichText editor stability, and introduce user profile management ([18de26f](https://github.com/LeeWio/odyssey/commit/18de26f8756475ba6b617d61b4340beee71235f6))
* **rich-text:** add beautiful transitions and spacing to fullscreen writer mode ([5d5f710](https://github.com/LeeWio/odyssey/commit/5d5f7101cdd50c23f540d4f7515672b41c60df7d))
* **rich-text:** add BgColorPicker next to TextColorPicker in toolbar ([e453d66](https://github.com/LeeWio/odyssey/commit/e453d66620e4655f73ee8905cf826cf8e62921ce))
* **rich-text:** add FontFamilyPicker and update TextColorPicker styling ([3982e46](https://github.com/LeeWio/odyssey/commit/3982e46f3963537ced24bc164af72bd2573f7971))
* **rich-text:** add layout animation to BubbleMenu via Framer Motion ([d20aaf7](https://github.com/LeeWio/odyssey/commit/d20aaf772c9569e1ffe2b4fa11a4f6cf52c3aa10))
* **rich-text:** add LineHeightPicker and integrate with Tiptap editor ([33400fd](https://github.com/LeeWio/odyssey/commit/33400fd04c3ae850c9f7568c11dda84c9c53e89b))
* **rich-text:** add smart Indent and Outdent extension with dynamic disabled and active states ([701fda2](https://github.com/LeeWio/odyssey/commit/701fda2e5c7ccb04cb3ccb9f4ff6a68fafb2701f))
* **rich-text:** add subscript and superscript text alignment plugin ([8c149e7](https://github.com/LeeWio/odyssey/commit/8c149e7d9b0f406a01cf8a470316451f0b33e2e5))
* **rich-text:** add TextColorPicker using HeroUI ColorPicker ([4c239e3](https://github.com/LeeWio/odyssey/commit/4c239e3dd679ba41b260771e04a6aaf855234733))
* **rich-text:** implement multi-column Tiptap extension and toolbar integration ([0393c19](https://github.com/LeeWio/odyssey/commit/0393c19b6d6d9c7fc0c566815dcc3f1cec18cb51))
* **rich-text:** implement seamless publish settings side-panel and top-right toggle button ([0e7cf2a](https://github.com/LeeWio/odyssey/commit/0e7cf2af3e7bda848ae59873ea062418efdc76cc))
* **rich-text:** integrate immersive fullscreen mode using Mantine hooks ([7857cb0](https://github.com/LeeWio/odyssey/commit/7857cb05bc290aeedc2d75d74aa213b29642c4c6))
* **rich-text:** migrate to useFullscreenDocument with synchronized GSAP zoom transitions ([19ad0e2](https://github.com/LeeWio/odyssey/commit/19ad0e2dc517d5d1a1e1b9b0ae93ece78ea4fd05))
* **rich-text:** refactor fullscreen to simulated overlay with buttery smooth transitions and lint fixes ([888eb04](https://github.com/LeeWio/odyssey/commit/888eb040c8bf2ca9193924d1e04d11b3b2fad25f)), closes [hi#performance](https://github.com/hi/issues/performance)
* **rich-text:** remove settings header, cover image field, and form label icons for ultra-minimalist layout ([6ce9962](https://github.com/LeeWio/odyssey/commit/6ce99629203570cfbcf00d920d7372cb5d7bfb7b))
* **search:** implement pure React token-based search highlight using Tailwind and HeroUI accent colors ([5d68431](https://github.com/LeeWio/odyssey/commit/5d68431b3cd4b2931a206c409ce7ecc3ec475b5c))
* **ui:** enhance dashboard with motion animations, image optimization, and real game data ([432c5a2](https://github.com/LeeWio/odyssey/commit/432c5a2335ee5929174e9c05bca17a0bc21894f6))
* **ui:** implement GSAP-powered animated numbers and dynamic dashboard clock ([f4a43d8](https://github.com/LeeWio/odyssey/commit/f4a43d820a2e36e623e97487a4c1ee7982fee452))


### Performance Improvements

* **dashboard:** enable 5-minute polling and refetch on focus for Stocks widget ([c5472ec](https://github.com/LeeWio/odyssey/commit/c5472ece96e68a8c879c1db19cb0bb889441be33))
* **dashboard:** improve Stocks widget loading state and disable caching ([53c64a1](https://github.com/LeeWio/odyssey/commit/53c64a14a1bfb95d9d9bb603251f75ed8da198ab))
* **rich-text:** leverage hardware-accelerated native CSS transitions instead of GSAP for fullscreen morphing ([b446d6d](https://github.com/LeeWio/odyssey/commit/b446d6dda4f093413c890488280e918224cd8d93))
