# Coding Style

## Rules of Thumb

- Match the existing module layout before introducing new patterns.
- Keep route components thin.
- Use shared utilities when logic repeats.
- Prefer explicit names for domain concepts.

## Documentation Standard

- Document non-obvious decisions close to the relevant module.
- Keep prose short and concrete.
- Explain why a pattern exists, not just what it does.

## UI Standard

- use HeroUI-supported components whenever a supported component exists
- do not introduce raw HTML structures as a replacement for a supported HeroUI component
- if a module needs to step outside HeroUI, document the reason and the replacement pattern
- keep custom styling and composition layered on top of HeroUI rather than replacing it
