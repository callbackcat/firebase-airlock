# #BuildHybridAI 2026: requirements checklist

Checked against the official rules and FAQ on 15 November 2026. Re-read both
before submitting; organisers can update them.

- Rules: https://firebasehybridaihackathon.devpost.com/rules
- FAQ: https://firebasehybridaihackathon.devpost.com/details/faqs

**Deadline: Monday 30 November 2026, 2:00 PM Pacific (22:00 in London).**
Commits pushed after that are not evaluated.

## Must have

| Requirement | Status | Notes |
|---|---|---|
| A Gen AI app built with Firebase AI Logic | Done | `src/models.ts` |
| AI Logic imported and called at runtime, not just named in the README | Done | `getGenerativeModel`, `generateContent` in `src/models.ts` |
| All of the app's AI inference goes through Firebase AI Logic | Done | No other provider. Do not add OpenRouter, a direct Gemini API call or a raw Prompt API call to the app. |
| At least one platform: Web (Chrome) with Gemini Nano 4 | Done in code, unverified at runtime | Needs a run on a real Chrome with the model |
| Both on-device and cloud inference (judges score hybrid use) | Done | Scrub is `ONLY_ON_DEVICE`, answer is `ONLY_IN_CLOUD`. The FAQ allows a mode per feature. |
| App Check | Partly | Debug token works locally and is accepted in submissions. A hosted build needs a real provider. |
| Public GitHub or GitLab repository | To do | Make it public before submitting |
| Open source licence file, visible in the repo's About section | To do | `LICENSE` is MIT (allowed; Apache is preferred, not required). Confirm GitHub shows it once the repo is public. |
| Repo contains all source, assets, run instructions and the value proposition | Done | `README.md`, `docs/setup.md` |
| No production keys, secrets, debug tokens, `.env` files or personal data in the repo | Done | `.env*` is git-ignored, the template is `env.example`, every letter is fictional |
| New project, or significantly updated after 11 November 2026 | Done | Started 15 November 2026 |
| Text description: how AI Logic is used, features, value proposition | To do | |
| Demo video: 3 minutes or less, public on YouTube, English or subtitled, shows the app running in Chrome | To do | Show the hybrid split early. No third-party logos or trademarks. Upload early; processing can take hours. |
| Free for judges to use until judging ends (16 December 2026) | To do | Keep the Firebase project alive until then |
| App supports English | Done | |

## Strongly encouraged

| Item | Status | Notes |
|---|---|---|
| Hosted project URL | To do | Judges may not test, but a link helps. Most judges' browsers will lack the local model, so the hosted page must make the pattern-only fallback obvious. |
| Coding agents with Firebase agent skills | Optional | https://firebase.google.com/docs/ai-assistance/agent-skills |
| Google IDEs (Antigravity, Android Studio) | Optional | Any tool is allowed |
| Other Firebase products: Remote Config, Firestore, Authentication | Not yet | Remote Config for the cloud model name and prompts is the natural first one |
| More than one platform | Not planned | Favoured for the Grand Prize; a single-platform app can still win |

## Allowed

- AI coding assistants, including Claude Code. Disclose any pre-existing code
  that is not a standard tool or template; there is none here.
- Third-party SDKs and open source, under their licences.

## Judging

Four criteria, equal weight, scored 1 to 5: technological implementation
(including how well hybrid inference is used), design (a product, not a proof
of concept), potential impact, and quality of the idea. Judges may decide from
the description and video alone, and automated analysis may be used.
