# Security Notes

## Dependencies

- **xlsx**: Sourced from SheetJS CDN (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`). Version 0.20.3 includes fixes for known issues (e.g. ReDoS CVE-2024-22363). The npm registry package is not used; the CDN build is the maintained release.
- **pnpm overrides**: `tar`, `lodash`, and `js-yaml` are overridden to minimum secure versions (`>=7.5.7`, `>=4.17.23`, `>=4.1.1`) to address transitive dependency vulnerabilities.

Run `pnpm audit` before releases to confirm no new vulnerabilities.
