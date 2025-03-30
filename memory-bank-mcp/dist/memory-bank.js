"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path = __importStar(require("path"));
const graphology_1 = __importDefault(require("graphology"));
// Определяем базовый путь для хранения данных
const MEMORY_BASE_PATH = process.env.MEMORY_BASE_PATH || "E:/memory-bank-cursor";
// Убедимся, что директория существует
try {
    fs_extra_1.default.ensureDirSync(MEMORY_BASE_PATH);
    console.error(`Memory bank base directory initialized at: ${MEMORY_BASE_PATH}`);
}
catch (error) {
    console.error(`Failed to create memory bank directory: ${error instanceof Error ? error.message : String(error)}`);
}
// Создаем экземпляр MCP сервера
const server = new mcp_js_1.McpServer({
    name: "Memory Bank",
    version: "1.0.0",
});
// --- End Type Definitions ---
// Регистрируем инструмент для получения списка проектов
server.tool("list_projects", "Lists all projects in the memory bank", {}, async () => {
    try {
        if (!fs_extra_1.default.existsSync(MEMORY_BASE_PATH)) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Memory bank base directory does not exist. Please initialize it first with init_memory_bank.",
                    },
                ],
            };
        }
        const projects = fs_extra_1.default.readdirSync(MEMORY_BASE_PATH)
            .filter(item => {
            const itemPath = path.join(MEMORY_BASE_PATH, item);
            return fs_extra_1.default.existsSync(itemPath) && fs_extra_1.default.statSync(itemPath).isDirectory();
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Projects in Memory Bank:\n${projects.length > 0
                        ? projects.map(project => `- ${project}`).join('\n')
                        : "No projects found"}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error listing projects:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error listing projects: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
// Регистрируем инструмент для создания нового проекта
server.tool("create_project", "Creates a new project in the memory bank", {
    project_name: zod_1.z.string().min(1).describe("Name of the project to create"),
}, async ({ project_name }) => {
    try {
        if (!project_name || project_name.trim() === "") {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: Project name cannot be empty",
                    },
                ],
            };
        }
        // Очищаем имя проекта от недопустимых символов
        const sanitizedProjectName = project_name.replace(/[<>:"/\|?*]/g, "_");
        if (sanitizedProjectName !== project_name) {
            console.error(`Project name contains invalid characters. Sanitized from "${project_name}" to "${sanitizedProjectName}"`);
        }
        const projectPath = path.join(MEMORY_BASE_PATH, sanitizedProjectName);
        // Проверяем, существует ли проект
        if (fs_extra_1.default.existsSync(projectPath)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: Project ${sanitizedProjectName} already exists`,
                    },
                ],
            };
        }
        // Создаем директорию проекта
        fs_extra_1.default.ensureDirSync(projectPath);
        // Создаем базовые файлы
        const baseFiles = [
            "projectbrief.md",
            "productContext.md",
            "systemPatterns.md",
            "techContext.md",
            "activeContext.md",
            "progress.md",
            ".cursorrules"
        ];
        for (const file of baseFiles) {
            const filePath = path.join(projectPath, file);
            let content = "";
            if (file.endsWith('.md')) {
                const title = file.slice(0, -3).replace(/([A-Z])/g, ' $1').trim();
                content = `# ${title.charAt(0).toUpperCase() + title.slice(1)}\n\n`;
            }
            else {
                content = `# ${file}\n\n`;
            }
            fs_extra_1.default.writeFileSync(filePath, content, 'utf-8');
        }
        // Create an empty graph file
        const graph = new graphology_1.default({ multi: true, allowSelfLoops: true, type: 'directed' });
        saveGraph(sanitizedProjectName, graph); // Save the initial empty graph
        return {
            content: [
                {
                    type: "text",
                    text: `Project ${sanitizedProjectName} created successfully with ${baseFiles.length} base files and an empty graph.json.`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error creating project:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error creating project: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
// Регистрируем инструмент для получения списка файлов проекта
server.tool("list_project_files", "Lists all files in a project", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
}, async ({ project_name }) => {
    try {
        if (!project_name || project_name.trim() === "") {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: Project name cannot be empty",
                    },
                ],
            };
        }
        // Sanitize project name for path construction
        const sanitizedProjectName = project_name.replace(/[<>:"/\|?*]/g, "_");
        const projectPath = path.join(MEMORY_BASE_PATH, sanitizedProjectName);
        // Проверяем, существует ли проект и является ли он директорией
        if (!fs_extra_1.default.existsSync(projectPath)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: Project ${sanitizedProjectName} not found`,
                    },
                ],
            };
        }
        if (!fs_extra_1.default.statSync(projectPath).isDirectory()) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${sanitizedProjectName} is not a directory`,
                    },
                ],
            };
        }
        // Получаем список файлов и директорий на верхнем уровне
        const items = fs_extra_1.default.readdirSync(projectPath);
        const filesAndDirs = items.map(item => {
            const itemPath = path.join(projectPath, item); // Use path.join for cross-platform compatibility
            try {
                const stat = fs_extra_1.default.statSync(itemPath);
                // Show graph.json specifically if needed, otherwise just list files/dirs
                return stat.isDirectory() ? `- ${item}/ (Directory)` : `- ${item}`;
            }
            catch (err) {
                console.error(`Error accessing ${itemPath}:`, err);
                return `- ${item} (Error accessing)`; // Indicate inaccessible items
            }
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Files and directories in project ${sanitizedProjectName}:
${filesAndDirs.length > 0
                        ? filesAndDirs.join('\n')
                        : "No files or directories found"}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error listing project files:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error listing project files: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
// Регистрируем инструмент для получения содержимого файла
server.tool("get_file_content", "Gets the content of a file in a project", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    file_path: zod_1.z.string().min(1).describe("Path to the file within the project"),
}, async ({ project_name, file_path }) => {
    try {
        if (!project_name || project_name.trim() === "") {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: Project name cannot be empty",
                    },
                ],
            };
        }
        if (!file_path || file_path.trim() === "") {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: File path cannot be empty",
                    },
                ],
            };
        }
        // Предотвращаем path traversal атаки
        const normalizedFilePath = path.normalize(file_path).replace(/^(\.\.[\/\\])+/, '');
        const projectPath = path.join(MEMORY_BASE_PATH, project_name);
        const filePath = path.join(projectPath, normalizedFilePath);
        // Проверяем, что путь к файлу находится внутри проекта
        if (!filePath.startsWith(projectPath)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: Invalid file path. Path traversal is not allowed.`,
                    },
                ],
            };
        }
        // Проверяем, существует ли проект
        if (!fs_extra_1.default.existsSync(projectPath)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: Project ${project_name} not found`,
                    },
                ],
            };
        }
        // Проверяем, существует ли файл
        if (!fs_extra_1.default.existsSync(filePath) || !fs_extra_1.default.statSync(filePath).isFile()) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: File ${normalizedFilePath} not found in project ${project_name}`,
                    },
                ],
            };
        }
        // Читаем содержимое файла
        const content = fs_extra_1.default.readFileSync(filePath, 'utf-8');
        return {
            content: [
                {
                    type: "text",
                    text: `Content of ${normalizedFilePath} in project ${project_name}:\n\n${content}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error getting file content:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error getting file content: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
// Регистрируем инструмент для обновления содержимого файла
server.tool("update_file_content", "Updates the content of a file in a project", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    file_path: zod_1.z.string().min(1).describe("Path to the file within the project"),
    content: zod_1.z.string().describe("New content of the file"),
}, async ({ project_name, file_path, content }) => {
    try {
        if (!project_name || project_name.trim() === "") {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: Project name cannot be empty",
                    },
                ],
            };
        }
        if (!file_path || file_path.trim() === "") {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: File path cannot be empty",
                    },
                ],
            };
        }
        // Предотвращаем path traversal атаки
        const normalizedFilePath = path.normalize(file_path).replace(/^(\.\.[\/\\])+/, '');
        const projectPath = path.join(MEMORY_BASE_PATH, project_name);
        const filePath = path.join(projectPath, normalizedFilePath);
        // Проверяем, что путь к файлу находится внутри проекта
        if (!filePath.startsWith(projectPath)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: Invalid file path. Path traversal is not allowed.`,
                    },
                ],
            };
        }
        // Проверяем, существует ли проект
        if (!fs_extra_1.default.existsSync(projectPath)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: Project ${project_name} not found`,
                    },
                ],
            };
        }
        // Создаем директории, если они не существуют
        try {
            fs_extra_1.default.ensureDirSync(path.dirname(filePath));
        }
        catch (err) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error creating directory structure: ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
            };
        }
        // Записываем содержимое файла
        try {
            fs_extra_1.default.writeFileSync(filePath, content, 'utf-8');
        }
        catch (err) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error writing to file: ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `File ${normalizedFilePath} in project ${project_name} updated successfully.`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error updating file content:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error updating file content: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
// Регистрируем инструмент для инициализации банка памяти
server.tool("init_memory_bank", "Initializes the memory bank directory structure", {}, async () => {
    try {
        // Создаем базовую директорию, если она не существует
        if (fs_extra_1.default.existsSync(MEMORY_BASE_PATH)) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Memory bank already exists at ${MEMORY_BASE_PATH}`,
                    },
                ],
            };
        }
        try {
            fs_extra_1.default.ensureDirSync(MEMORY_BASE_PATH);
        }
        catch (err) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error creating memory bank directory: ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Memory bank initialized successfully at ${MEMORY_BASE_PATH}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error initializing memory bank:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error initializing memory bank: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
// --- Graph Helper Functions ---
// Function to get the path to the graph.json file for a project
const getGraphPath = (projectName) => {
    // Sanitize project name again for safety when constructing path
    const sanitizedProjectName = projectName.replace(/[<>:"/\|?*]/g, "_");
    return path.join(MEMORY_BASE_PATH, sanitizedProjectName, "graph.json");
};
// Function to load a graph for a project
const loadGraph = (projectName) => {
    const graphPath = getGraphPath(projectName);
    if (fs_extra_1.default.existsSync(graphPath)) {
        try {
            const data = fs_extra_1.default.readJsonSync(graphPath);
            // Ensure the graph is created with correct options even when loaded
            const graph = new graphology_1.default({ multi: true, allowSelfLoops: true, type: 'directed' });
            graph.import(data);
            return graph;
        }
        catch (error) {
            console.error(`Error loading or parsing graph for ${projectName} from ${graphPath}:`, error);
            // Return a new graph if loading fails
            return new graphology_1.default({ multi: true, allowSelfLoops: true, type: 'directed' });
        }
    }
    // Return a new graph if the file doesn't exist
    return new graphology_1.default({ multi: true, allowSelfLoops: true, type: 'directed' });
};
// Function to save a graph for a project
const saveGraph = (projectName, graph) => {
    const graphPath = getGraphPath(projectName);
    try {
        fs_extra_1.default.ensureDirSync(path.dirname(graphPath));
        fs_extra_1.default.writeJsonSync(graphPath, graph.export(), { spaces: 2 });
    }
    catch (error) {
        console.error(`Error saving graph for ${projectName} to ${graphPath}:`, error);
        // Optionally, re-throw or handle the error more robustly
        throw new Error(`Failed to save graph: ${error instanceof Error ? error.message : String(error)}`);
    }
};
// --- End Graph Helper Functions ---
// --- Graph Tools Implementation and Registration ---
// Add Node
server.tool("mcp_memory_bank_add_node", "Adds a node to the project's knowledge graph.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    id: zod_1.z.string().min(1).describe("Unique ID for the node"),
    type: zod_1.z.string().min(1).describe("Type of the node (e.g., Function, File, Concept)"),
    label: zod_1.z.string().min(1).describe("Human-readable label for the node"),
    data: zod_1.z.record(zod_1.z.any()).optional().describe("Optional structured data for the node"),
}, async ({ project_name, id, type, label, data }) => {
    try {
        const graph = loadGraph(project_name);
        if (graph.hasNode(id)) {
            // Option 1: Return error if node exists
            return { content: [{ type: "text", text: `Error: Node with ID ${id} already exists in project ${project_name}. Use update_node instead.` }] };
            // Option 2: Update existing node (merge attributes) - Choose one approach
            // graph.mergeNodeAttributes(id, { id, type, label, data: data || {} });
        }
        else {
            graph.addNode(id, { id, type, label, data: data || {} }); // Ensure data is at least an empty object and cast type
        }
        saveGraph(project_name, graph);
        return { content: [{ type: "text", text: `Node ${id} added/updated successfully in project ${project_name}.` }] };
    }
    catch (error) {
        console.error("Error adding node:", error);
        return { content: [{ type: "text", text: `Error adding node: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Update Node
server.tool("mcp_memory_bank_update_node", "Updates an existing node in the project's knowledge graph.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    id: zod_1.z.string().min(1).describe("ID of the node to update"),
    newLabel: zod_1.z.string().optional().describe("Optional new label for the node"),
    data_to_merge: zod_1.z.record(zod_1.z.any()).optional().describe("Optional data to merge into the node's existing data"),
}, async ({ project_name, id, newLabel, data_to_merge }) => {
    try {
        const graph = loadGraph(project_name);
        if (!graph.hasNode(id)) {
            return { content: [{ type: "text", text: `Error: Node with ID ${id} not found in project ${project_name}.` }] };
        }
        const existingAttributes = graph.getNodeAttributes(id);
        const newData = { ...existingAttributes.data, ...(data_to_merge || {}) }; // Basic merge
        const updatedAttributes = {}; // Use Partial for updates
        if (newLabel)
            updatedAttributes.label = newLabel;
        // Only include data in update if data_to_merge was provided
        if (data_to_merge)
            updatedAttributes.data = newData;
        // Only update if there are changes
        if (Object.keys(updatedAttributes).length > 0) {
            graph.mergeNodeAttributes(id, updatedAttributes);
            saveGraph(project_name, graph);
            return { content: [{ type: "text", text: `Node ${id} updated successfully in project ${project_name}.` }] };
        }
        else {
            return { content: [{ type: "text", text: `No updates provided for node ${id}.` }] };
        }
    }
    catch (error) {
        console.error("Error updating node:", error);
        return { content: [{ type: "text", text: `Error updating node: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Add Edge
server.tool("mcp_memory_bank_add_edge", "Adds a directed edge (relationship) between two nodes.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    sourceId: zod_1.z.string().min(1).describe("ID of the source node"),
    targetId: zod_1.z.string().min(1).describe("ID of the target node"),
    relationshipType: zod_1.z.string().min(1).describe("Type of the relationship (e.g., CALLS, IMPLEMENTS)"),
}, async ({ project_name, sourceId, targetId, relationshipType }) => {
    try {
        const graph = loadGraph(project_name);
        if (!graph.hasNode(sourceId)) {
            return { content: [{ type: "text", text: `Error: Source node ${sourceId} not found.` }] };
        }
        if (!graph.hasNode(targetId)) {
            return { content: [{ type: "text", text: `Error: Target node ${targetId} not found.` }] };
        }
        try {
            // Allows multiple edges of the same type between nodes
            graph.addDirectedEdge(sourceId, targetId, { relationshipType });
            saveGraph(project_name, graph);
            return { content: [{ type: "text", text: `Edge from ${sourceId} to ${targetId} (${relationshipType}) added successfully.` }] };
        }
        catch (edgeError) {
            console.error("Error adding edge:", edgeError);
            return { content: [{ type: "text", text: `Error adding edge: ${edgeError instanceof Error ? edgeError.message : String(edgeError)}` }] };
        }
    }
    catch (error) {
        console.error("Error adding edge:", error);
        return { content: [{ type: "text", text: `Error adding edge: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Delete Node
server.tool("mcp_memory_bank_delete_node", "Deletes a node and its connected edges from the graph.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    id: zod_1.z.string().min(1).describe("ID of the node to delete"),
}, async ({ project_name, id }) => {
    try {
        const graph = loadGraph(project_name);
        if (!graph.hasNode(id)) {
            return { content: [{ type: "text", text: `Node ${id} not found, no deletion performed.` }] };
        }
        graph.dropNode(id); // dropNode also removes connected edges
        saveGraph(project_name, graph);
        return { content: [{ type: "text", text: `Node ${id} and its edges deleted successfully.` }] };
    }
    catch (error) {
        console.error("Error deleting node:", error);
        return { content: [{ type: "text", text: `Error deleting node: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Delete Edge
server.tool("mcp_memory_bank_delete_edge", "Deletes a specific directed edge between two nodes.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    sourceId: zod_1.z.string().min(1).describe("ID of the source node"),
    targetId: zod_1.z.string().min(1).describe("ID of the target node"),
    relationshipType: zod_1.z.string().min(1).describe("Type of the relationship to delete"),
}, async ({ project_name, sourceId, targetId, relationshipType }) => {
    try {
        const graph = loadGraph(project_name);
        const edgesToDelete = [];
        // Use graph.edges(sourceId, targetId) for potentially simpler iteration if graphology version supports it well
        graph.forEachDirectedEdge(sourceId, targetId, (edgeKey, attributes) => {
            if (attributes.relationshipType === relationshipType) {
                edgesToDelete.push(edgeKey);
            }
        });
        if (edgesToDelete.length === 0) {
            return { content: [{ type: "text", text: `Edge from ${sourceId} to ${targetId} (${relationshipType}) not found.` }] };
        }
        edgesToDelete.forEach(edgeKey => graph.dropEdge(edgeKey));
        saveGraph(project_name, graph);
        return { content: [{ type: "text", text: `Deleted ${edgesToDelete.length} edge(s) from ${sourceId} to ${targetId} (${relationshipType}).` }] };
    }
    catch (error) {
        console.error("Error deleting edge:", error);
        return { content: [{ type: "text", text: `Error deleting edge: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Get Node
server.tool("mcp_memory_bank_get_node", "Retrieves details of a specific node.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    id: zod_1.z.string().min(1).describe("ID of the node to retrieve"),
}, async ({ project_name, id }) => {
    try {
        const graph = loadGraph(project_name);
        if (!graph.hasNode(id)) {
            return { content: [{ type: "text", text: `Node ${id} not found.` }] };
        }
        const attributes = graph.getNodeAttributes(id);
        const nodeDataString = JSON.stringify(attributes, null, 2);
        return { content: [{ type: "text", text: `Node ${id} details:\n${nodeDataString}` }] };
    }
    catch (error) {
        console.error("Error getting node:", error);
        return { content: [{ type: "text", text: `Error getting node: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Get All Nodes
server.tool("mcp_memory_bank_get_all_nodes", "Retrieves all nodes in the graph.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
}, async ({ project_name }) => {
    try {
        const graph = loadGraph(project_name);
        const nodes = [];
        graph.forEachNode((nodeId, attributes) => {
            nodes.push({ id: nodeId, attributes: attributes });
        });
        // Handle potentially large output - maybe summarize or paginate in future?
        const nodesString = JSON.stringify(nodes, null, 2);
        return { content: [{ type: "text", text: `All nodes in project ${project_name}:
${nodesString}` }] };
    }
    catch (error) {
        console.error("Error getting all nodes:", error);
        return { content: [{ type: "text", text: `Error getting all nodes: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Get All Edges
server.tool("mcp_memory_bank_get_all_edges", "Retrieves all edges in the graph.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
}, async ({ project_name }) => {
    try {
        const graph = loadGraph(project_name);
        const edges = [];
        // Use graph.edges() iterator for potentially cleaner code
        graph.forEachEdge((edgeKey, attributes, source, target, _sourceAttributes, _targetAttributes, undirected) => {
            edges.push({ key: edgeKey, source, target, attributes: attributes, undirected });
        });
        const edgesString = JSON.stringify(edges, null, 2);
        return { content: [{ type: "text", text: `All edges in project ${project_name}:
${edgesString}` }] };
    }
    catch (error) {
        console.error("Error getting all edges:", error);
        return { content: [{ type: "text", text: `Error getting all edges: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Query Graph (Basic Example: find nodes by type/label and neighbors)
// Define Zod schema for the query object
const QueryObjectSchema = zod_1.z.object({
    filters: zod_1.z.array(zod_1.z.object({
        attribute: zod_1.z.enum(["type", "label", "dataKey"]), // Which attribute to filter on
        value: zod_1.z.string(), // The value to match (simple substring match for now)
        dataKey: zod_1.z.string().optional().describe("Specific key within 'data' if attribute is 'dataKey'")
    })).optional().describe("Filters to apply to nodes"),
    neighborsOf: zod_1.z.string().optional().describe("Find neighbors of this node ID"),
    relationshipType: zod_1.z.string().optional().describe("Filter neighbors by relationship type (used with neighborsOf)"),
    direction: zod_1.z.enum(["in", "out", "both"]).optional().default("both").describe("Direction of neighbors (used with neighborsOf)"),
}).describe("Query object for searching the graph");
server.tool("mcp_memory_bank_query_graph", "Queries the knowledge graph based on filters or neighbors.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    query: QueryObjectSchema,
}, async ({ project_name, query }) => {
    try {
        const graph = loadGraph(project_name);
        const resultNodes = []; // Initialize explicitly
        if (query.neighborsOf) {
            const nodeId = query.neighborsOf;
            if (!graph.hasNode(nodeId)) {
                return { content: [{ type: "text", text: `Query Error: Node ${nodeId} not found.` }] };
            }
            const foundNeighbors = new Set(); // Track found neighbors to avoid duplicates in result
            const processNeighbor = (neighborId, attributes) => {
                if (foundNeighbors.has(neighborId))
                    return; // Skip if already added
                let includeNeighbor = true;
                if (query.relationshipType) {
                    includeNeighbor = false;
                    // Check edges in the relevant direction(s)
                    if (query.direction === 'out' || query.direction === 'both') {
                        graph.forEachDirectedEdge(nodeId, neighborId, (key, attrs) => {
                            if (attrs.relationshipType === query.relationshipType)
                                includeNeighbor = true;
                        });
                    }
                    if (!includeNeighbor && (query.direction === 'in' || query.direction === 'both')) {
                        graph.forEachDirectedEdge(neighborId, nodeId, (key, attrs) => {
                            if (attrs.relationshipType === query.relationshipType)
                                includeNeighbor = true;
                        });
                    }
                }
                if (includeNeighbor) {
                    resultNodes.push({ id: neighborId, attributes: attributes });
                    foundNeighbors.add(neighborId);
                }
            };
            switch (query.direction) {
                case "in":
                    graph.forEachInNeighbor(nodeId, processNeighbor);
                    break;
                case "out":
                    graph.forEachOutNeighbor(nodeId, processNeighbor);
                    break;
                default:
                    graph.forEachNeighbor(nodeId, processNeighbor);
                    break; // both
            }
        }
        else if (query.filters && query.filters.length > 0) {
            // Filter nodes
            graph.forEachNode((nodeId, attributes) => {
                const nodeAttrs = attributes;
                let match = true;
                for (const filter of query.filters) {
                    let attributeValue;
                    if (filter.attribute === "type") {
                        attributeValue = nodeAttrs.type;
                    }
                    else if (filter.attribute === "label") {
                        attributeValue = nodeAttrs.label;
                    }
                    else if (filter.attribute === "dataKey" && filter.dataKey && nodeAttrs.data) {
                        attributeValue = nodeAttrs.data[filter.dataKey];
                    }
                    else {
                        match = false; // Invalid filter attribute combination
                        break;
                    }
                    // Simple case-insensitive substring match (can be extended)
                    if (typeof attributeValue !== 'string' || !attributeValue.toLowerCase().includes(filter.value.toLowerCase())) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    resultNodes.push({ id: nodeId, attributes: nodeAttrs });
                }
            });
        }
        else {
            // No filters or neighborsOf specified, return all nodes as per previous logic
            graph.forEachNode((nodeId, attributes) => {
                resultNodes.push({ id: nodeId, attributes: attributes });
            });
        }
        const resultString = JSON.stringify(resultNodes, null, 2);
        return { content: [{ type: "text", text: `Query results for project ${project_name}:
${resultString}` }] };
    }
    catch (error) {
        console.error("Error querying graph:", error);
        return { content: [{ type: "text", text: `Error querying graph: ${error instanceof Error ? error.message : String(error)}` }] };
    }
});
// Batch Graph Operations
// Define Zod schemas for batch operations
const BatchNodeSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).describe("Unique ID for the node"),
    type: zod_1.z.string().min(1).describe("Type of the node (e.g., Function, File, Concept)"),
    label: zod_1.z.string().min(1).describe("Human-readable label for the node"),
    data: zod_1.z.record(zod_1.z.any()).optional().describe("Optional structured data for the node"),
});
const BatchEdgeSchema = zod_1.z.object({
    sourceId: zod_1.z.string().min(1).describe("ID of the source node"),
    targetId: zod_1.z.string().min(1).describe("ID of the target node"),
    relationshipType: zod_1.z.string().min(1).describe("Type of the relationship (e.g., CALLS, IMPLEMENTS)"),
});
// Batch Operations Tool
server.tool("mcp_memory_bank_batch_operations", "Performs batch operations on nodes and edges in a single transaction.", {
    project_name: zod_1.z.string().min(1).describe("Name of the project"),
    nodes: zod_1.z.array(BatchNodeSchema).optional().describe("Array of nodes to add or update"),
    edges: zod_1.z.array(BatchEdgeSchema).optional().describe("Array of edges to add"),
    operation_type: zod_1.z.enum(["add"]).default("add").describe("Type of batch operation (currently only 'add' is supported)"),
}, async ({ project_name, nodes, edges, operation_type }) => {
    try {
        // Validate inputs
        if ((!nodes || nodes.length === 0) && (!edges || edges.length === 0)) {
            return {
                content: [{
                        type: "text",
                        text: "Error: At least one node or edge must be specified for batch operation."
                    }]
            };
        }
        // Load the graph only once for the entire batch operation
        const graph = loadGraph(project_name);
        // Track results for detailed reporting
        const results = {
            nodesAdded: 0,
            nodesSkipped: 0,
            edgesAdded: 0,
            edgesSkipped: 0,
            errors: []
        };
        // Process all nodes first
        if (nodes && nodes.length > 0) {
            for (const node of nodes) {
                try {
                    if (graph.hasNode(node.id)) {
                        // Skip existing nodes to prevent overwriting
                        results.nodesSkipped++;
                        results.errors.push(`Node ${node.id} already exists and was skipped.`);
                    }
                    else {
                        graph.addNode(node.id, {
                            id: node.id,
                            type: node.type,
                            label: node.label,
                            data: node.data || {}
                        });
                        results.nodesAdded++;
                    }
                }
                catch (nodeError) {
                    results.errors.push(`Error processing node ${node.id}: ${nodeError instanceof Error ? nodeError.message : String(nodeError)}`);
                }
            }
        }
        // Process all edges after nodes are added
        if (edges && edges.length > 0) {
            for (const edge of edges) {
                try {
                    // Verify that source and target nodes exist
                    if (!graph.hasNode(edge.sourceId)) {
                        results.edgesSkipped++;
                        results.errors.push(`Edge skipped: Source node ${edge.sourceId} not found.`);
                        continue;
                    }
                    if (!graph.hasNode(edge.targetId)) {
                        results.edgesSkipped++;
                        results.errors.push(`Edge skipped: Target node ${edge.targetId} not found.`);
                        continue;
                    }
                    // Add the edge
                    graph.addDirectedEdge(edge.sourceId, edge.targetId, { relationshipType: edge.relationshipType });
                    results.edgesAdded++;
                }
                catch (edgeError) {
                    results.errors.push(`Error processing edge from ${edge.sourceId} to ${edge.targetId}: ${edgeError instanceof Error ? edgeError.message : String(edgeError)}`);
                }
            }
        }
        // Save the graph only once after all operations
        saveGraph(project_name, graph);
        // Build response message
        let resultMessage = `Batch operation completed for project ${project_name}:\n`;
        resultMessage += `- Nodes added: ${results.nodesAdded}\n`;
        resultMessage += `- Nodes skipped: ${results.nodesSkipped}\n`;
        resultMessage += `- Edges added: ${results.edgesAdded}\n`;
        resultMessage += `- Edges skipped: ${results.edgesSkipped}\n`;
        if (results.errors.length > 0) {
            resultMessage += `\nWarnings/Errors (${results.errors.length}):\n`;
            resultMessage += results.errors.map(err => `- ${err}`).join('\n');
        }
        return { content: [{ type: "text", text: resultMessage }] };
    }
    catch (error) {
        console.error("Error in batch operation:", error);
        return {
            content: [{
                    type: "text",
                    text: `Error in batch operation: ${error instanceof Error ? error.message : String(error)}`
                }]
        };
    }
});
// --- End Graph Tools Implementation and Registration ---
// Запускаем сервер с использованием stdio транспорта
async function main() {
    try {
        const transport = new stdio_js_1.StdioServerTransport();
        await server.connect(transport);
        console.error(`Memory Bank MCP Server running on stdio`);
        console.error(`Memory base path: ${MEMORY_BASE_PATH}`);
    }
    catch (error) {
        console.error("Fatal error:", error);
        process.exit(1);
    }
}
main();
