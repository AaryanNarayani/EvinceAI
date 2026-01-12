import { Agent } from "./core/agent";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import chalk from "chalk";


async function main() {
  console.log(chalk.cyan.bold("\n✨ OpenRouter AI Agent - Initializing...\n"));
  
  const agent = new Agent();
  
  try {
    await agent.initialize();
    console.log(chalk.green("Agent ready!"));
  } catch (error: any) {
    console.log(chalk.red("Failed to initialize agent:"), error.message);
    process.exit(1);
  }
  
  console.log(chalk.gray("─".repeat(50)));
  console.log(chalk.cyan("Chat started. Commands:"));
  console.log(chalk.gray("  • ") + chalk.white("new") + chalk.gray(" - Start new conversation"));
  console.log(chalk.gray("  • ") + chalk.white("list") + chalk.gray(" - List all conversations"));
  console.log(chalk.gray("  • ") + chalk.white("exit") + chalk.gray(" - Quit"));
  console.log(chalk.gray("─".repeat(50)) + "\n");

  // Set up event listeners for streaming
  agent.on("text-delta", (delta: string) => {
    process.stdout.write(chalk.white(delta));
  });

  agent.on("tool-call-start", ({ toolName, args }: any) => {
    console.log(chalk.yellow(`\nCalling tool: ${chalk.bold(toolName)}`));
  });

  agent.on("tool-call-complete", ({ toolName }: any) => {
    console.log(chalk.green(`Tool completed: ${chalk.bold(toolName)}`));
  });

  agent.on("error", (error: Error) => {
    console.log(chalk.red("\nError:"), chalk.red(error.message));
  });

  const rl = readline.createInterface({ input, output });

  let currentConversationId: string | undefined;

  while (true) {
    const userInput = await rl.question(chalk.blue("\n> "));

    if (userInput.toLowerCase() === "exit") {
      console.log(chalk.cyan("\nGoodbye!\n"));
      break;
    }

    if (userInput.toLowerCase() === "new") {
      currentConversationId = undefined;
      console.log(chalk.green("Started new conversation"));
      continue;
    }

    if (userInput.toLowerCase() === "list") {
      const conversations = await agent.listConversations();
      console.log(chalk.cyan("\nConversations:"));
      if (conversations.length === 0) {
        console.log(chalk.gray("  No conversations yet"));
      } else {
        conversations.forEach(conv => {
          console.log(chalk.gray("  • ") + 
                     chalk.white(conv.id) + 
                     chalk.gray(`: ${conv.title} (${conv.messageCount} messages)`));
        });
      }
      continue;
    }

    if (!userInput.trim()) {
      continue;
    }

    try {
      process.stdout.write(chalk.magenta("\nAssistant: "));
      
      const response = await agent.chat(userInput, currentConversationId);
      
      currentConversationId = response.conversationId;
      
      console.log("\n");
    } catch (error: any) {
      console.log(chalk.red("\nAn error occurred:"));
      console.log(chalk.red("  " + error.message));
      
      // Show helpful context for common errors
      if (error.message.includes("API") || error.message.includes("auth")) {
        console.log(chalk.yellow("\nTip: Check your API keys in the configuration"));
      }
    }
  }

  rl.close();
}

main().catch((error) => {
  console.error(chalk.red("\nFatal error:"), error);
  process.exit(1);
});
