# Setup: what the tests need from you

About 15 minutes, no payment details, no AI API key.

## You need

| | What | Why |
|---|---|---|
| 1 | A desktop computer with Chrome and the on-device model | The scrub step runs on it. A cloud coding session cannot do this part. |
| 2 | A Firebase project with AI Logic enabled | Every model call goes through it. Free. |
| 3 | An App Check debug token | Firebase AI Logic rejects calls without App Check. |
| 4 | A `.env.local` file holding 2 and 3 | Never committed. |
| 5 | Claude Code running on that same computer | It drives Chrome and reads the results. |

You do **not** need: an OpenRouter key or any other AI provider key, a credit
card, or a Google quota account. The hackathon FAQ says all of the app's AI
inference should go through Firebase AI Logic, so another provider would break
the rules, and the test does not need one.

## 1. Chrome with the on-device model

- Update desktop Chrome to the latest version.
- Open `chrome://flags`, search for **Gemma 4 for Built-in AI**, set it to
  Enabled and relaunch. This is the step the hackathon FAQ gives. If the flag
  is not listed, try Chrome Beta or Canary.
- Chrome's published requirements for the built-in model are roughly: 22 GB of
  free disk space, and either a GPU with more than 4 GB of VRAM or 16 GB of RAM
  with 4 CPU cores. Check `chrome://on-device-internals` to see whether your
  machine qualifies and whether the model has downloaded.

The test scripts use a separate Chrome profile (`.chrome-profile/`), so your
own browsing profile is not touched. That profile needs the flag too. Claude
Code will try to set it and will ask you for one click if it cannot.

## 2. Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) and
   create a project. Google Analytics is not needed.
2. Open **AI Logic** and click **Get started**. Choose the
   **Gemini Developer API**. It needs no billing account.
3. Follow the workflow. It registers a web app and turns on App Check for AI
   Logic.
4. In **Project settings > Your apps > Web app**, copy the `firebaseConfig`
   object.

The Firebase web config is not a secret, but keep it in `.env.local` anyway so
the repository works for anyone's project.

## 3. App Check debug token

1. Generate a UUID: `uuidgen | tr 'A-Z' 'a-z'`
2. In the Firebase console, open **App Check > Apps**, find your web app, open
   its menu and choose **Manage debug tokens**. Add the UUID.

Treat this token like a password. The hackathon FAQ says never to commit App
Check debug tokens.

## 4. `.env.local`

```bash
cp env.example .env.local
```

Fill in two lines:

```
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","appId":"..."}
VITE_APPCHECK_DEBUG_TOKEN=<the UUID from step 3>
```

The config must be one line of valid JSON, with double quotes around keys.

## 5. Check it

```bash
npm install
npm test
npm run eval
```

The first lines `npm run eval` prints tell you where you stand:

| Output | Meaning |
|---|---|
| `No Firebase config` | `.env.local` is missing or `VITE_FIREBASE_CONFIG` is not valid JSON. |
| `LanguageModel is not defined` | The Prompt API is off in the test profile. The flag is not set there. |
| `availability() = unavailable` | Chrome has no usable model: flag, hardware or disk space. |
| `availability() = downloadable` or `downloading` | Fine. The first run downloads the model, which can take a while. |
| `availability() = available` | Ready. |
| Verdict `NO-MODEL` | The benchmark ran on patterns only. Fix the model first. |

## 6. Open the app

```bash
npm run dev
```

Open the address it prints. Load the sample letter: the right-hand pane shows
what would be sent, and the line under it says when the text became safe and
when the on-device model finished. The first use may download the model.

## What I have not verified

I wrote these steps from the Firebase and Chrome documentation and the
hackathon FAQ, not from a run against a real project. Console labels may
differ slightly. If a step does not match what you see, the documentation
wins:

- https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
- https://firebase.google.com/docs/app-check/web/debug-provider
- https://firebasehybridaihackathon.devpost.com/details/faqs
