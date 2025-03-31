# Руководство по взаимодействию с ИИ на базе RIPER и Банка Памяти

## Введение

Данное руководство описывает принципы эффективной работы с искусственным интеллектом, который функционирует согласно двум интегрированным системам:
1. **Протокол RIPER** — определяет режимы работы и дисциплину взаимодействия
2. **Банк Памяти** — обеспечивает сохранение знаний между сессиями

Правильное понимание этих систем позволит вам максимально эффективно использовать возможности ИИ, обеспечивая структурированный и предсказуемый рабочий процесс.

## Установка и Запуск в Cursor

Чтобы использовать этот MCP сервер "Memory Bank" в Cursor, выполните следующие шаги:

**1. Предварительные требования:**
   - Убедитесь, что у вас установлены [Node.js](https://nodejs.org/) (рекомендуется LTS версия) и npm (обычно устанавливается вместе с Node.js).

**2. Получение кода и инициализация проекта:**
   - Клонируйте репозиторий
   - Откройте терминал в **корневой папке проекта**.
   - **Важно:** Если в папке еще нет файла `package.json`, инициализируйте npm проект командой:
     ```bash
     npm init -y
     ```
     Это создаст `package.json` и позволит устанавливать зависимости локально для этого проекта, а не глобально.

**3. Установка зависимостей:**
   - В том же терминале (в корневой папке проекта) выполните команду:
     ```bash
     npm install
     ```
     Эта команда скачает и установит все необходимые пакеты (`@modelcontextprotocol/sdk`, `typescript`, `graphology` и др.), перечисленные в `package.json`, в папку `node_modules` **внутри вашего проекта**.

**4. Сборка проекта:**
   - Скомпилируйте TypeScript код в JavaScript:
     ```bash
     npm run build
     ```
     Эта команда использует локально установленный компилятор `tsc` (благодаря `npm install`) и создаст папку `dist` с скомпилированным файлом `memory-bank.js`.

**5. Настройка в Cursor (через JSON):**
   - Откройте палитру команд Cursor (Ctrl+Shift+P или Cmd+Shift+P).
   - Найдите и выберите команду `MCP: Configure MCP Servers (JSON)`.
   - Откроется файл `mcp_servers.json`. Добавьте в массив конфигурацию для вашего сервера:
     ```json
     {
       "mcpServers": {
          "memory-bank": {
            "command": "npm",
            "args": [
              "E:/cursor_riper_memory_bank/memory-bank.js" // !!! ЗАМЕНИТЕ НА ПОЛНЫЙ ПУТЬ К ВАШЕМУ ПРОЕКТУ !!!
            ]
         }
       }
     }
     ```
   - **Обязательно замените** значение `"cwd"` на **абсолютный путь** к корневой папке вашего проекта (где находится `package.json`).
   - Сохраните файл `mcp_servers.json`.

**6. Запуск и проверка:**
   - Перезапустите Cursor или перезагрузите окно (Ctrl+Shift+P -> `Developer: Reload Window`).
   - Попробуйте использовать один из инструментов сервера (например, `mcp_memory_bank_list_projects`) в чате с ИИ.
   - Проверьте вывод в панели "Output" Cursor (выбрав ваш сервер `Memory Bank Local` из выпадающего списка), чтобы увидеть логи запуска (`Memory Bank MCP Server running...`, `Memory base path...`).

Теперь ваш локальный MCP сервер "Memory Bank" должен быть настроен и доступен для использования в Cursor.

## Основные принципы взаимодействия

### 1. Работа с режимами (RIPER)

ИИ всегда находится в одном из пяти режимов, определяющих границы его возможностей:

- **RESEARCH**: Сбор информации, анализ существующего кода
- **INNOVATE**: Мозговой штурм, предложение возможных подходов
- **PLAN**: Создание подробного технического плана с чеклистом
- **EXECUTE**: Точная реализация плана без отклонений
- **REVIEW**: Проверка реализации на соответствие плану

Для перехода между режимами используйте команды:
- `ENTER RESEARCH MODE`
- `ENTER INNOVATE MODE`
- `ENTER PLAN MODE`
- `ENTER EXECUTE MODE`
- `ENTER REVIEW MODE`

### 2. Ускоренные режимы

Для повышения эффективности существуют комбинированные режимы:

- `ENTER RESEARCH_PLAN MODE`: Объединяет исследование и планирование
- `ENTER PLAN_EXECUTE MODE`: Создание плана с немедленным выполнением
- `ENTER EXECUTE_REVIEW MODE`: Выполнение с последующей проверкой

### 3. Банк Памяти

Банк памяти хранит знания о проекте между сессиями в следующих файлах:

- `projectbrief.md`: Основные требования и цели
- `productContext.md`: Бизнес-контекст проекта
- `activeContext.md`: Текущие задачи и прогресс
- `systemPatterns.md`: Архитектура и паттерны
- `techContext.md`: Технический стек
- `progress.md`: Что сделано и что осталось
- `graph.json`: Графовая структура знаний о проекте

### 4. Принципы разработки

- **Явные контрольные точки**: Пауза после каждого блока работы
- **Минималистичная реализация**: Делать минимум необходимого
- **Поэтапная разработка**: Цикл предложить → одобрить → реализовать → проверить
- **Контроль границ**: Запрос разрешения при выходе за рамки задачи

## Работа с графовой структурой знаний

Помимо файлов Markdown, Банк Памяти теперь включает `graph.json` для хранения графа знаний о проекте. Это позволяет моделировать и запрашивать сложные взаимосвязи между сущностями проекта (файлами, функциями, концепциями и т.д.).

### Структура графа знаний

Граф знаний состоит из двух основных элементов:

1. **Узлы (Nodes)** - представляют сущности в проекте
   - Каждый узел имеет уникальный ID
   - Тип узла (например, Function, File, Concept, Component)
   - Человекочитаемая метка
   - Опциональные структурированные данные

2. **Ребра (Edges)** - представляют отношения между узлами
   - Направленные связи от исходного узла к целевому
   - Тип отношения (например, CALLS, IMPLEMENTS, DEPENDS_ON)

### Типичные сценарии использования графа

- **Моделирование архитектуры**: Создание узлов для компонентов, определение зависимостей.
- **Отслеживание функциональных зависимостей**: Моделирование вызовов функций.
- **Концептуальное моделирование**: Связывание концепций с реализациями.
- **Отслеживание требований**: Связывание требований с компонентами.

### Инструменты для работы с графом

Для управления графом знаний доступны следующие инструменты MCP (в основном используются в режиме EXECUTE для модификации и RESEARCH/PLAN для чтения):

- **Создание и обновление:**
  - `mcp_memory_bank_add_node`: Добавить узел (id, type, label, [data]).
  - `mcp_memory_bank_update_node`: Обновить узел (id, [newLabel], [data_to_merge]).
  - `mcp_memory_bank_add_edge`: Добавить ребро (sourceId, targetId, relationshipType).
- **Удаление:**
  - `mcp_memory_bank_delete_node`: Удалить узел (id).
  - `mcp_memory_bank_delete_edge`: Удалить ребро (sourceId, targetId, relationshipType).
- **Запросы:**
  - `mcp_memory_bank_get_node`: Получить детали узла (id).
  - `mcp_memory_bank_get_all_nodes`: Получить все узлы.
  - `mcp_memory_bank_get_all_edges`: Получить все ребра.
  - `mcp_memory_bank_query_graph`: Выполнить запрос к графу (query: { filters?, neighborsOf?, relationshipType?, direction? }).

### Пример использования

```markdown
# Добавление узлов
mcp_memory_bank_add_node project_name="MyProject" id="file:main.ts" type="File" label="main.ts"
mcp_memory_bank_add_node project_name="MyProject" id="func:setupServer" type="Function" label="setupServer"

# Добавление ребра
mcp_memory_bank_add_edge project_name="MyProject" sourceId="file:main.ts" targetId="func:setupServer" relationshipType="CONTAINS"

# Запрос: найти все функции в файле main.ts
mcp_memory_bank_query_graph project_name="MyProject" query='{
  "neighborsOf": "file:main.ts",
  "direction": "out",
  "relationshipType": "CONTAINS",
  "filters": [ { "attribute": "type", "value": "Function" } ]
}'
```

### Рекомендации по моделированию

- **Типы узлов**: File, Function, Class, Component, Concept, Requirement.
- **Типы отношений**: CONTAINS, CALLS, IMPLEMENTS, DEPENDS_ON, EXTENDS, RELATES_TO, SATISFIES.

Граф знаний хранится в файле `graph.json` в директории проекта и автоматически обновляется при использовании инструментов графа. Этот файл является частью Банка Памяти.

## Пошаговое руководство по выполнению задач

### Фаза 1: Инициализация и исследование

1. **Убедитесь, что Банк Памяти инициализирован для вашего проекта**
   ```
   "Проверь наличие проекта [Название] в Банке Памяти"
   ```

2. **Начните в режиме RESEARCH (режим по умолчанию)**
   ```
   "Мне нужно изучить проблему с авторизацией в модуле auth.js"
   ```

3. **Предоставьте необходимый контекст**
   ```
   "Вот код auth.js: [код функции]"
   ```

4. **Задавайте уточняющие вопросы**
   ```
   "Какие конкретно ошибки возникают? Есть ли логи?"
   ```

### Фаза 2: Разработка решения

1. **Переход в режим INNOVATE**
   ```
   "ENTER INNOVATE MODE"
   ```

2. **Оценка предложенных подходов**
   ```
   "Мне нравится второй подход с обработкой ошибок"
   ```

3. **Переход в режим PLAN**
   ```
   "ENTER PLAN MODE"
   ```

4. **Внесение корректировок в план, если необходимо**
   ```
   "В пункте 3 давай также добавим логирование ошибок"
   ```

### Фаза 3: Реализация и проверка

1. **Переход в режим EXECUTE**
   ```
   "ENTER EXECUTE MODE"
   ```

2. **Мониторинг процесса реализации**
   ```
   "Хорошо, продолжай выполнение"
   ```

3. **Переход в режим REVIEW для проверки**
   ```
   "ENTER REVIEW MODE"
   ```

4. **Проверка реализации**
   ```
   "Выглядит хорошо, но давай уточним обработку ошибок"
   ```

### Фаза 4: Интеграция и документация

1. **Обновление Банка Памяти**
   ```
   "Обнови Банк Памяти, добавив информацию о новой реализации auth.js"
   ```

2. **Предоставление обратной связи**
   ```
   "Отлично поработал, давай в следующий раз использовать try-catch конструкции для всех асинхронных функций"
   ```

## Примеры взаимодействия

### Пример 1: Исправление бага в функции авторизации

**Человек**: 
"У нас в функции авторизации есть баг: пользователи не могут сбросить пароль. Можешь помочь исправить? Вот код auth.js"

**ИИ**:
[MODE: RESEARCH]

НАБЛЮДЕНИЯ:
* Вы обнаружили проблему в функции авторизации, связанную со сбросом пароля
* Проблема находится в файле auth.js
* Конкретные симптомы ошибки не указаны

ВОПРОСЫ:
1. Какое конкретно поведение наблюдается при попытке сброса пароля?
2. Есть ли сообщения об ошибках в консоли или логах?
3. Можете ли вы поделиться содержимым auth.js для анализа?
4. Эта функциональность работала раньше, или это новая функция?

**Человек**:
"Вот код auth.js. Проблема в том, что когда пользователи нажимают 'Забыли пароль', они получают ошибку 404. Функция resetPassword, похоже, вызывает неправильный API-эндпоинт."

**ИИ**:
[MODE: RESEARCH]

НАБЛЮДЕНИЯ:
* Функция resetPassword вызывает неправильный API-эндпоинт
* Пользователи получают ошибку 404 при попытке сбросить пароль
* Проблема возникает при нажатии кнопки 'Забыли пароль'

ВОПРОСЫ:
1. Какой правильный API-эндпоинт должен использоваться?
2. Есть ли логи на бэкенде, показывающие попытку запроса?
3. Был ли API-эндпоинт изменен недавно?

**Человек**:
"Правильный эндпоинт должен быть '/api/v2/auth/reset' вместо '/api/auth/reset'. API был обновлен на прошлой неделе."

**ИИ**:
[MODE: INNOVATE]

ВОЗМОЖНЫЙ ПОДХОД 1: Прямое обновление эндпоинта
* Преимущества: Простое, точечное исправление, адресующее только конкретную проблему
* Сложности: Может пропустить другие случаи использования, если эндпоинт используется где-то еще
* Соображения: Минимальное изменение с узким воздействием

ВОЗМОЖНЫЙ ПОДХОД 2: Эндпоинт на основе конфигурации
* Преимущества: Централизует определения API-эндпоинтов для облегчения будущих обновлений
* Сложности: Требует более существенных изменений для правильной реализации
* Соображения: Более надежное решение в долгосрочной перспективе, но более масштабное изменение

ВОПРОСЫ ДЛЯ РАССМОТРЕНИЯ:
1. Предпочитаете ли вы минимальное прямое исправление или более надежное решение?
2. Есть ли другие функции, которые могут использовать старый эндпоинт?

**Человек**:
"Давай сделаем прямое исправление сейчас. Рефакторинг можем сделать потом."

**ИИ**:
[MODE: PLAN]

ЦЕЛЬ: Исправить функцию resetPassword для использования правильного API-эндпоинта

СПЕЦИФИКАЦИИ:
1. Найти функцию resetPassword в auth.js
2. Изменить API-эндпоинт с '/api/auth/reset' на '/api/v2/auth/reset'
3. Сохранить все остальные параметры и поведение функции

ПЛАН РЕАЛИЗАЦИИ:
1. Открыть файл auth.js
2. Найти функцию resetPassword
3. Обновить URL API-эндпоинта
4. Сохранить файл

**Человек**:
"ENTER EXECUTE MODE"

**ИИ**:
[MODE: EXECUTE]

ВЫПОЛНЯЮ УТВЕРЖДЕННЫЙ ПЛАН:

ДЕЙСТВИЕ 1/4: Открываю файл auth.js
СТАТУС: Выполнено

ДЕЙСТВИЕ 2/4: Ищу функцию resetPassword
СТАТУС: Выполнено

ДЕЙСТВИЕ 3/4: Обновляю URL API-эндпоинта
СТАТУС: Выполнено

Изменено:
```javascript
function resetPassword(email) {
  return axios.post('/api/v2/auth/reset', { email });
}
```

На:
```javascript
function resetPassword(email) {
  return axios.post('/api/v2/auth/reset', { email });
}
```

ДЕЙСТВИЕ 4/4: Сохраняю файл
СТАТУС: Выполнено

**Человек**:
"ENTER REVIEW MODE"

**ИИ**:
[MODE: REVIEW]

СРАВНЕНИЕ ПЛАНА И РЕАЛИЗАЦИИ:

ПУНКТ 1: Открыть файл auth.js
СТАТУС: Реализовано точно по плану

ПУНКТ 2: Найти функцию resetPassword
СТАТУС: Реализовано точно по плану

ПУНКТ 3: Обновить URL API-эндпоинта с '/api/auth/reset' на '/api/v2/auth/reset'
СТАТУС: Реализовано точно по плану

ПУНКТ 4: Сохранить файл
СТАТУС: Реализовано точно по плану

ЗАКЛЮЧЕНИЕ: 
:white_check_mark: РЕАЛИЗАЦИЯ ПОЛНОСТЬЮ СООТВЕТСТВУЕТ ПЛАНУ

### Пример 2: Создание нового React-компонента

**Человек**:
"Нужно создать новый React-компонент для отображения профилей пользователей. Он должен показывать имя пользователя, аватар, биографию и список последних действий. Пожалуйста, используй наш существующий стиль компонентов."

**ИИ**:
[MODE: RESEARCH]

НАБЛЮДЕНИЯ:
* Вам нужен новый React-компонент для профилей пользователей
* Он должен отображать: имя, аватар, биографию, последние действия
* Он должен соответствовать вашему существующему стилю компонентов

ВОПРОСЫ:
1. Где расположены ваши существующие React-компоненты?
2. Есть ли конкретный компонент, который я должен использовать в качестве образца?
3. Есть ли у вас определенная структура данных для профилей пользователей?
4. Где должен быть создан новый компонент?
5. Используются ли какие-либо библиотеки UI или системы дизайна?

**Человек**:
"Наши компоненты находятся в src/components. Можешь использовать ProfileCard.js в качестве примера. Создай новый компонент как UserProfile.js в той же директории. Мы используем Material UI для стилизации."

**ИИ**:
[MODE: RESEARCH_PLAN]

НАБЛЮДЕНИЯ:
* Расположение компонентов: src/components
* Эталонный компонент: ProfileCard.js
* Имя нового компонента: UserProfile.js
* UI-библиотека: Material UI

ЦЕЛЬ: Создать новый React-компонент UserProfile.js, следуя существующим паттернам

СПЕЦИФИКАЦИИ:
1. Компонент будет отображать имя пользователя, аватар, биографию и последние действия
2. Следовать паттернам стилизации из ProfileCard.js
3. Использовать компоненты Material UI
4. Разместить в директории src/components

ПЛАН РЕАЛИЗАЦИИ:
1. Изучить ProfileCard.js для понимания структуры и паттернов стилизации
2. Создать UserProfile.js в директории src/components
3. Реализовать компонент с необходимыми элементами профиля
4. Добавить соответствующие импорты и стили Material UI
5. Добавить PropTypes для свойств компонента

**Человек**:
"ENTER EXECUTE MODE"

**ИИ**:
[MODE: EXECUTE]

ВЫПОЛНЯЮ УТВЕРЖДЕННЫЙ ПЛАН:

ДЕЙСТВИЕ 1/5: Изучаю эталонный компонент ProfileCard.js
СТАТУС: Выполнено

ДЕЙСТВИЕ 2/5: Создаю UserProfile.js в директории src/components
СТАТУС: Выполнено

ДЕЙСТВИЕ 3/5: Реализую компонент с необходимыми элементами
СТАТУС: Выполнено

ДЕЙСТВИЕ 4/5: Добавляю импорты и стили Material UI
СТАТУС: Выполнено

ДЕЙСТВИЕ 5/5: Добавляю PropTypes для свойств компонента
СТАТУС: Выполнено

Создан файл src/components/UserProfile.js со следующим содержимым:

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider 
} from '@mui/material';
import { styled } from '@mui/material/styles';

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(10),
  height: theme.spacing(10),
  marginBottom: theme.spacing(2)
}));

const UserProfile = ({ 
  user = { 
    name: '', 
    avatar: '', 
    bio: '', 
    recentActivities: [] 
  } 
}) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <ProfileAvatar src={user.avatar} alt={user.name} />
          <Typography variant="h5" component="h2">
            {user.name}
          </Typography>
        </Box>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          {user.bio}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" component="h3" gutterBottom>
          Последние действия
        </Typography>
        
        <List>
          {user.recentActivities.length > 0 ? (
            user.recentActivities.map((activity, index) => (
              <ListItem key={index} disablePadding sx={{ py: 1 }}>
                <ListItemText 
                  primary={activity.title} 
                  secondary={activity.date} 
                />
              </ListItem>
            ))
          ) : (
            <ListItem disablePadding>
              <ListItemText primary="Нет последних действий" />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

UserProfile.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    bio: PropTypes.string,
    recentActivities: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired
      })
    )
  })
};

export default UserProfile;
```

### Пример 3: Рефакторинг запроса к базе данных

**Человек**:
"Наши запросы к базе данных в users.js неэффективны. Мы загружаем всю таблицу пользователей, а затем фильтруем в памяти. Можешь отрефакторить функцию getUsersByRole, чтобы использовать правильную SQL-фильтрацию?"

**ИИ**:
[MODE: RESEARCH]

НАБЛЮДЕНИЯ:
* Существует проблема с эффективностью запросов к базе данных в users.js
* Текущий подход загружает всю таблицу пользователей, затем фильтрует в памяти
* Конкретно нужно отрефакторить функцию getUsersByRole
* Цель — использовать правильную SQL-фильтрацию

ВОПРОСЫ:
1. Какую систему управления базами данных вы используете (MySQL, PostgreSQL и т.д.)?
2. Используете ли вы ORM (Sequelize, TypeORM и т.д.) или прямые SQL-запросы?
3. Можете ли вы поделиться текущей реализацией getUsersByRole?
4. Существуют ли какие-либо особые требования к производительности или ограничения?

**Человек**:
"Мы используем PostgreSQL с ORM Sequelize. Вот текущая реализация:

```javascript
// getUsersByRole загружает всех пользователей и фильтрует в JS
async function getUsersByRole(role) {
  const allUsers = await User.findAll();
  return allUsers.filter(user => user.role === role);
}
```


**ИИ**:
[MODE: INNOVATE]

ВОЗМОЖНЫЙ ПОДХОД 1: Условие WHERE в Sequelize
* Преимущества: Использует встроенную фильтрацию Sequelize, очень читабельно
* Сложности: Нет для этого простого случая
* Соображения: Напрямую отображается на SQL-условие WHERE для эффективности

ВОЗМОЖНЫЙ ПОДХОД 2: Сырой SQL-запрос с Sequelize
* Преимущества: Максимальный контроль над генерируемым SQL
* Сложности: Меньше типобезопасности, более многословный
* Соображения: Может быть избыточным для этого простого запроса

ВОПРОСЫ ДЛЯ РАССМОТРЕНИЯ:
1. Нужны ли дополнительные условия помимо фильтрации по роли?
2. Нужно ли getUsersByRole включать связанные модели (ассоциации)?

**Человек**:
"Нет других условий, и ассоциации не требуются. Давай используем первый подход с условием where в Sequelize."

**ИИ**:
[MODE: PLAN_EXECUTE]

ЦЕЛЬ: Отрефакторить getUsersByRole для использования условия where в Sequelize

СПЕЦИФИКАЦИИ:
1. Обновить getUsersByRole для использования findAll с условием where
2. Сохранить ту же сигнатуру функции и тип возвращаемого значения
3. Обеспечить правильную обработку ошибок

ПЛАН РЕАЛИЗАЦИИ:
1. Найти функцию getUsersByRole в users.js
2. Заменить текущую реализацию на использование условия where в Sequelize
3. Добавить соответствующую обработку ошибок

ВЫПОЛНЯЮ УТВЕРЖДЕННЫЙ ПЛАН:

ДЕЙСТВИЕ 1/3: Нахожу функцию getUsersByRole в users.js
СТАТУС: Выполнено

ДЕЙСТВИЕ 2/3: Заменяю реализацию на использование условия where в Sequelize
СТАТУС: Выполнено

Изменено:
```javascript
// getUsersByRole загружает всех пользователей и фильтрует в JS
async function getUsersByRole(role) {
  const allUsers = await User.findAll();
  return allUsers.filter(user => user.role === role);
}
```

На:
```javascript
// Рефакторинг getUsersByRole для использования SQL-фильтрации
async function getUsersByRole(role) {
  try {
    return await User.findAll({
      where: {
        role: role
      }
    });
  } catch (error) {
    console.error('Ошибка при получении пользователей по роли:', error);
    throw error;
  }
}
```

ДЕЙСТВИЕ 3/3: Добавляю соответствующую обработку ошибок
СТАТУС: Выполнено (включено в реализацию выше)

## Советы по эффективному взаимодействию

1. **Начинайте с четкого описания задачи**
   - Укажите файлы, над которыми нужно работать
   - Опишите ожидаемый результат
   - Предоставьте контекст и ограничения

2. **Используйте правильные режимы для разных этапов**
   - RESEARCH для начального понимания
   - INNOVATE для мозгового штурма
   - PLAN для детального планирования
   - EXECUTE для реализации
   - REVIEW для проверки качества

3. **Эффективно используйте Банк Памяти**
   - Запрашивайте обновление после значимых изменений
   - Используйте сохраненные знания в будущих задачах
   - Поддерживайте актуальность информации

4. **Предоставляйте конкретную обратную связь**
   - Указывайте конкретные предпочтения в коде
   - Сообщайте о паттернах, которые следует использовать
   - Объясняйте причины предпочтений для будущих задач

5. **Стратегически используйте ускоренные режимы**
   - RESEARCH_PLAN для простых, понятных задач
   - PLAN_EXECUTE, когда решение очевидно
   - EXECUTE_REVIEW для немедленной проверки изменений

## Полезные промты для работы

### Саммари изменений после выполненной задачи

```
Сделай саммари всех изменений, которые ты сделал в этом чате, а затем внеси всю информацию изменений в банк памяти проекта "название_проекта" с помощью режима PLAN_EXECUTE
```

## Возможности графа знаний

Банк Памяти включает мощную систему графа знаний для моделирования связей между сущностями проекта. Основные возможности включают:

### Поддержка метаданных
- Метаданные уровня графа (временные метки, версия, счетчики)
- Метаданные уровня узлов (даты создания/обновления, версия)
- Метаданные уровня связей (даты создания/обновления, версия)

### Пакетные операции
Эффективные пакетные операции для управления множеством узлов и связей:

```typescript
// Добавление нескольких узлов и связей
await mcp_memory_bank_batch_add({
  project_name: "MyProject",
  nodes: [
    {
      id: "auth-service",
      type: "Service",
      label: "Сервис аутентификации",
      data: { version: "1.0.0" }
    },
    {
      id: "user-service",
      type: "Service",
      label: "Сервис управления пользователями",
      data: { version: "1.0.0" }
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

// Обновление нескольких узлов
await mcp_memory_bank_batch_update({
  project_name: "MyProject",
  nodes: [
    {
      id: "auth-service",
      newLabel: "Сервис аутентификации v2",
      data: { version: "2.0.0" }
    }
  ]
});

// Удаление узлов или связей
await mcp_memory_bank_batch_delete({
  project_name: "MyProject",
  nodeIds: ["old-service"],
  edges: [
    {
      sourceId: "service-a",
      targetId: "service-b",
      relationshipType: "CALLS"
    }
  ]
});
```

### Возможности поиска и запросов

1. Текстовый поиск:
```typescript
// Поиск по меткам узлов и данным
const results = await mcp_memory_bank_search_graph({
  project_name: "MyProject",
  query: "аутентификация",
  search_in: ["label", "data"],
  case_sensitive: false,
  limit: 10
});
```

2. Структурированные запросы:
```typescript
// Поиск компонентов, зависящих от сервиса
const results = await mcp_memory_bank_query_graph({
  project_name: "MyProject",
  query: {
    neighborsOf: "auth-service",
    direction: "in",
    relationshipType: "DEPENDS_ON",
    filters: [
      { attribute: "type", value: "Component" }
    ]
  }
});
```

3. Прямой доступ к узлам:
```typescript
// Получение конкретных узлов и их связей
const nodes = await mcp_memory_bank_open_nodes({
  project_name: "MyProject",
  node_ids: ["auth-service", "user-service"],
  include_relations: true
});
```

## Руководство по миграции

### Переход с индивидуальных операций на пакетные

1. Замена операций с отдельными узлами:
```typescript
// Старый способ
await mcp_memory_bank_add_node(...);
await mcp_memory_bank_add_node(...);

// Новый способ
await mcp_memory_bank_batch_add({
  nodes: [node1, node2],
  edges: []
});
```

2. Замена операций с отдельными связями:
```typescript
// Старый способ
await mcp_memory_bank_add_edge(...);
await mcp_memory_bank_add_edge(...);

// Новый способ
await mcp_memory_bank_batch_add({
  nodes: [],
  edges: [edge1, edge2]
});
```

3. Замена отдельных обновлений:
```typescript
// Старый способ
await mcp_memory_bank_update_node(...);

// Новый способ
await mcp_memory_bank_batch_update({
  nodes: [
    {
      id: "node1",
      newLabel: "Обновленная метка",
      data: { /* обновленные данные */ }
    }
  ]
});
```

4. Замена отдельных удалений:
```typescript
// Старый способ
await mcp_memory_bank_delete_node(...);
await mcp_memory_bank_delete_edge(...);

// Новый способ
await mcp_memory_bank_batch_delete({
  nodeIds: ["node1"],
  edges: [{
    sourceId: "source",
    targetId: "target",
    relationshipType: "TYPE"
  }]
});
```

### Миграция запросов

1. Замена прямого получения узлов:
```typescript
// Старый способ
const node = await mcp_memory_bank_get_node(...);

// Новый способ
const { nodes } = await mcp_memory_bank_open_nodes({
  node_ids: ["nodeId"],
  include_relations: false
});
```

2. Замена фильтрованных запросов:
```typescript
// Старый способ
const results = await mcp_memory_bank_query_graph({
  filters: [{ attribute: "type", value: "Service" }]
});

// Новый способ - тот же синтаксис, но с дополнительными возможностями
const results = await mcp_memory_bank_query_graph({
  query: {
    filters: [{ attribute: "type", value: "Service" }],
    // Опционально: добавление фильтрации по связям
    neighborsOf: "someNode",
    direction: "both",
    relationshipType: "DEPENDS_ON"
  }
});
```

3. Добавление возможностей текстового поиска:
```typescript
// Новая возможность
const searchResults = await mcp_memory_bank_search_graph({
  query: "auth",
  search_in: ["label", "data"],
  case_sensitive: false
});
```

### Лучшие практики

1. **Использование пакетных операций**
   - Объединяйте связанные операции в единые пакетные вызовы
   - Эффективнее, чем множество отдельных вызовов
   - Поддерживает целостность данных

2. **Использование метаданных**
   - Используйте метаданные для версионирования и отслеживания
   - Включайте релевантные данные при создании узлов/связей
   - Выполняйте запросы на основе метаданных

3. **Оптимизация запросов**
   - Используйте подходящий инструмент поиска/запроса для задачи
   - Ограничивайте результаты где возможно
   - Фильтруйте на уровне запроса, а не после получения данных

4. **Обработка ошибок**
   - Используйте silent_mode где уместно
   - Проверяйте результаты операций
   - Обрабатывайте случаи частичного успеха

## Заключение

Эффективное взаимодействие с ИИ, работающим на базе RIPER и Банка Памяти, требует понимания режимов работы и четкой коммуникации. Следуя этому руководству и предоставленным примерам, вы сможете максимально эффективно использовать возможности ИИ для разработки программного обеспечения.

Помните, что ИИ всегда начинает с чистого листа после каждого сброса памяти, и Банк Памяти — его единственная связь с предыдущей работой. Поддержание актуальности Банка Памяти критически важно для долгосрочной эффективности. 