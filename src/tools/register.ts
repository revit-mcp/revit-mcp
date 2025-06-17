import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetDrawingInfoTool } from "./get_drawing_info.js";
import { registerListCivilObjectTypesTool } from "./list_civil_object_types.js";
import { registerGetSelectedCivilObjectsInfoTool } from "./get_selected_civil_objects_info.js";
import { registerCreateCogoPointTool } from "./create_cogo_point.js";
import { registerCreateLineSegmentTool } from "./create_line_segment.js"; // New import

export async function registerTools(server: McpServer) {
  registerGetDrawingInfoTool(server);
  registerListCivilObjectTypesTool(server);
  registerGetSelectedCivilObjectsInfoTool(server);
  registerCreateCogoPointTool(server);
  registerCreateLineSegmentTool(server); // New registration
}
