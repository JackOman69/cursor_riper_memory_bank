# MCP Memory Bank

A graph-based knowledge management system for Cursor IDE that implements the Model Context Protocol (MCP).

## Quick Start

Run directly with npx:

```bash
npx mcp-memory-bank
```

Or install globally:

```bash
npm install -g mcp-memory-bank
mcp-memory-bank
```

## Features

- Graph-based knowledge storage
- MCP protocol implementation
- Cross-platform support
- Configurable storage location
- Command-line interface

## Usage

### Basic Usage

Start the server with default settings:

```bash
mcp-memory-bank
```

### Custom Storage Location

Specify a custom path for storing the memory bank:

```bash
mcp-memory-bank --path /custom/path/to/storage
```

### Debug Mode

Enable debug mode for additional logging:

```bash
mcp-memory-bank --debug
```

### Environment Variables

- `MEMORY_BASE_PATH`: Set the base path for memory bank storage
  ```bash
  MEMORY_BASE_PATH=/custom/path mcp-memory-bank
  ```

## Requirements

- Node.js >= 16.0.0
- npm >= 7.0.0

## Development

1. Clone the repository:
   ```bash
   git clone https://github.com/JackOman69/cursor_riper_memory_bank.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run locally:
   ```bash
   npm start
   ```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 