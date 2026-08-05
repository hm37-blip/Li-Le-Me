#  CESA LeetCode Tracker (微信力了么 Mini-Program)

> A data-driven, social-incentive Mini-Program designed to gamify LeetCode practice for campus tech communities through automated rank tracking, peer accountability, and interactive performance visualization.

---

## Product Overview

The **UIUC LeetCode Tracker** bridges the gap between individual interview preparation and peer-driven motivation. By leveraging real-time data ingestion via LeetCode's GraphQL API and social dynamics within WeChat, the platform tracks daily algorithmic problem-solving progress, quantifies user effort via weighted performance metrics, and dynamically updates squad leaderboards.

### Key Features
* **Seamless Authentication & Onboarding:** Multi-stage WeChat OAuth flow with progressive profile completion and LeetCode ID binding.
* **Algorithmic Weighting Engine:** Customized scoring algorithm prioritizing question difficulty (1 : 2 : 3 scale for Easy, Medium, Hard).
* **Squad & Social Mechanics:** Invite-only squad interactions capped at 50 members with automated level locks and active user management.
* **Data Visualization & Analytics:** Interactive ECharts dashboards depicting 7-day/30-day cumulative progress trends with automated zero-padding data pipelines.
* **Gamified Tier System:** Dynamic percentile-based tiering (Top 20%, Elite, Elite Plus, NPC, Done) driven by automated daily settlement cron jobs.

---

##  System Architecture & Auth Flow

###  Authentication Specification
* **Mechanism:** WeChat Login API (`wx.login`) exchanging `js_code` for a signed JSON Web Token (JWT) encapsulating `OpenID` and `ExpireTime`.
* **Header Standard:** `Authorization: Bearer <Your_Token_Here>` required for all non-login endpoints.
* **Invalidation Handling:** Backend returns `HTTP 401 Unauthorized` for expired/tampered tokens; frontend automatically clears storage and prompts re-authentication.

```text
[WeChat Client] ──(wx.login)──> [Backend Service] ──(Exchange js_code)──> [WeChat Auth API]
      │                                │                                       │
      │<───────(Return JWT Token)──────┴<────────(Return OpenID)───────────────┘
      │
[Store Token (wx.setStorageSync)] ──(Bearer Token)──> [Protected APIs /api/v1/*]
