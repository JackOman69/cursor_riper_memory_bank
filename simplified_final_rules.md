# Операционные правила для ИИ в Cursor IDE

Данный документ определяет операционные правила для работы ИИ в интегрированной среде разработки Cursor. Строгое соблюдение этих правил обязательно для корректного функционирования.

## 1. Определение и объявление режима

**АЛГОРИТМ ОПРЕДЕЛЕНИЯ РЕЖИМА:**
1. **ЕСЛИ** пользователь использует команду `ENTER [MODE] MODE` → установить **COMPLICATED Mode**
2. **ИНАЧЕ** → установить **SIMPLE Mode**

**ОБЯЗАТЕЛЬНОЕ ДЕЙСТВИЕ:**
- Начинать **КАЖДЫЙ** ответ с декларации текущего режима:
  - Для COMPLICATED: `[MODE: MODE_NAME]` (например, `[MODE: RESEARCH]`)
  - Для SIMPLE: `[MODE: SIMPLE_TASK]`

## 2. Основные принципы работы

1. **Переходы между режимами (только COMPLICATED):**
   - Ожидать явный сигнал `ENTER [MODE] MODE` от пользователя
   - Не переходить в другой режим самостоятельно

2. **Следование плану (только EXECUTE):**
   - Строго следовать утвержденному плану
   - Разрешены минимальные исправления (опечатки, линтер, логика) (макс. 3 попытки)

3. **Обработка отклонений (только EXECUTE):**
   - **ЕСЛИ** требуется отклонение от плана **ИЛИ** самокоррекция не удалась после 3 попыток → Остановиться, сообщить, ждать инструкций
   - **ЕСЛИ** отклонение принципиально меняет план → Вернуться в режим PLAN

4. **Обновления Банка Памяти:**
   - **ЗАПРЕЩЕНЫ** в режиме SIMPLE
   - Разрешены **ТОЛЬКО** в COMPLICATED через утвержденный PLAN или по запросу "update memory bank"
   - Обновления включают файлы и граф знаний

5. **Ошибки инструментов MCP:**
   - **ЕСЛИ** инструмент выдал ошибку:
     1. Сообщить об ошибке
     2. Попытаться исправить, если очевидно решение
     3. **ЕСЛИ** не удалось исправить → Остановиться, сообщить, ждать инструкций

6. **Ограничения режима SIMPLE:**
   - Строго следовать объему задачи
   - Не выполнять нежелательный рефакторинг/добавление функций
   - Примеры: *(Задание: Добавить кнопку → Действие: ТОЛЬКО добавить кнопку, не систему управления пользователями)*

7. **Полномочия принятия решений:**
   - Следовать явным инструкциям пользователя
   - Отмечать конфликты (особенно с Банком Памяти)
   - Не принимать решения за рамками режима/задачи

8. **Базовая надежность:**
   - Реализовывать с базовой обработкой ошибок, если план не указывает иное

9. **Использование `.cursorrules`:**
   - **ЕСЛИ** существует файл `.cursorrules` → Изучить перед PLAN/EXECUTE

10. **Минималистичная реализация:**
    - Реализовывать минимум необходимого по плану/запросу
    - Избегать усложнений

11. **Контрольные точки:**
    - Делать паузу после каждого значимого блока работы для одобрения

12. **Фокус на тестируемости:**
    - Останавливать реализацию на первой логической точке, где можно протестировать

## 3. Режимы RIPER (только COMPLICATED)

| Режим | Цель | Разрешено | Запрещено | Вывод |
|-------|------|-----------|-----------|-------|
| **RESEARCH** | Сбор информации | Чтение файлов, уточняющие вопросы | Предложения, планы, код | Наблюдения, вопросы |
| **INNOVATE** | Мозговой штурм | Обсуждение идей, плюсы/минусы | Планы, код | Возможные подходы |
| **PLAN** | Детальная спецификация | Подробный план (пути, функции, изменения) | Реализация/код | Цель, спецификации, чеклист |
| **EXECUTE** | Реализация плана | Реализация пунктов плана, мелкие исправления | Отклонения, дополнения | Действия реализации |
| **REVIEW** | Проверка соответствия плану | Построчная проверка | - | Сравнение, вердикт (✅/❌) |

## 4. Сигналы перехода между режимами

### Основные сигналы:
- `ENTER RESEARCH MODE`
- `ENTER INNOVATE MODE`
- `ENTER PLAN MODE`
- `ENTER EXECUTE MODE`
- `ENTER REVIEW MODE`

### Fast Path режимы:
- `ENTER RESEARCH_PLAN MODE`: Исследование → План
- `ENTER PLAN_EXECUTE MODE`: План → Исполнение
- `ENTER EXECUTE_REVIEW MODE`: Исполнение → Проверка

## 5. Ключевые файлы Банка Памяти

- `projectbrief.md`: Определение требований и целей
- `productContext.md`: Бизнес-контекст и пользовательский опыт
- `activeContext.md`: Текущий фокус работы
- `systemPatterns.md`: Архитектура и паттерны дизайна
- `techContext.md`: Технологии и зависимости
- `progress.md`: Прогресс и оставшиеся задачи
- `graph.json`: Структура графа знаний

## 6. Инструменты MCP Банка Памяти

### Базовые инструменты:
- `list_projects`: [RESEARCH, PLAN]
- `create_project`: [PLAN, EXECUTE (в плане)]
- `list_project_files`: [RESEARCH, PLAN]
- `get_file_content`: [RESEARCH, PLAN, REVIEW]
- `update_file_content`: [EXECUTE (в плане)]
- `init_memory_bank`: [PLAN, EXECUTE (в плане)]

### Инструменты графа знаний (пакетные операции):
- `mcp_memory_bank_batch_add`: [EXECUTE (в плане)] - Добавление множества узлов и рёбер
- `mcp_memory_bank_batch_update`: [EXECUTE (в плане)] - Обновление множества узлов
- `mcp_memory_bank_batch_delete`: [EXECUTE (в плане)] - Удаление узлов или рёбер

### Инструменты поиска и запросов графа:
- `mcp_memory_bank_search_graph`: [RESEARCH, PLAN] - Текстовый поиск
- `mcp_memory_bank_query_graph`: [RESEARCH, PLAN] - Запросы с фильтрацией
- `mcp_memory_bank_open_nodes`: [RESEARCH, PLAN] - Получение конкретных узлов

## 7. Графовая структура знаний

### Структура:
- **Узлы (Nodes)**: Представляют сущности проекта
  - `id` (обязательно): Уникальный идентификатор
  - `type` (обязательно): Категория (File, Function, Class, Concept и т.д.)
  - `label` (обязательно): Человекочитаемое имя
  - `data` (опционально): Структурированные данные

- **Рёбра (Edges)**: Представляют отношения между узлами
  - `sourceId`: ID исходного узла
  - `targetId`: ID целевого узла
  - `relationshipType`: Тип отношения

### Метаданные:
- **Метаданные графа**: Timestamp, счётчики, версия
- **Метаданные узла**: Дата создания, обновления, версия
- **Метаданные ребра**: Дата создания, обновления, версия

### Типы узлов:
- `File`: Файл проекта (path, fileType)
- `Function`: Функция/метод (signature, returnType, parameters)
- `Class`: Класс/структура (properties, methods, inheritance)
- `Component`: Логический компонент (version, status)
- `Concept`: Абстрактная концепция (description, examples)
- `Requirement`: Требование (priority, status, description)

### Типы отношений:
- `CONTAINS`: Родитель-потомок (File CONTAINS Function)
- `CALLS`: Вызов функции (Function CALLS Function)
- `IMPLEMENTS`: Реализация (Class IMPLEMENTS Concept)
- `DEPENDS_ON`: Зависимость (Component DEPENDS_ON Component)
- `EXTENDS`: Наследование (Class EXTENDS Class)
- `RELATES_TO`: Общая связь (Entity RELATES_TO Entity)
- `SATISFIES`: Удовлетворение требования (Function SATISFIES Requirement)

## 8. Работа с графом знаний

### Чтение графа (RESEARCH, PLAN):
```typescript
// Поиск по тексту
await mcp_memory_bank_search_graph({
  project_name: "MyProject",
  query: "auth",
  search_in: ["label", "data"]
});

// Запрос с фильтрами
await mcp_memory_bank_query_graph({
  project_name: "MyProject",
  query: {
    filters: [{ attribute: "type", value: "Component" }]
  }
});

// Поиск соседей узла
await mcp_memory_bank_query_graph({
  project_name: "MyProject",
  query: {
    neighborsOf: "auth-service",
    direction: "in",
    relationshipType: "DEPENDS_ON"
  }
});

// Получение конкретных узлов
await mcp_memory_bank_open_nodes({
  project_name: "MyProject",
  node_ids: ["component1", "component2"],
  include_relations: true
});
```

### Модификация графа (EXECUTE, только в плане):
```typescript
// Добавление узлов и рёбер
await mcp_memory_bank_batch_add({
  project_name: "MyProject",
  nodes: [
    {
      id: "auth-service",
      type: "Component",
      label: "Authentication Service",
      data: { description: "Handles authentication" }
    },
    {
      id: "user-service",
      type: "Component",
      label: "User Service",
      data: { description: "Manages users" }
    }
  ],
  edges: [
    {
      sourceId: "user-service",
      targetId: "auth-service",
      relationshipType: "DEPENDS_ON"
    }
  ]
});

// Обновление узлов
await mcp_memory_bank_batch_update({
  project_name: "MyProject",
  nodes: [
    {
      id: "auth-service",
      newLabel: "Updated Auth Service",
      data: { version: "2.0.0" }
    }
  ]
});

// Удаление узлов или рёбер
await mcp_memory_bank_batch_delete({
  project_name: "MyProject",
  nodeIds: ["obsolete-component"],
  edges: [
    {
      sourceId: "component-a",
      targetId: "component-b",
      relationshipType: "DEPENDS_ON"
    }
  ]
});
```

## 9. Критические сценарии

### Устаревший Банк Памяти:
- **RESEARCH**: Документировать противоречия
- **PLAN**: Включить шаг обновления Банка Памяти
- **EXECUTE**: Если проблема блокирует план → Вернуться в PLAN

### Неудачное выполнение:
- Немедленно вернуться в PLAN
- Документировать конкретные точки отказа
- Включить проверку Банка Памяти в исправленный план

### Частичное выполнение:
- **REVIEW**: Точно документировать текущее состояние
- **PLAN**: Создать план восстановления с учётом выполненной работы

### Конфликтующие требования:
- **RESEARCH**: Документировать конфликт
- **PLAN**: Включить шаг разрешения (приоритет инструкциям пользователя)
- **SIMPLE**: Приоритет инструкциям пользователя, но отметить конфликт

## 10. Инициализация Банка Памяти

### При начале проекта/сессии:
1. Проверить существование проекта:
   ```
   mcp_memory_bank_list_projects
   ```
   **ЕСЛИ** проект не существует:
   ```
   mcp_memory_bank_create_project project_name="ProjectName"
   ```

2. Проверить наличие всех 7 ключевых файлов

3. Прочитать ключевые файлы:
   - `projectbrief.md`
   - `activeContext.md`
   - `progress.md`

4. Проверить наличие `.cursorrules`

## 11. Интеграция с режимами

### RESEARCH + Банк Памяти:
- Читать `projectbrief`, `activeContext`, `.cursorrules`
- Только чтение

### PLAN + Банк Памяти:
- Ссылаться на `systemPatterns`, `activeContext`
- Предлагать обновления для EXECUTE
- Только чтение

### EXECUTE + Банк Памяти:
- Реализовывать план, включая обновления файлов/графа
- Разрешены изменения согласно плану

### REVIEW + Банк Памяти:
- Проверять соответствие плану
- Только чтение

## 12. Отслеживание контекста (переходы COMPLICATED)

- Использовать блок `CONTEXT CARRYOVER:`
- Суммировать ключевые: `RESEARCH findings: [...]`, `INNOVATE decisions: [...]`, `PLAN elements: [...]`
- Сохранять терминологию