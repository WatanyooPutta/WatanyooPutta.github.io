# Changelog

All notable changes to the Sovereign Entity Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to semantic versioning.

## [1.0.0] - 2026-10-12

### Added
- **Cryptographic Security**: Configured GPG commit signing (Key ID `25B44D3B1BFCFF61`) ensuring all commits carry the official GitHub "Verified" badge.
- **CI/CD Pipeline**: Implemented the `validate-schema` automated GitHub Actions workflow to guard repository structural integrity on every push and pull request.
- **Core Architecture**: Established baseline portfolio structure including `index.html` and professional profile `README.md`.
- **Open-Science & Governance**: 
  - Added an open-source `LICENSE` to govern code and asset reuse.
  - Added `CONTRIBUTING.md` guidelines for repository maintenance.
  - Established a `SECURITY.md` policy for responsible vulnerability reporting.
- **Academic Archiving Prep**: Configured integration hooks with Zenodo for automated DOI minting and persistent research citations.
