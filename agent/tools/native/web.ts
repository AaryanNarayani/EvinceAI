import { tool } from "ai";
import { z } from "zod";

export const webTools = {
  webSearch: tool({
    description: "Search the web for information using Google (returns search results with snippets and links)",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
      console.log(`\n[Tool] Web searching for: ${query}`);
      
      try {
        console.log(`[Tool Debug] process.env.SERP_API_KEY directly:`, process.env.SERP_API_KEY);
        console.log(`[Tool Debug] process.env type:`, typeof process.env);
        
        const { getConfig } = await import("../../core/config");
        const config = getConfig();
        
        console.log(`[Tool] Config object keys:`, Object.keys(config));
        console.log(`[Tool] SerpAPI key exists: ${!!config.serpApiKey}`);
        console.log(`[Tool] SerpAPI key length: ${config.serpApiKey?.length || 0}`);
        console.log(`[Tool] SerpAPI key value (first 10 chars):`, config.serpApiKey?.substring(0, 10));
        
        if (!config.serpApiKey) {
          const directKey = process.env.SERP_API_KEY;
          if (directKey) {
            console.log(`[Tool] Using SERP_API_KEY directly from process.env`);
            const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${directKey}&engine=google&num=5`;
            console.log(`[Tool] Making request to SerpAPI...`);
            const response = await fetch(url);
            
            console.log(`[Tool] SerpAPI response status: ${response.status}`);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[Tool] SerpAPI error response:`, errorText);
              return `Error: SerpAPI returned ${response.status}: ${errorText}`;
            }

            const data = await response.json() as any;
            console.log(`[Tool] SerpAPI response data keys:`, Object.keys(data));
            
            if (data.error) {
              console.error(`[Tool] SerpAPI error:`, data.error);
              return `Error from SerpAPI: ${data.error}`;
            }
            
            const results = data.organic_results || [];
            console.log(`[Tool] Found ${results.length} results`);
            
            if (results.length === 0) {
              return `No results found for "${query}"`;
            }

            const formatted = results.slice(0, 5).map((r: any, i: number) => ({
              position: i + 1,
              title: r.title,
              link: r.link,
              snippet: r.snippet || "",
            }));

            return JSON.stringify(formatted, null, 2);
          }
          
          return "Error: SerpAPI key not configured. Please check your .env file.";
        }

        const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${config.serpApiKey}&engine=google&num=5`;
        console.log(`[Tool] Making request to SerpAPI...`);
        const response = await fetch(url);
        
        console.log(`[Tool] SerpAPI response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Tool] SerpAPI error response:`, errorText);
          return `Error: SerpAPI returned ${response.status}: ${errorText}`;
        }

        const data = await response.json() as any;
        console.log(`[Tool] SerpAPI response data keys:`, Object.keys(data));
        
        if (data.error) {
          console.error(`[Tool] SerpAPI error:`, data.error);
          return `Error from SerpAPI: ${data.error}`;
        }
        
        const results = data.organic_results || [];
        console.log(`[Tool] Found ${results.length} results`);
        
        if (results.length === 0) {
          return `No results found for "${query}"`;
        }

        const formatted = results.slice(0, 5).map((r: any, i: number) => ({
          position: i + 1,
          title: r.title,
          link: r.link,
          snippet: r.snippet || "",
        }));

        return JSON.stringify(formatted, null, 2);
      } catch (error: any) {
        console.error(`[Tool] Web search error:`, error);
        return `Error performing web search: ${error.message}`;
      }
    },
  }),

  fetchUrl: tool({
    description: "Fetch and read content from a URL",
    inputSchema: z.object({
      url: z.string().describe("The URL to fetch content from"),
    }),
    execute: async ({ url }) => {
      console.log(`\n[Tool] Fetching URL: ${url}`);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return `Failed to fetch URL: ${response.status} ${response.statusText}`;
        }

        const contentType = response.headers.get("content-type");
        
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          return JSON.stringify(data, null, 2);
        } else if (contentType?.includes("text/")) {
          const text = await response.text();
          return text.slice(0, 5000);
        } else {
          return `Fetched content from ${url} (binary content not supported)`;
        }
      } catch (error: any) {
        return `Error fetching URL: ${error.message}`;
      }
    },
  }),

  downloadFile: tool({
    description: "Download a file from a URL to the local filesystem",
    inputSchema: z.object({
      url: z.string().describe("The URL of the file to download"),
      fileName: z.string().describe("The name to save the file as"),
    }),
    execute: async ({ url, fileName }) => {
      console.log(`\n[Tool] Downloading ${url} to ${fileName}`);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return `Failed to download: ${response.status} ${response.statusText}`;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const fs = await import("fs/promises");
        const path = await import("path");
        const safePath = path.join(process.cwd(), fileName);
        
        await fs.writeFile(safePath, buffer);
        return `Successfully downloaded to ${fileName} (${buffer.length} bytes)`;
      } catch (error: any) {
        return `Error downloading file: ${error.message}`;
      }
    },
  }),
};
