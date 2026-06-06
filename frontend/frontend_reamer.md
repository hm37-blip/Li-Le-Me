# Li-Le-Me Frontend Directory Structure

To maintain consistent mini-program performance and efficient multi-developer collaboration, all frontend contributors (@Andy, @Cici) must follow the directory conventions below.

## Directory Tree

```text
frontend/
├── app.js                   # Global app logic (lifecycle hooks, openid retrieval)
├── app.json                 # Global config (page routes, tab bar)
├── app.wxss                 # Global stylesheet (theme colors, shared margin/padding)
├── project.config.json      # Project config (personal dev settings — do not commit)
├── sitemap.json             # Page indexing config
├── components/              # Reusable UI components
│   ├── rank-item/           # Single-row leaderboard entry component
│   └── ec-canvas/           # ECharts charting library wrapper
├── pages/                   # Page directories (one folder per page)
│   ├── index/               # Home: leaderboard preview (@Andy)
│   ├── login/               # Login / launch screen (@Cici)
│   ├── registration/        # LeetCode account binding (@Cici)
│   ├── squad/               # Squad & invite code page
│   ├── admin/               # Admin panel (Week 2 focus)
│   └── user/                # User profile & trend chart
├── static/                  # Static assets (do not place inside pages/)
│   ├── images/              # Icons, backgrounds, logos
│   └── styles/              # External CSS libraries
└── utils/                   # Utility modules
    ├── request.js           # wx.request wrapper (token injection, unified error handling)
    ├── util.js              # Date formatting and regex validation helpers
    └── constants.js         # Global constants (API base URL, invite codes, permission flags)
```
