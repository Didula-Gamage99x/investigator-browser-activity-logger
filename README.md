# Investigator Activity Logger

A lightweight Chrome extension for recording browser activity on a workstation. The extension captures visited web pages and search engine queries, storing all records locally on the device for later review.

Designed for investigators, auditors, compliance teams, security analysts, and authorized workstation monitoring scenarios.

## Features

### Activity Tracking

* Logs visited web pages
* Records search engine queries
* Stores all activity locally
* No cloud services required

### Secure Access

* Passcode-protected access
* Viewing logs requires authentication
* Exporting reports requires authentication
* Clearing logs requires authentication

### Automatic Backups

* Creates automatic backups every 30 minutes
* Generates a backup shortly after browser startup
* Saves backups in JSON format
* Backup files remain available even if the local log is cleared

### Local-First Design

* No external servers
* No data transmission
* No user accounts
* Full local control of collected information

## Installation

1. Download or clone the repository.
2. Extract the extension files to a permanent location.
3. Open Chrome and navigate to:

chrome://extensions

4. Enable **Developer Mode**.
5. Click **Load unpacked**.
6. Select the extension folder.
7. Open the extension popup and configure a passcode.

## Backup Location

Backups are stored in:

Downloads/ActivityLogBackups/

Each backup contains a complete JSON snapshot of recorded activity.

## Use Cases

* Digital investigations
* Internal audits
* Security reviews
* Compliance monitoring
* Shared workstation activity tracking
* Research and forensic data collection

## Limitations

This extension operates within Chrome's extension framework and cannot prevent a user with sufficient system privileges from:

* Removing the extension
* Disabling the extension
* Deleting backup files
* Using another browser
* Using private browsing modes if not permitted by policy

For managed environments, enterprise deployment and browser policies should be used to enforce installation.

## Privacy Notice

Users should ensure that any deployment complies with applicable laws, regulations, organizational policies, and privacy requirements. Activity logging should only be performed where authorized.
