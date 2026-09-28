# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# architecture

- Prefer single-file configurations over multi-file directory structures for shared state/protocol files. Confidence: 0.70
- Favor simplicity in design — if a single JSON file can replace a directory of specialized files, do it. Confidence: 0.65
- Prefer lazy/scoped environment validation — never read env vars at module load. Confidence: 0.7

# security

- Never commit secrets or plain-text credentials in code. Confidence: 0.85

# communication

See [communication/taste.md](communication/taste.md)

# workflow

See [workflow/taste.md](workflow/taste.md)
