import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { storeProject, getProjectByName } from "../database/service.js";

export function registerStoreProjectDataTool(server: McpServer) {
  server.tool(
    "store_project_data",
    "Store or update Revit project metadata in the local database. This captures project information with a timestamp for later retrieval.",
    {
      project_name: z.string().describe("The name of the Revit project"),
      project_path: z.string().optional().describe("File path to the project"),
      project_number: z.string().optional().describe("Project number or identifier"),
      project_address: z.string().optional().describe("Project address or location"),
      client_name: z.string().optional().describe("Client name"),
      project_status: z.string().optional().describe("Project status (e.g., Active, Completed, On Hold)"),
      author: z.string().optional().describe("Project author or creator"),
      metadata: z.record(z.any()).optional().describe("Additional project metadata as key-value pairs")
    },
    async (args: any) => {
      try {
        const projectId = storeProject(args);
        const project = getProjectByName(args.project_name);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Project data stored successfully",
                project_id: projectId,
                project
              }, null, 2)
            }
          ]
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );
}
