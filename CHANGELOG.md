# Changelog

## v1.4.2

- **Fixed**: Corrected npm start script to run index.js instead of non-existent tunnel.js
- **Improved**: Added overall timeout (15s) for fetching streams from all sources
- **Improved**: Added detailed console logging for source fetching operations
- **Improved**: Source-specific error logging with prefixed tags (e.g., [DFLIX], [StreamBDIX])
- **Improved**: Better visibility into enabled sources and request flow
- **Improved**: Detailed authentication failure messages for debugging
- **Improved**: Timeout and error handling logging for each source
- **Improved**: Log total stream count in response

## v1.4.1

- **New sources**: DhakaFlix, DFlix
- **Improved**: Enhanced title and year extraction for better matching
- **Fixed**: Authentication handling for DFlix with demo login support
- **Fixed**: Season/episode detection for series content

## v1.4.0

- **New sources**: RoarZone, FTPBD, CircleFTP, ICC FTP
- **Web UI**: Configure sources at `http://127.0.0.1:7001`
- **Cloudflare Tunnel**: Access addon remotely with token validation
- **Developer Mode**: Enable unreachable sources, Persist sources across restarts
- **Removed**: cheerio dependency, auto-browser-open

## v1.0.1

- Initial release
