# 02 — Login: verify OTP

![](../screens/02-verify-otp.png)

## Purpose
Verify the 4-digit OTP and open the app on Home.

## Layout
No header, no bottom nav. Scroll container, `min-height:100%`, padding 24px, column, `gap:32px`.

## Components, top to bottom
1. **Header block** — column, `gap:20px`, `align-items:flex-start`
   - Back button: 40×40, radius 8, `margin-left:-8px`, `Icon name="ArrowBack" size={24}`, hover fill primary-5 → returns to the mobile-number screen
   - `../assets/humbee-logo.svg`, height 36px
   - Title "Verify OTP" — 24/32/700
   - Subtitle "Enter the 4 digit OTP sent to {number}" — 15/22, `#8C8C8C`. **The number is shown in full and unmasked**, exactly as entered (e.g. `9822014576`). No masking, no `+91` prefix in this line.
2. **Form panel** — same glass panel as screen 01 (radius 16, 20px padding, `gap:24px`)
   - **OTP row** — 4 boxes, `gap:12px` (component C10)
   - **Resend row** — space-between, 13/20: left "Resend OTP in 00:24" `#8C8C8C`; right "Resend OTP" 700, disabled colour `#B3B3B3` until the timer expires, then `#995A00` and tappable
   - `Button` — large, full width, "Verify & Log In". Disabled until all 4 digits are filled
3. **Footer** — `margin-top:auto`, centred, 13/20 `#8C8C8C`: "Wrong number ?" + "Change" (700, `#995A00`, tappable → screen 01). Note the space before the question mark; that is the intended Indian typographic convention.

## States
| State | Behaviour |
| --- | --- |
| Empty | Verify disabled; focus is in box 1 |
| Partial | Verify disabled |
| Complete | Verify enabled |
| Auto-advance | Entering a digit moves focus forward; backspace on an empty box moves back |
| Wrong OTP | All four rings turn error colour; message "That OTP is not correct. Try again." Boxes clear, focus returns to box 1 |
| Expired | "This OTP has expired. Request a new one." Resend becomes active immediately |
| Timer | Counts 00:24 → 00:00, once per send; resends restart it |
| Verifying | Button loading state; boxes read-only |

Implement SMS autofill (`autoComplete="one-time-code"` / Android SMS Retriever) — field users will otherwise switch apps to read the code.

## Success
On verify, navigate to **Home** and replace the auth stack (back must not return to login).
