import { tool } from "ai";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { getConfig } from "../../core/config";

function isPathAllowed(targetPath: string): boolean {
  const config = getConfig();
  const normalizedTarget = path.normalize(path.resolve(targetPath));
  
  return config.allowedPaths.some(allowedPath => {
    const normalizedAllowed = path.normalize(path.resolve(allowedPath));
    return normalizedTarget.startsWith(normalizedAllowed);
  });
}

function resolvePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return path.normalize(filePath);
  }
  return path.normalize(path.join(process.cwd(), filePath));
}

export const filesystemTools = {
  readFile: tool({
    description: "Read the content of a file",
    inputSchema: z.object({
      fileName: z.string().describe("The name of the file to read"),
    }),
    execute: async ({ fileName }) => {
      console.log(`\n[Tool] Reading file: ${fileName}`);
      
      try {
        const safePath = resolvePath(fileName);
        
        if (!isPathAllowed(safePath)) {
          return `Access denied: Path outside allowed directories. Allowed: ${getConfig().allowedPaths.join(", ")}`;
        }

        // Check if file exists before reading
        try {
          await fs.access(safePath);
        } catch {
          return `File not found: ${fileName}`;
        }

        const content = await fs.readFile(safePath, "utf-8");
        return content;
      } catch (error: any) {
        return `Error reading file: ${error.message}`;
      }
    },
  }),

  writeFile: tool({
    description: "Write content to a file (creates new file or overwrites existing)",
    inputSchema: z.object({
      fileName: z.string().describe("The name of the file to write"),
      content: z.string().describe("The content to write to the file"),
    }),
    execute: async ({ fileName, content }) => {
      console.log(`\n[Tool] Writing to file: ${fileName}`);
      
      try {
        const safePath = resolvePath(fileName);
        
        if (!isPathAllowed(safePath)) {
          return `Access denied: Path outside allowed directories. Allowed: ${getConfig().allowedPaths.join(", ")}`;
        }

        await fs.writeFile(safePath, content, "utf-8");
        return `Successfully wrote to ${fileName}`;
      } catch (error: any) {
        return `Error writing file: ${error.message}`;
      }
    },
  }),

  listDirectory: tool({
    description: "List all files and directories in a given path",
    inputSchema: z.object({
      dirPath: z.string().describe("Directory path to list (relative or absolute)").default("."),
    }),
    execute: async ({ dirPath }) => {
      console.log(`\n[Tool] Listing directory: ${dirPath}`);
      
      try {
        const safePath = resolvePath(dirPath);
        
        if (!isPathAllowed(safePath)) {
          return `Access denied: Path outside allowed directories. Allowed: ${getConfig().allowedPaths.join(", ")}`;
        }

        const entries = await fs.readdir(safePath, { withFileTypes: true });
        const items = entries.map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
        }));

        return JSON.stringify(items, null, 2);
      } catch (error: any) {
        return `Error listing directory: ${error.message}`;
      }
    },
  }),

  createDirectory: tool({
    description: "Create a new directory",
    inputSchema: z.object({
      dirPath: z.string().describe("Path of the directory to create"),
    }),
    execute: async ({ dirPath }) => {
      console.log(`\n[Tool] Creating directory: ${dirPath}`);
      
      try {
        const safePath = resolvePath(dirPath);
        
        if (!isPathAllowed(safePath)) {
          return `Access denied: Path outside allowed directories. Allowed: ${getConfig().allowedPaths.join(", ")}`;
        }

        await fs.mkdir(safePath, { recursive: true });
        return `Successfully created directory: ${dirPath}`;
      } catch (error: any) {
        return `Error creating directory: ${error.message}`;
      }
    },
  }),

  deleteFile: tool({
    description: "Delete a file (WARNING: This is permanent!)",
    inputSchema: z.object({
      fileName: z.string().describe("The name of the file to delete"),
    }),
    execute: async ({ fileName }) => {
      console.log(`\n[Tool] Deleting file: ${fileName}`);
      
      try {
        const safePath = resolvePath(fileName);
        
        if (!isPathAllowed(safePath)) {
          return `Access denied: Path outside allowed directories. Allowed: ${getConfig().allowedPaths.join(", ")}`;
        }

        // Check if file exists
        try {
          await fs.access(safePath);
        } catch {
          return `File not found: ${fileName}`;
        }

        await fs.unlink(safePath);
        return `Successfully deleted: ${fileName}`;
      } catch (error: any) {
        return `Error deleting file: ${error.message}`;
      }
    },
  }),

  moveFile: tool({
    description: "Move or rename a file",
    inputSchema: z.object({
      sourcePath: z.string().describe("Current path of the file"),
      destinationPath: z.string().describe("New path for the file"),
    }),
    execute: async ({ sourcePath, destinationPath }) => {
      console.log(`\n[Tool] Moving file from ${sourcePath} to ${destinationPath}`);
      
      try {
        const safeSource = resolvePath(sourcePath);
        const safeDest = resolvePath(destinationPath);
        
        if (!isPathAllowed(safeSource) || !isPathAllowed(safeDest)) {
          return `Access denied: Path outside allowed directories. Allowed: ${getConfig().allowedPaths.join(", ")}`;
        }

        // Check if source exists
        try {
          await fs.access(safeSource);
        } catch {
          return `Source file not found: ${sourcePath}`;
        }

        await fs.rename(safeSource, safeDest);
        return `Successfully moved ${sourcePath} to ${destinationPath}`;
      } catch (error: any) {
        return `Error moving file: ${error.message}`;
      }
    },
  }),
};
