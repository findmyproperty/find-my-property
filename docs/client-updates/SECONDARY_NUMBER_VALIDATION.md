# Secondary number validation (property create)

## Rule

- **Optional** — can be left blank.
- If filled, must be a **10-digit Indian mobile number**.
- Must start with **6, 7, 8, or 9**.
- Country code **91** is allowed when typing/pasting (e.g. `91XXXXXXXXXX` or `+91…`); it is normalized to the 10-digit national number.

## Invalid examples

| Value | Why invalid |
|-------|-------------|
| `080101010` | Looks like a landline/STD prefix; mobiles cannot start with `0` |
| `1234567890` | Does not start with 6–9 |
| `98765` | Too short |

## Valid examples

- `9876543210`
- `919876543210` (normalized to `9876543210`)

## When it is checked

- On **blur** of the Secondary number field (inline error under the input).
- On **Next** / submit for that wizard step (same message; step marked in quick navigate if invalid).

## Not supported

- Landline / STD numbers (e.g. `080…`)
- Making secondary number required
