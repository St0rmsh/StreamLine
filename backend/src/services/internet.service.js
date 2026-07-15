import { tavily as Tavily } from "@tavily/core"
import config from "../config/config.js"

const tavily = Tavily({
    apiKey: config.TAVILY_API_KEY
})


export async function searchInternet({ query }) {
    try {
        const result = await tavily.search(query, {
            max_results: 8,
            search_depth: "advanced",
            include_answer: true
        });

        console.log("Search results:", result.results.length);

        const cleaned = result.results
            .filter(item => item.url)
            .map(item => {
                let domain = "unknown";

                try {
                    domain = new URL(item.url).hostname;
                } catch {}

                return {
                    title: item.title,
                    snippet: item.content
                        ? item.content.slice(0, 400)
                        : "",
                    url: item.url,
                    source: domain,

                    isTrusted:
                        domain.includes(".gov") ||
                        domain.includes(".edu") ||
                        domain.includes("wikipedia") ||
                        domain.includes("bbc") ||
                        domain.includes("reuters") ||
                        domain.includes("nature") ||
                        domain.includes("science")
                };
            });

        return {
            answer: result.answer || "",
            results: cleaned
        };

    } catch (error) {
        console.log("Search error:", error.message);
        return { answer: "", results: [] };
    }
}