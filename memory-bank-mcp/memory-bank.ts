import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs-extra";
import * as path from "path";
import Graph from 'graphology';
import { SerializedGraph, Attributes } from 'graphology-types';

// Определяем базовый путь для хранения данных
const MEMORY_BASE_PATH = process.env.MEMORY_BASE_PATH || "E:/memory-bank-cursor";

// Убедимся, что директория существует
try {
  fs.ensureDirSync(MEMORY_BASE_PATH);
  console.error(`Memory bank base directory initialized at: ${MEMORY_BASE_PATH}`);
} catch (error) {
  console.error(`Failed to create memory bank directory: ${error instanceof Error ? error.message : String(error)}`);
}

// Создаем экземпляр MCP сервера
const server = new McpServer({
  name: "Memory Bank",
  version: "2.2.0",
});

// --- Type Definitions for Graph ---
interface GraphNodeAttributes extends Attributes {
  id: string; // Ensure ID is part of attributes for easy access
  type: string;
  label: string;
  data?: Record<string, any>; // Optional structured data
  metadata?: {
    createdAt: string;      // Дата создания узла
    lastModified: string;   // Дата последнего обновления
    version: number;        // Версия узла (увеличивается при изменениях)
  }
}

interface GraphEdgeAttributes extends Attributes {
  relationshipType: string;
  metadata?: {
    createdAt: string;      // Дата создания ребра
    lastModified: string;   // Дата последнего обновления
    version: number;        // Версия ребра (увеличивается при изменениях)
  }
}

// Расширяем типы graphology для поддержки метаданных графа
interface EnhancedSerializedGraph extends SerializedGraph {
  metadata?: {
    lastSaved: string;
    nodeCount: number;
    edgeCount: number;
    version: number;
  }
}
// --- End Type Definitions ---

// Регистрируем инструмент для получения списка проектов
server.tool(
  "list_projects",
  "Lists all projects in the memory bank",
  {},
  async () => {
    try {
      if (!fs.existsSync(MEMORY_BASE_PATH)) {
        return {
          content: [
            {
              type: "text",
              text: "Memory bank base directory does not exist. Please initialize it first with init_memory_bank.",
            },
          ],
        };
      }

      const projects = fs.readdirSync(MEMORY_BASE_PATH)
        .filter(item => {
          const itemPath = path.join(MEMORY_BASE_PATH, item);
          return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
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
    } catch (error) {
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
  }
);

// Регистрируем инструмент для создания нового проекта
server.tool(
  "create_project",
  "Creates a new project in the memory bank",
  {
    project_name: z.string().min(1).describe("Name of the project to create"),
  },
  async ({ project_name }) => {
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
      if (fs.existsSync(projectPath)) {
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
      fs.ensureDirSync(projectPath);
      
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
        } else {
          content = `# ${file}\n\n`;
        }
        
        fs.writeFileSync(filePath, content, 'utf-8');
      }
      
      // Create an empty graph file
      const graph = new Graph({ multi: true, allowSelfLoops: true, type: 'directed' });
      saveGraph(sanitizedProjectName, graph); // Save the initial empty graph

      return {
        content: [
          {
            type: "text",
            text: `Project ${sanitizedProjectName} created successfully with ${baseFiles.length} base files and an empty graph.json.`,
          },
        ],
      };
    } catch (error) {
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
  }
);

// Регистрируем инструмент для получения списка файлов проекта
server.tool(
  "list_project_files",
  "Lists all files in a project",
  {
    project_name: z.string().min(1).describe("Name of the project"),
  },
  async ({ project_name }) => {
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
      if (!fs.existsSync(projectPath)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Project ${sanitizedProjectName} not found`,
            },
          ],
        };
      }
      if (!fs.statSync(projectPath).isDirectory()) {
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
      const items = fs.readdirSync(projectPath);
      const filesAndDirs = items.map(item => {
        const itemPath = path.join(projectPath, item); // Use path.join for cross-platform compatibility
        try {
          const stat = fs.statSync(itemPath);
          // Show graph.json specifically if needed, otherwise just list files/dirs
          return stat.isDirectory() ? `- ${item}/ (Directory)` : `- ${item}`;
        } catch (err) {
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
    } catch (error) {
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
  }
);

// Регистрируем инструмент для получения содержимого файла
server.tool(
  "get_file_content",
  "Gets the content of a file in a project",
  {
    project_name: z.string().min(1).describe("Name of the project"),
    file_path: z.string().min(1).describe("Path to the file within the project"),
  },
  async ({ project_name, file_path }) => {
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
      if (!fs.existsSync(projectPath)) {
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
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
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
      const content = fs.readFileSync(filePath, 'utf-8');
      
      return {
        content: [
          {
            type: "text",
            text: `Content of ${normalizedFilePath} in project ${project_name}:\n\n${content}`,
          },
        ],
      };
    } catch (error) {
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
  }
);

// Регистрируем инструмент для обновления содержимого файла
server.tool(
  "update_file_content",
  "Updates the content of a file in a project",
  {
    project_name: z.string().min(1).describe("Name of the project"),
    file_path: z.string().min(1).describe("Path to the file within the project"),
    content: z.string().describe("New content of the file"),
  },
  async ({ project_name, file_path, content }) => {
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
      if (!fs.existsSync(projectPath)) {
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
        fs.ensureDirSync(path.dirname(filePath));
      } catch (err) {
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
        fs.writeFileSync(filePath, content, 'utf-8');
      } catch (err) {
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
    } catch (error) {
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
  }
);

// Регистрируем инструмент для инициализации банка памяти
server.tool(
  "init_memory_bank",
  "Initializes the memory bank directory structure",
  {},
  async () => {
    try {
      // Создаем базовую директорию, если она не существует
      if (fs.existsSync(MEMORY_BASE_PATH)) {
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
        fs.ensureDirSync(MEMORY_BASE_PATH);
      } catch (err) {
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
    } catch (error) {
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
  }
);

// --- Graph Helper Functions ---

// Функция для создания метаданных с текущей датой и начальной версией
const createInitialMetadata = (): { createdAt: string, lastModified: string, version: number } => {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    lastModified: now,
    version: 1
  };
};

// Функция для обновления метаданных при изменении узла или ребра
const updateMetadata = (existing: { createdAt: string, lastModified: string, version: number }): { createdAt: string, lastModified: string, version: number } => {
  return {
    createdAt: existing.createdAt,
    lastModified: new Date().toISOString(),
    version: existing.version + 1
  };
};

// Сортировка узлов по алфавиту (по ID)
const sortNodesByAlphabet = (nodes: any[]): any[] => {
  return [...nodes].sort((a, b) => {
    return a.key.localeCompare(b.key);
  });
};

// Сортировка рёбер по исходному узлу, целевому узлу, затем по типу отношения
const sortEdgesByAlphabet = (edges: any[]): any[] => {
  return [...edges].sort((a, b) => {
    // Сначала сортируем по исходному узлу
    const sourceCompare = a.source.localeCompare(b.source);
    if (sourceCompare !== 0) return sourceCompare;
    
    // При одинаковых исходных узлах сортируем по целевому узлу
    const targetCompare = a.target.localeCompare(b.target);
    if (targetCompare !== 0) return targetCompare;
    
    // При одинаковых исходных и целевых узлах сортируем по типу отношения
    return a.attributes.relationshipType.localeCompare(b.attributes.relationshipType);
  });
};

// Function to get the path to the graph.json file for a project
const getGraphPath = (projectName: string): string => {
  // Sanitize project name again for safety when constructing path
  const sanitizedProjectName = projectName.replace(/[<>:"/\|?*]/g, "_");
  return path.join(MEMORY_BASE_PATH, sanitizedProjectName, "graph.json");
};

// Function to load a graph for a project
const loadGraph = (projectName: string): Graph => {
  const graphPath = getGraphPath(projectName);
  if (fs.existsSync(graphPath)) {
    try {
      const data = fs.readJsonSync(graphPath) as EnhancedSerializedGraph;
      // Ensure the graph is created with correct options even when loaded
      const graph = new Graph({ multi: true, allowSelfLoops: true, type: 'directed' });
      graph.import(data);
      return graph;
    } catch (error) {
      console.error(`Error loading or parsing graph for ${projectName} from ${graphPath}:`, error);
      // Return a new graph if loading fails
      return new Graph({ multi: true, allowSelfLoops: true, type: 'directed' });
    }
  }
  // Return a new graph if the file doesn't exist
  return new Graph({ multi: true, allowSelfLoops: true, type: 'directed' });
};

// Function to save a graph for a project
const saveGraph = (projectName: string, graph: Graph): void => {
  const graphPath = getGraphPath(projectName);
  try {
    fs.ensureDirSync(path.dirname(graphPath));
    
    // Экспортируем граф в объект
    const exportedGraph = graph.export() as EnhancedSerializedGraph;
    
    // Сортируем узлы алфавитно по ключу
    exportedGraph.nodes = sortNodesByAlphabet(exportedGraph.nodes);
    
    // Сортируем рёбра по исходному узлу, целевому узлу и типу отношения
    exportedGraph.edges = sortEdgesByAlphabet(exportedGraph.edges);
    
    // Добавляем метаданные о сохранении
    exportedGraph.metadata = {
      lastSaved: new Date().toISOString(),
      nodeCount: exportedGraph.nodes.length,
      edgeCount: exportedGraph.edges.length,
      version: exportedGraph.metadata ? (exportedGraph.metadata.version || 0) + 1 : 1
    };
    
    // Сохраняем отсортированный граф с улучшенными метаданными
    fs.writeJsonSync(graphPath, exportedGraph, { spaces: 2 });
  } catch (error) {
    console.error(`Error saving graph for ${projectName} to ${graphPath}:`, error);
    throw new Error(`Failed to save graph: ${error instanceof Error ? error.message : String(error)}`);
  }
};
// --- End Graph Helper Functions ---

// --- Graph Tools Implementation and Registration ---

// Define Zod schemas for batch operations
const BatchNodeAddSchema = z.object({
  id: z.string().min(1).describe("Уникальный ID для узла"),
  type: z.string().min(1).describe("Тип узла (например, Function, File, Concept)"),
  label: z.string().min(1).describe("Человекочитаемая метка узла"),
  data: z.record(z.any()).optional().describe("Опциональные структурированные данные узла"),
});

const BatchEdgeAddSchema = z.object({
  sourceId: z.string().min(1).describe("ID исходного узла"),
  targetId: z.string().min(1).describe("ID целевого узла"),
  relationshipType: z.string().min(1).describe("Тип отношения (например, CALLS, IMPLEMENTS)"),
});

const BatchNodeUpdateSchema = z.object({
  id: z.string().min(1).describe("ID узла для обновления"),
  newLabel: z.string().optional().describe("Новая метка для узла"),
  data: z.record(z.any()).optional().describe("Данные для объединения с существующими данными узла"),
});

const BatchEdgeDeleteSchema = z.object({
  sourceId: z.string().min(1).describe("ID исходного узла"),
  targetId: z.string().min(1).describe("ID целевого узла"),
  relationshipType: z.string().optional().describe("Тип отношения для удаления (если не указан, удаляются все отношения между указанными узлами)"),
});

// Define Zod schemas for search and query operations
const SearchGraphSchema = z.object({
  project_name: z.string().min(1).describe("Имя проекта"),
  query: z.string().min(1).describe("Строка поиска"),
  search_in: z.array(z.enum(["id", "type", "label", "data"])).default(["id", "type", "label"]).describe("Где искать (id, type, label, data)"),
  case_sensitive: z.boolean().default(false).describe("Учитывать регистр"),
  limit: z.number().int().positive().default(10).describe("Максимальное количество результатов")
});

// Schema for graph queries with filtering
const QueryObjectSchema = z.object({
  filters: z.array(z.object({
    attribute: z.enum(["type", "label", "dataKey"]).describe("Атрибут для фильтрации"),
    value: z.string().describe("Значение для сравнения"),
    dataKey: z.string().optional().describe("Ключ в объекте data, если attribute='dataKey'")
  })).optional().describe("Фильтры для узлов"),
  neighborsOf: z.string().optional().describe("ID узла для поиска соседей"),
  relationshipType: z.string().optional().describe("Тип отношения для фильтрации соседей"),
  direction: z.enum(["in", "out", "both"]).optional().default("both").describe("Направление для соседей"),
  limit: z.number().int().positive().optional().default(50).describe("Максимальное количество результатов")
});

// Schema for retrieving specific nodes and their relations
const OpenNodesSchema = z.object({
  project_name: z.string().min(1).describe("Имя проекта"),
  node_ids: z.array(z.string()).min(1).describe("Массив ID узлов"),
  include_relations: z.boolean().default(true).describe("Включать связи между узлами")
});

// Batch Add Operation
server.tool(
  "mcp_memory_bank_batch_add",
  "Добавляет несколько узлов и рёбер в одной транзакции, сохраняя алфавитный порядок.",
  {
    project_name: z.string().min(1).describe("Имя проекта"),
    nodes: z.array(BatchNodeAddSchema).optional().describe("Массив узлов для добавления"),
    edges: z.array(BatchEdgeAddSchema).optional().describe("Массив рёбер для добавления"),
    silent_mode: z.boolean().default(false).describe("Не выдавать ошибки для существующих элементов")
  },
  async ({ project_name, nodes, edges, silent_mode }) => {
    try {
      // Валидация входных данных
      if ((!nodes || nodes.length === 0) && (!edges || edges.length === 0)) {
        return { 
          content: [{ 
            type: "text", 
            text: "Ошибка: Для выполнения операции требуется указать хотя бы один узел или ребро." 
          }] 
        };
      }

      // Загружаем граф один раз для всей пакетной операции
      const graph = loadGraph(project_name);
      
      // Отслеживаем результаты для подробного отчёта
      const results = {
        nodesAdded: 0,
        nodesSkipped: 0,
        edgesAdded: 0,
        edgesSkipped: 0,
        errors: [] as string[]
      };

      // Сначала обрабатываем все узлы
      if (nodes && nodes.length > 0) {
        // Сортируем узлы по алфавиту (по ID) перед обработкой
        const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
        
        for (const node of sortedNodes) {
          try {
            if (graph.hasNode(node.id)) {
              // Пропускаем существующие узлы, чтобы избежать перезаписи
              if (!silent_mode) {
                results.nodesSkipped++;
                results.errors.push(`Узел ${node.id} уже существует и был пропущен.`);
              }
       } else {
              const metadata = createInitialMetadata();
              graph.addNode(node.id, { 
                id: node.id, 
                type: node.type, 
                label: node.label, 
                data: node.data || {},
                metadata
              } as GraphNodeAttributes);
              results.nodesAdded++;
            }
          } catch (nodeError) {
            results.errors.push(`Ошибка при обработке узла ${node.id}: ${nodeError instanceof Error ? nodeError.message : String(nodeError)}`);
          }
        }
      }

      // Затем обрабатываем все рёбра после добавления узлов
      if (edges && edges.length > 0) {
        // Сортируем рёбра по исходному узлу, затем по целевому узлу, затем по типу отношения
        const sortedEdges = [...edges].sort((a, b) => {
          const sourceCompare = a.sourceId.localeCompare(b.sourceId);
          if (sourceCompare !== 0) return sourceCompare;
          
          const targetCompare = a.targetId.localeCompare(b.targetId);
          if (targetCompare !== 0) return targetCompare;
          
          return a.relationshipType.localeCompare(b.relationshipType);
        });
        
        for (const edge of sortedEdges) {
          try {
            // Проверяем, что исходный и целевой узлы существуют
            if (!graph.hasNode(edge.sourceId)) {
              results.edgesSkipped++;
              results.errors.push(`Ребро пропущено: Исходный узел ${edge.sourceId} не найден.`);
              continue;
            }
            
            if (!graph.hasNode(edge.targetId)) {
              results.edgesSkipped++;
              results.errors.push(`Ребро пропущено: Целевой узел ${edge.targetId} не найден.`);
              continue;
            }
            
            // Добавляем ребро с метаданными
            const metadata = createInitialMetadata();
            graph.addDirectedEdge(
              edge.sourceId, 
              edge.targetId, 
              { 
                relationshipType: edge.relationshipType,
                metadata 
              } as GraphEdgeAttributes
            );
            results.edgesAdded++;
          } catch (edgeError) {
            results.errors.push(`Ошибка при обработке ребра от ${edge.sourceId} к ${edge.targetId}: ${edgeError instanceof Error ? edgeError.message : String(edgeError)}`);
          }
        }
      }

      // Сохраняем граф только один раз после всех операций (с сортировкой)
          saveGraph(project_name, graph);
      
      // Формируем сообщение с результатами
      let resultMessage = `Операция пакетного добавления выполнена для проекта ${project_name}:\n`;
      resultMessage += `- Узлов добавлено: ${results.nodesAdded}\n`;
      resultMessage += `- Узлов пропущено: ${results.nodesSkipped}\n`;
      resultMessage += `- Рёбер добавлено: ${results.edgesAdded}\n`;
      resultMessage += `- Рёбер пропущено: ${results.edgesSkipped}\n`;
      
      if (results.errors.length > 0) {
        resultMessage += `\nПредупреждения/Ошибки (${results.errors.length}):\n`;
        resultMessage += results.errors.map(err => `- ${err}`).join('\n');
      }
      
      return { content: [{ type: "text", text: resultMessage }] };
      } catch (error) {
      console.error("Ошибка пакетного добавления:", error);
      return { 
        content: [{ 
          type: "text", 
          text: `Ошибка пакетного добавления: ${error instanceof Error ? error.message : String(error)}` 
        }] 
      };
    }
  }
);

// Batch Update Operation
server.tool(
  "mcp_memory_bank_batch_update",
  "Обновляет несколько существующих узлов в одной транзакции",
  {
    project_name: z.string().min(1).describe("Имя проекта"),
    nodes: z.array(BatchNodeUpdateSchema).describe("Массив узлов для обновления"),
    silent_mode: z.boolean().default(false).describe("Не выдавать ошибки для отсутствующих элементов")
  },
  async ({ project_name, nodes, silent_mode }) => {
    try {
      // Валидация входных данных
      if (!nodes || nodes.length === 0) {
        return { 
          content: [{ 
            type: "text", 
            text: "Ошибка: Для выполнения операции обновления требуется указать хотя бы один узел." 
          }] 
        };
      }

      // Загружаем граф
          const graph = loadGraph(project_name);
      
      // Отслеживаем результаты
      const results = {
        nodesUpdated: 0,
        nodesSkipped: 0,
        errors: [] as string[]
      };

      // Сортируем узлы по алфавиту (по ID) перед обработкой
      const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
      
      for (const node of sortedNodes) {
        try {
          if (!graph.hasNode(node.id)) {
            if (!silent_mode) {
              results.nodesSkipped++;
              results.errors.push(`Узел ${node.id} не найден и был пропущен.`);
            }
            continue;
          }

          const existingAttributes = graph.getNodeAttributes(node.id) as GraphNodeAttributes;
          const updatedAttributes: Partial<GraphNodeAttributes> = {};
          
          // Обновляем метку, если указана
          if (node.newLabel) {
            updatedAttributes.label = node.newLabel;
          }
          
          // Объединяем данные, если указаны
          if (node.data) {
            updatedAttributes.data = { ...existingAttributes.data, ...node.data };
          }

          // Обновляем только если есть изменения
          if (Object.keys(updatedAttributes).length > 0) {
            // Обновляем метаданные
            updatedAttributes.metadata = updateMetadata(existingAttributes.metadata || createInitialMetadata());
            
            graph.mergeNodeAttributes(node.id, updatedAttributes);
            results.nodesUpdated++;
                        } else {
            results.nodesSkipped++;
            results.errors.push(`Для узла ${node.id} не указаны параметры для обновления.`);
          }
        } catch (nodeError) {
          results.errors.push(`Ошибка при обновлении узла ${node.id}: ${nodeError instanceof Error ? nodeError.message : String(nodeError)}`);
        }
      }

      // Сохраняем граф только один раз после всех операций (с сортировкой)
      saveGraph(project_name, graph);
      
      // Формируем сообщение с результатами
      let resultMessage = `Операция пакетного обновления выполнена для проекта ${project_name}:\n`;
      resultMessage += `- Узлов обновлено: ${results.nodesUpdated}\n`;
      resultMessage += `- Узлов пропущено: ${results.nodesSkipped}\n`;
      
      if (results.errors.length > 0) {
        resultMessage += `\nПредупреждения/Ошибки (${results.errors.length}):\n`;
        resultMessage += results.errors.map(err => `- ${err}`).join('\n');
      }
      
      return { content: [{ type: "text", text: resultMessage }] };
        } catch (error) {
      console.error("Ошибка пакетного обновления:", error);
      return { 
        content: [{ 
          type: "text", 
          text: `Ошибка пакетного обновления: ${error instanceof Error ? error.message : String(error)}` 
        }] 
      };
    }
  }
);

// Batch Delete Operation
server.tool(
  "mcp_memory_bank_batch_delete",
  "Удаляет несколько узлов (вместе с их связями) или конкретные рёбра в одной транзакции",
  {
    project_name: z.string().min(1).describe("Имя проекта"),
    nodeIds: z.array(z.string()).optional().describe("Массив ID узлов для удаления (вместе с их связями)"),
    edges: z.array(BatchEdgeDeleteSchema).optional().describe("Массив конкретных рёбер для удаления"),
    silent_mode: z.boolean().default(true).describe("Не выдавать ошибки для отсутствующих элементов")
  },
  async ({ project_name, nodeIds, edges, silent_mode }) => {
    try {
      // Валидация входных данных
      if ((!nodeIds || nodeIds.length === 0) && (!edges || edges.length === 0)) {
        return { 
          content: [{ 
            type: "text", 
            text: "Ошибка: Для выполнения операции удаления требуется указать хотя бы один узел или ребро." 
          }] 
        };
      }

      // Загружаем граф
      const graph = loadGraph(project_name);
      
      // Отслеживаем результаты
      const results = {
        nodesDeleted: 0,
        nodesSkipped: 0,
        edgesDeleted: 0,
        edgesSkipped: 0,
        errors: [] as string[]
      };

      // Сначала удаляем узлы, если указаны
      if (nodeIds && nodeIds.length > 0) {
        // Сортируем ID узлов по алфавиту перед обработкой
        const sortedNodeIds = [...nodeIds].sort((a, b) => a.localeCompare(b));
        
        for (const nodeId of sortedNodeIds) {
          try {
            if (!graph.hasNode(nodeId)) {
              if (!silent_mode) {
              results.nodesSkipped++;
                results.errors.push(`Узел ${nodeId} не найден и был пропущен.`);
              }
              continue;
            }
            
            // dropNode автоматически удаляет все связанные рёбра
            graph.dropNode(nodeId);
            results.nodesDeleted++;
          } catch (nodeError) {
            results.errors.push(`Ошибка при удалении узла ${nodeId}: ${nodeError instanceof Error ? nodeError.message : String(nodeError)}`);
          }
        }
      }

      // Затем удаляем рёбра, если указаны
      if (edges && edges.length > 0) {
        // Сортируем рёбра по исходному узлу, затем по целевому узлу
        const sortedEdges = [...edges].sort((a, b) => {
          const sourceCompare = a.sourceId.localeCompare(b.sourceId);
          if (sourceCompare !== 0) return sourceCompare;
          
          return a.targetId.localeCompare(b.targetId);
        });
        
        for (const edge of sortedEdges) {
          try {
            // Проверяем, что исходный и целевой узлы существуют
            if (!graph.hasNode(edge.sourceId)) {
              if (!silent_mode) {
              results.edgesSkipped++;
                results.errors.push(`Ребро пропущено: Исходный узел ${edge.sourceId} не найден.`);
              }
              continue;
            }
            
            if (!graph.hasNode(edge.targetId)) {
              if (!silent_mode) {
              results.edgesSkipped++;
                results.errors.push(`Ребро пропущено: Целевой узел ${edge.targetId} не найден.`);
              }
              continue;
            }
            
            const edgesToDelete: string[] = [];
            
            // Находим рёбра для удаления
            graph.forEachDirectedEdge(edge.sourceId, edge.targetId, (edgeKey, attributes) => {
              // Если тип отношения указан, удаляем только рёбра этого типа
              // Иначе удаляем все рёбра между этими узлами
              if (!edge.relationshipType || 
                 (attributes as GraphEdgeAttributes).relationshipType === edge.relationshipType) {
                edgesToDelete.push(edgeKey);
              }
            });
            
            if (edgesToDelete.length === 0) {
              if (!silent_mode) {
                results.edgesSkipped++;
                const relationshipText = edge.relationshipType ? 
                  `с типом '${edge.relationshipType}'` : "";
                results.errors.push(`Рёбра от ${edge.sourceId} к ${edge.targetId} ${relationshipText} не найдены.`);
              }
              continue;
            }
            
            // Удаляем рёбра
            edgesToDelete.forEach(edgeKey => graph.dropEdge(edgeKey));
            results.edgesDeleted += edgesToDelete.length;
          } catch (edgeError) {
            results.errors.push(`Ошибка при удалении ребра от ${edge.sourceId} к ${edge.targetId}: ${edgeError instanceof Error ? edgeError.message : String(edgeError)}`);
          }
        }
      }

      // Сохраняем граф только один раз после всех операций (с сортировкой)
      saveGraph(project_name, graph);
      
      // Формируем сообщение с результатами
      let resultMessage = `Операция пакетного удаления выполнена для проекта ${project_name}:\n`;
      resultMessage += `- Узлов удалено: ${results.nodesDeleted}\n`;
      resultMessage += `- Узлов пропущено: ${results.nodesSkipped}\n`;
      resultMessage += `- Рёбер удалено: ${results.edgesDeleted}\n`;
      resultMessage += `- Рёбер пропущено: ${results.edgesSkipped}\n`;
      
      if (results.errors.length > 0) {
        resultMessage += `\nПредупреждения/Ошибки (${results.errors.length}):\n`;
        resultMessage += results.errors.map(err => `- ${err}`).join('\n');
      }
      
      return { content: [{ type: "text", text: resultMessage }] };
    } catch (error) {
      console.error("Ошибка пакетного удаления:", error);
      return { 
        content: [{ 
          type: "text", 
          text: `Ошибка пакетного удаления: ${error instanceof Error ? error.message : String(error)}` 
        }] 
      };
    }
  }
);

// Search Graph Operation
server.tool(
  "mcp_memory_bank_search_graph",
  "Поиск в графе знаний по различным параметрам",
  {
    project_name: z.string().min(1).describe("Имя проекта"),
    query: z.string().min(1).describe("Строка поиска"),
    search_in: z.array(z.enum(["id", "type", "label", "data"])).default(["id", "type", "label"]).describe("Где искать (id, type, label, data)"),
    case_sensitive: z.boolean().default(false).describe("Учитывать регистр"),
    limit: z.number().int().positive().default(10).describe("Максимальное количество результатов")
  },
  async ({ project_name, query, search_in, case_sensitive, limit }) => {
    try {
      const graph = loadGraph(project_name);
      const results: { nodes: any[], edges: any[] } = { nodes: [], edges: [] };
      const foundNodeIds = new Set<string>();
      
      // Нормализация строки поиска для регистронезависимого поиска
      const normalizedQuery = case_sensitive ? query : query.toLowerCase();
      
      // Поиск по узлам
      graph.forEachNode((nodeId, attributes) => {
        if (results.nodes.length >= limit) return;
        
        const nodeAttrs = attributes as GraphNodeAttributes;
        let match = false;
        
        // Поиск по ID
        if (search_in.includes("id")) {
          const normalizedId = case_sensitive ? nodeId : nodeId.toLowerCase();
          if (normalizedId.includes(normalizedQuery)) match = true;
        }
        
        // Поиск по типу
        if (!match && search_in.includes("type")) {
          const normalizedType = case_sensitive ? nodeAttrs.type : nodeAttrs.type.toLowerCase();
          if (normalizedType.includes(normalizedQuery)) match = true;
        }
        
        // Поиск по метке
        if (!match && search_in.includes("label")) {
          const normalizedLabel = case_sensitive ? nodeAttrs.label : nodeAttrs.label.toLowerCase();
          if (normalizedLabel.includes(normalizedQuery)) match = true;
        }
        
        // Поиск в данных
        if (!match && search_in.includes("data") && nodeAttrs.data) {
          const dataString = JSON.stringify(nodeAttrs.data);
          const normalizedData = case_sensitive ? dataString : dataString.toLowerCase();
          if (normalizedData.includes(normalizedQuery)) match = true;
        }
        
        if (match) {
          results.nodes.push({ id: nodeId, attributes: nodeAttrs });
          foundNodeIds.add(nodeId);
        }
      });
      
      // Поиск связанных рёбер между найденными узлами
      if (foundNodeIds.size > 0) {
        graph.forEachEdge((edgeKey, attributes, source, target) => {
          if (foundNodeIds.has(source) && foundNodeIds.has(target)) {
            results.edges.push({ 
              key: edgeKey, 
              source, 
              target, 
              attributes 
            });
          }
        });
      }
      
      return { 
        content: [{ 
          type: "text", 
          text: `Результаты поиска для "${query}" в проекте ${project_name}:\n${JSON.stringify(results, null, 2)}` 
        }] 
      };
    } catch (error) {
      console.error("Ошибка поиска по графу:", error);
      return { 
        content: [{ 
          type: "text", 
          text: `Ошибка поиска по графу: ${error instanceof Error ? error.message : String(error)}` 
        }] 
      };
    }
  }
);

// Query Graph Operation
server.tool(
  "mcp_memory_bank_query_graph",
  "Выполнение запросов к графу знаний с фильтрацией",
  {
    project_name: z.string().min(1).describe("Имя проекта"),
    query: QueryObjectSchema.describe("Объект запроса с фильтрами и параметрами поиска соседей")
  },
  async ({ project_name, query }) => {
    try {
      const graph = loadGraph(project_name);
      const results: { nodes: any[], edges: any[] } = { nodes: [], edges: [] };
      const foundNodeIds = new Set<string>();
      const limit = query.limit || 50;
      
      // Поиск соседей указанного узла
      if (query.neighborsOf) {
        const nodeId = query.neighborsOf;
        if (!graph.hasNode(nodeId)) {
          return { 
            content: [{ 
              type: "text", 
              text: `Ошибка: Узел с ID ${nodeId} не найден в проекте ${project_name}.` 
            }] 
          };
        }
        
        // Функция для обработки соседнего узла
        const processNeighbor = (neighborId: string, attributes: any) => {
          if (foundNodeIds.has(neighborId) || results.nodes.length >= limit) return;
          
          // Проверяем тип отношения, если указан
          let includeNeighbor = true;
          if (query.relationshipType) {
            includeNeighbor = false;
            
            // Проверяем рёбра в указанном направлении
            if (query.direction === 'out' || query.direction === 'both') {
              graph.forEachDirectedEdge(nodeId, neighborId, (edgeKey, attrs) => {
                if ((attrs as GraphEdgeAttributes).relationshipType === query.relationshipType) {
                  includeNeighbor = true;
                  // Добавляем ребро в результаты
                  results.edges.push({
                    key: edgeKey,
                    source: nodeId,
                    target: neighborId,
                    attributes: attrs
                  });
                }
              });
            }
            
            if (!includeNeighbor && (query.direction === 'in' || query.direction === 'both')) {
              graph.forEachDirectedEdge(neighborId, nodeId, (edgeKey, attrs) => {
                if ((attrs as GraphEdgeAttributes).relationshipType === query.relationshipType) {
                  includeNeighbor = true;
                  // Добавляем ребро в результаты
                  results.edges.push({
                    key: edgeKey,
                    source: neighborId,
                    target: nodeId,
                    attributes: attrs
                  });
                }
              });
            }
          } else {
            // Если тип отношения не указан, добавляем все рёбра между узлами
            if (query.direction === 'out' || query.direction === 'both') {
              graph.forEachDirectedEdge(nodeId, neighborId, (edgeKey, attrs) => {
                results.edges.push({
                  key: edgeKey,
                  source: nodeId,
                  target: neighborId,
                  attributes: attrs
                });
              });
            }
            
            if (query.direction === 'in' || query.direction === 'both') {
              graph.forEachDirectedEdge(neighborId, nodeId, (edgeKey, attrs) => {
                results.edges.push({
                  key: edgeKey,
                  source: neighborId,
                  target: nodeId,
                  attributes: attrs
                });
              });
            }
          }
          
          if (includeNeighbor) {
            results.nodes.push({ id: neighborId, attributes });
            foundNodeIds.add(neighborId);
          }
        };
        
        // Добавляем исходный узел в результаты
        const sourceAttributes = graph.getNodeAttributes(nodeId) as GraphNodeAttributes;
        results.nodes.push({ id: nodeId, attributes: sourceAttributes });
        foundNodeIds.add(nodeId);
        
        // Получаем соседей в указанном направлении
        switch (query.direction) {
          case "in":
            graph.forEachInNeighbor(nodeId, processNeighbor);
            break;
          case "out":
            graph.forEachOutNeighbor(nodeId, processNeighbor);
            break;
          default: // 'both'
            graph.forEachNeighbor(nodeId, processNeighbor);
            break;
        }
      }
      // Поиск по фильтрам
      else if (query.filters && query.filters.length > 0) {
        graph.forEachNode((nodeId, attributes) => {
          if (results.nodes.length >= limit) return;
          
          const nodeAttrs = attributes as GraphNodeAttributes;
          let match = true;
          
          for (const filter of query.filters!) {
            let attributeValue: any;
            
            // Определяем значение атрибута в зависимости от типа фильтра
            if (filter.attribute === "type") {
              attributeValue = nodeAttrs.type;
            } else if (filter.attribute === "label") {
              attributeValue = nodeAttrs.label;
            } else if (filter.attribute === "dataKey" && filter.dataKey && nodeAttrs.data) {
              attributeValue = nodeAttrs.data[filter.dataKey];
            } else {
              match = false;
              break;
            }
            
            // Простое сравнение строк (регистр не учитывается)
            if (typeof attributeValue !== 'string' || 
                !attributeValue.toLowerCase().includes(filter.value.toLowerCase())) {
              match = false;
              break;
            }
          }
          
          if (match) {
            results.nodes.push({ id: nodeId, attributes: nodeAttrs });
            foundNodeIds.add(nodeId);
          }
        });
        
        // Ищем рёбра между найденными узлами
        if (foundNodeIds.size > 1) {
          graph.forEachEdge((edgeKey, attributes, source, target) => {
            if (foundNodeIds.has(source) && foundNodeIds.has(target)) {
              results.edges.push({
                key: edgeKey,
                source,
                target,
                attributes
              });
            }
          });
        }
      }
      // Если ни фильтры, ни поиск соседей не указаны, возвращаем все узлы
      else {
        let count = 0;
        graph.forEachNode((nodeId, attributes) => {
          if (count >= limit) return;
          results.nodes.push({ id: nodeId, attributes });
          foundNodeIds.add(nodeId);
          count++;
        });
        
        // Добавляем рёбра между найденными узлами
        if (foundNodeIds.size > 1) {
          graph.forEachEdge((edgeKey, attributes, source, target) => {
            if (foundNodeIds.has(source) && foundNodeIds.has(target)) {
              results.edges.push({
                key: edgeKey,
                source,
                target,
                attributes
              });
            }
          });
        }
      }
      
      return { 
        content: [{ 
          type: "text", 
          text: `Результаты запроса к графу в проекте ${project_name}:\n${JSON.stringify(results, null, 2)}` 
        }] 
      };
    } catch (error) {
      console.error("Ошибка запроса к графу:", error);
      return { 
        content: [{ 
          type: "text", 
          text: `Ошибка запроса к графу: ${error instanceof Error ? error.message : String(error)}` 
        }] 
      };
    }
  }
);

// Get Specific Nodes Operation
server.tool(
  "mcp_memory_bank_open_nodes",
  "Получение конкретных узлов по ID и их взаимосвязей",
  {
    project_name: z.string().min(1).describe("Имя проекта"),
    node_ids: z.array(z.string()).min(1).describe("Массив ID узлов для получения"),
    include_relations: z.boolean().default(true).describe("Включать ли связи между запрошенными узлами")
  },
  async ({ project_name, node_ids, include_relations }) => {
    try {
      const graph = loadGraph(project_name);
      const result: { nodes: any[], edges: any[] } = { nodes: [], edges: [] };
      const existingNodeIds = new Set<string>();
      
      // Получение запрошенных узлов
      for (const nodeId of node_ids) {
        if (graph.hasNode(nodeId)) {
          const nodeAttrs = graph.getNodeAttributes(nodeId) as GraphNodeAttributes;
          result.nodes.push({ id: nodeId, attributes: nodeAttrs });
          existingNodeIds.add(nodeId);
        }
      }
      
      // Если узлов меньше, чем запрошено, добавляем информацию об отсутствующих
      if (existingNodeIds.size < node_ids.length) {
        const missingNodes = node_ids.filter(id => !existingNodeIds.has(id));
        if (missingNodes.length > 0) {
          console.warn(`Не найдены узлы: ${missingNodes.join(', ')}`);
        }
      }
      
      // Получение связей между запрошенными узлами, если требуется
      if (include_relations && existingNodeIds.size > 1) {
        graph.forEachEdge((edgeKey, attributes, source, target) => {
          if (existingNodeIds.has(source) && existingNodeIds.has(target)) {
            result.edges.push({ 
              key: edgeKey, 
              source, 
              target, 
              attributes 
            });
          }
        });
      }
      
      return { 
        content: [{ 
          type: "text", 
          text: `Узлы и их связи для проекта ${project_name}:\n${JSON.stringify(result, null, 2)}` 
        }] 
      };
    } catch (error) {
      console.error("Ошибка получения узлов:", error);
      return { 
        content: [{ 
          type: "text", 
          text: `Ошибка получения узлов: ${error instanceof Error ? error.message : String(error)}` 
        }] 
      };
    }
  }
);

// Запускаем сервер с использованием stdio транспорта
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`Memory Bank MCP Server running on stdio`);
    console.error(`Memory base path: ${MEMORY_BASE_PATH}`);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
