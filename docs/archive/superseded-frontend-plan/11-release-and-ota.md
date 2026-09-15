# 11 — Release and OTA delivery

## 11.1 Why OTA is a product requirement here

The audience does not update apps. Field influencers on ₹10,000 phones with limited data do not open
the Play Store, and this app is a means to points and gifts, not something they browse. Without OTA, a
wrong points label or a broken demand form persists in the field for weeks regardless of how fast the
fix is written.

EAS Update is the mechanism, and it carried a weight of 5 in the stack comparison
(`02-alternatives-considered.md` §2.1) for exactly this reason.

**What OTA can and cannot ship:**

| Can | Cannot |
| --- | --- |
| JS, TypeScript, and all React code | A new native module (maps, camera, an SDK) |
| Images, fonts, Lottie, locale files | An Expo SDK upgrade |
| Copy and translation fixes | A permission or `app.config.ts` change |
| Styling and token changes | A change to native build config |
| Query keys, caching, API paths | Anything requiring `expo prebuild` |

Everything in the left column is the overwhelming majority of post-launch changes on a design-driven
app. That is what makes this worth building the release process around.

## 11.2 Build profiles

`eas.json`, three profiles, each with a distinct job:

| Profile | Distribution | API base URL | Purpose |
| --- | --- | --- | --- |
| `development` | Dev client, internal | staging or local | Day-to-day development on a physical device. This — not Expo Go — is the dev target, because Expo Go has none of the native modules |
| `preview` | Internal distribution APK / TestFlight | staging | Every `main` build. What QA, design and the ops team install |
| `production` | Play Store AAB / App Store | production | Releases |

Three details that prevent the usual mistakes:

- **The dev client is built once and reinstalled rarely.** Rebuild it only when a native dependency
  changes. Everything else is a Metro reload.
- **`preview` must be a release-mode JS bundle**, otherwise QA measures development performance and
  every number in `09-performance-budget.md` is wrong.
- **Bundle identifiers differ per profile** so a tester can hold the preview and production apps side
  by side. This also means separate Google Maps API keys per identifier (§8.1).

## 11.3 Channels and runtime versions

This is where OTA goes wrong, so it is worth being explicit.

```
channel: production  ──▶ branch: production   (users on the store build)
channel: preview     ──▶ branch: main         (internal testers)
```

**Runtime version must be fingerprint-based**, not a hand-written string:

```jsonc
// app.config.ts
{ "runtimeVersion": { "policy": "fingerprint" } }
```

Expo computes the fingerprint from the native dependency graph. The property this buys is the one that
matters: **an update whose native requirements differ from an installed binary is not delivered to
it.** A hand-maintained `runtimeVersion: "1.0.0"` that someone forgets to bump after adding a native
module ships JS that calls a native method the installed binary does not have — an instant crash loop
in the field, on a device population you cannot reach. Fingerprinting makes that impossible rather
than merely unlikely.

**Rollback is a republish, not a delete.** `eas update:republish` the previous known-good update.
Deleting an update does not recall it from devices that already have it.

## 11.4 The release flow

```
feature branch
   └─▶ PR: typecheck, lint, drift check, tests, perf, bundle size   (§10.6)
        └─▶ merge to main
             ├─▶ eas update --channel preview       ← JS-only change: testers have it in minutes
             └─▶ eas build --profile preview        ← native change: new APK for testers
                  └─▶ QA on the reference device + Maestro E2E
                       └─▶ tag ─▶ eas build --profile production ─▶ Play internal test track
                            └─▶ staged rollout: 10% → 50% → 100%
```

**Staged rollout is not optional for this audience.** A crash that only manifests on a Unisoc SoC with
2 GB RAM will not appear in QA. A 10% rollout with Sentry release health watched for 24 hours is what
catches it, and the Play Console rollout can be halted mid-flight.

**A hotfix takes one of two paths**, and choosing correctly matters:

- **JS-only** → `eas update --channel production`. In the field within minutes of the app's next
  foreground. This is the reason for the whole stack choice.
- **Native** → a full store release. Days. Which is why §8.7 requires deliberate review before any new
  native dependency: each one narrows what a hotfix can reach.

## 11.5 The OTA policy that keeps store review happy

Both stores permit JavaScript updates to an interpreted runtime; both prohibit using that channel to
change what the app fundamentally is. Written as rules:

1. **OTA ships fixes and refinements, never new primary functionality.** A new industry module with a
   new screen goes through the store. A corrected label, a fixed filter, a restyled card does not.
2. **Never OTA a change that would alter the app's store listing** — new permissions, new data
   collection, a new SDK. Those are listing changes by definition.
3. **Every OTA update is tagged and traceable** to a commit, and reported to Sentry as a release so
   crash reports attribute to the right JS bundle rather than to the binary.
4. **Never OTA on a Friday.** Sentry release health needs a working day of attention behind it.

## 11.6 Version gating

The server contract already carries a version gate on `GET /config`. Use it for the two cases OTA
cannot solve:

| Case | Behaviour |
| --- | --- |
| **Soft gate** — a newer build is available | Dismissible in-app prompt with a store link |
| **Hard gate** — this build can no longer talk to the API | Blocking screen with a store link, in the user's language, with copy that explains *why* rather than just demanding an update |

A hard gate is a last resort — for this audience it is close to churn — so it should only fire on a
genuine contract break. The correct default is a backwards-compatible API and an OTA update, which is
precisely what §11.1 and `06-data-layer-and-api.md` are arranged to make possible.

## 11.7 Store listing groundwork

Not glamorous, and it blocks the first release, so it belongs in Phase 0 rather than Phase 5:

- [ ] Play Console and App Store Connect accounts, with the correct legal entity
- [ ] **Data safety form** (Android) and **privacy manifest** (iOS) — driven by the SDK list in §8.4
      and re-checked whenever one is added
- [ ] Privacy policy and terms URLs, hosted, and reachable from the app
- [ ] Store listing in `en`, `hi`, `mr` — the same three locales as the app
- [ ] Screenshots captured from the reference device, not an emulator at an idealised resolution
- [ ] Signing keys in EAS-managed credentials, with the Android SHA-1 recorded because the Maps key
      restriction needs it (§8.1)
- [ ] Internal test track configured, with the ops and design teams on it
- [ ] Account deletion route documented for review — both stores require it, and the app has
      `DELETE /me` behind the Profile "Advanced" disclosure, which reviewers will ask about
