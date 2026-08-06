# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# architecture

- Prefer single-file configurations over multi-file directory structures for shared state/protocol files. Confidence: 0.70
- Favor simplicity in design — if a single JSON file can replace a directory of specialized files, do it. Confidence: 0.65
- Prefer lazy/scoped environment validation — never read env vars at module load. Confidence: 0.7

# security

- Never commit secrets or plain-text credentials in code. Confidence: 0.85

# communication

- When presenting a list of sequential configuration steps, guide users through one item at a time rather than giving the full list upfront. Confidence: 0.85
- Be transparent about which skills/rules are actually active in the session — state what is loaded and invoked vs. merely listed, and don't claim a skill is in use unless it was actually invoked. Confidence: 0.55
- When the user asks whether a config/skill is set up correctly, verify against the official product documentation and give an honest "what works / what doesn't" breakdown with a concrete recommended fix, rather than assuming it's valid. Confidence: 0.8
- When listing or porting skills/config between tools, the user wants a complete dump of all items — "dump all of them" — rather than a summary or curated subset. Confidence: 0.6
- Wants honest, candid assessments of their work (e.g., their website) — "tell me ur honest opinion" means direct feedback including flaws and critique, not sugar-coated praise. Confidence: 0.8

# workflow

See [workflow/taste.md](workflow/taste.md)
