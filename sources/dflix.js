// StreamBDIX - By Corpse
const { extractQuality, titlesMatch, extractYear, axios } = require("./utils");
const tough = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const SOURCE_NAME = "DFLIX";
const DFLIX_URL = "https://dflix.discoveryftp.net";
const cookieJar = new tough.CookieJar();
const axiosWithCookies = wrapper(axios.create({ jar: cookieJar }));
let isAuthenticated = false;
const axiosConfig = {
    timeout: 5000,
    maxRedirects: 5,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
};
async function ensureAuthenticated() {
    if (isAuthenticated) return true;
    try {
        await axiosWithCookies.get(`${DFLIX_URL}/login/demo`, {
            ...axiosConfig,
            maxRedirects: 10,
        });
        isAuthenticated = true;
        return true;
    } catch (err) {
        console.error("[DFLIX] Demo authentication failed:", err.message);
        return false;
    }
}
async function search(query, type) {
    const searchType = type === "movie" ? "m" : "s";
    try {
        // Ensure we're authenticated with demo login
        if (!(await ensureAuthenticated())) {
            return [];
        }

        // Use GET request to find endpoint
        const response = await axiosWithCookies.get(
            `${DFLIX_URL}/${searchType}/find/${encodeURIComponent(query)}`,
            {
                ...axiosConfig,
                maxRedirects: 10,
            },
        );
        const html = response.data;

        // Check if we got a login page (auth expired)
        if (
            html.includes("login") &&
            html.includes("Welcome To DFLIX") &&
            html.length < 10000
        ) {
            // Reset auth flag and retry once
            isAuthenticated = false;
            if (await ensureAuthenticated()) {
                return search(query, type);
            }
            return [];
        }

        const results = [];
        // DFLIX uses different structures for movies vs series
        // Movies: <div class="card"><a href="/m/view/ID">...<h3>Title</h3>
        // Series: <a href='/s/view/ID'><div class='fcard'>...<div class='ftitle'>Title</div>

        if (searchType === "m") {
            // Movie structure
            const cardRegex =
                /<div class="card"><a[^>]*href="(\/m\/view\/\d+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi;
            let match;
            while ((match = cardRegex.exec(html)) !== null) {
                const href = match[1];
                const title = match[2].trim();
                if (title && href) {
                    const cardStart = match.index;
                    const cardEnd = Math.min(cardStart + 500, html.length);
                    const cardContent = html.substring(cardStart, cardEnd);
                    const yearMatch = cardContent.match(
                        /\b(19\d{2}|20\d{2})\b/,
                    );
                    const details = yearMatch ? yearMatch[1] : "";
                    results.push({ title, details, url: DFLIX_URL + href });
                }
            }
        } else {
            // Series structure
            const seriesRegex =
                /<a[^>]*href=['""](\/s\/view\/\d+)['"][^>]*>[\s\S]*?<div class=['"]ftitle['"][^>]*>([^<]+)<\/div>/gi;
            let match;
            while ((match = seriesRegex.exec(html)) !== null) {
                const href = match[1];
                const title = match[2].trim();
                if (title && href) {
                    const cardStart = match.index;
                    const cardEnd = Math.min(cardStart + 500, html.length);
                    const cardContent = html.substring(cardStart, cardEnd);
                    const yearMatch = cardContent.match(
                        /\b(19\d{2}|20\d{2})\b/,
                    );
                    const details = yearMatch ? yearMatch[1] : "";
                    results.push({ title, details, url: DFLIX_URL + href });
                }
            }
        }
        return results;
    } catch (err) {
        console.error("[DFLIX] Search error:", err.message);
        return [];
    }
}
function extractDownloadLinks(html) {
    const links = [];
    // Very open regex to catch ANY subdomain pattern of discoveryftp.net with video files
    const cdnRegex =
        /href="(https?:\/\/[a-z0-9\-]+\.discoveryftp\.net[^"]*\.(?:mkv|mp4))"/gi;
    let match;
    while ((match = cdnRegex.exec(html)) !== null) {
        if (!links.includes(match[1])) links.push(match[1]);
    }
    return links;
}
function extractVariantLinks(html, currentPath) {
    const variants = [];
    const variantRegex = /href="(\/m\/view\/\d+)"/gi;
    let match;
    while ((match = variantRegex.exec(html)) !== null) {
        const href = match[1];
        if (href !== currentPath && !variants.includes(href))
            variants.push(DFLIX_URL + href);
    }
    return variants;
}
async function getMovieStreams(url) {
    try {
        const response = await axiosWithCookies.get(url, axiosConfig);
        const html = response.data;
        const currentPath = url.replace(DFLIX_URL, "");
        let allLinks = extractDownloadLinks(html);
        const variantUrls = extractVariantLinks(html, currentPath);
        if (variantUrls.length > 0) {
            const variantResponses = await Promise.all(
                variantUrls.map((vUrl) =>
                    axiosWithCookies.get(vUrl, axiosConfig).catch(() => null),
                ),
            );
            for (const vRes of variantResponses) {
                if (vRes && vRes.data) {
                    const variantLinks = extractDownloadLinks(vRes.data);
                    for (const link of variantLinks) {
                        if (!allLinks.includes(link)) allLinks.push(link);
                    }
                }
            }
        }
        return allLinks.map((link) => ({
            name: SOURCE_NAME,
            title: extractQuality(link),
            url: link,
        }));
    } catch {
        return [];
    }
}
async function getSeriesStreams(url, season, episode) {
    try {
        const sPad = String(season).padStart(2, "0");
        const baseViewPath = url.replace(DFLIX_URL, "");
        let response = await axiosWithCookies.get(url, axiosConfig);
        let html = response.data;
        const seasonPageMatch = html.match(
            new RegExp(`href="(${baseViewPath}/${sPad})"`, "i"),
        );
        if (seasonPageMatch) {
            response = await axiosWithCookies.get(
                DFLIX_URL + seasonPageMatch[1],
                axiosConfig,
            );
            html = response.data;
        }
        const epRegex = new RegExp(
            `S${season}\\s*\\|\\s*EP\\s*${episode}\\s*<a\\s+href="([^"]+\\.(?:mkv|mp4))"`,
            "gi",
        );
        const directLinks = [];
        let match;
        while ((match = epRegex.exec(html)) !== null)
            directLinks.push(match[1]);
        if (directLinks.length > 0) {
            return directLinks.map((link) => ({
                name: SOURCE_NAME,
                title: extractQuality(link),
                url: link,
            }));
        }
        const cdnMatch = html.match(
            /href="(https?:\/\/[a-z0-9\-]+\.discoveryftp\.net\/[^"]+\/)"\s*title="Browse/i,
        );
        if (!cdnMatch) return [];
        const cdnUrl = cdnMatch[1];
        const cdnBase = cdnUrl.match(/^(https?:\/\/[^\/]+)/)[1];
        const cdnRes = await axiosWithCookies.get(cdnUrl, {
            ...axiosConfig,
            maxRedirects: 10,
        });
        const seasonMatch = cdnRes.data.match(
            new RegExp(`href="([^"]*[Ss]eason[\\s%20]+0*${season}/)`, "i"),
        );
        if (!seasonMatch) return [];
        const seasonUrl = seasonMatch[1].startsWith("http")
            ? seasonMatch[1]
            : cdnBase + seasonMatch[1];
        const seasonRes = await axiosWithCookies.get(seasonUrl, {
            ...axiosConfig,
            maxRedirects: 10,
        });
        const streams = [];
        const fileRegex = /<a href="([^"]*\.(?:mkv|mp4))"/gi;
        while ((match = fileRegex.exec(seasonRes.data)) !== null) {
            const filename = decodeURIComponent(match[1].split("/").pop());
            const seMatch = filename.match(/S0*(\d+)\D*E0*(\d+)/i);
            if (
                seMatch &&
                parseInt(seMatch[1]) === season &&
                parseInt(seMatch[2]) === episode
            ) {
                const fileUrl = match[1].startsWith("http")
                    ? match[1]
                    : match[1].startsWith("/")
                      ? cdnBase + match[1]
                      : seasonUrl + match[1];
                streams.push({
                    name: SOURCE_NAME,
                    title: extractQuality(filename),
                    url: fileUrl,
                });
            }
        }
        return streams;
    } catch {
        return [];
    }
}
module.exports = {
    name: SOURCE_NAME,
    types: ["movie", "series"],
    async getStreams(type, meta, season, episode) {
        // Validate metadata has required fields
        if (!meta || !meta.name) {
            console.log("[DFLIX] Missing metadata name, cannot search");
            return [];
        }

        const results = await search(meta.name, type);
        if (results.length === 0) return [];
        let bestMatch = null;
        let bestScore = 0;
        for (const result of results) {
            if (!titlesMatch(result.title, meta.name)) continue;
            let score = 10;
            if (meta.year) {
                const resultYear = extractYear(result.details || result.title);
                if (resultYear) {
                    const yearDiff = Math.abs(resultYear - meta.year);
                    if (yearDiff === 0) score += 10;
                    else if (yearDiff === 1) score += 5;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = result;
            }
        }
        if (!bestMatch) return [];
        if (type === "movie") return await getMovieStreams(bestMatch.url);
        else return await getSeriesStreams(bestMatch.url, season, episode);
    },
};
