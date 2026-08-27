class CommandRegistry {
  constructor() {
    this.commands = new Map();
  }

  register(name, description, handler) {
    this.commands.set(name.toLowerCase(), { name, description, handler });
  }

  unregister(name) {
    this.commands.delete(name.toLowerCase());
  }

  get(name) {
    return this.commands.get(name.toLowerCase()) || null;
  }

  getAll() {
    return Array.from(this.commands.values()).map((c) => ({
      name: c.name,
      description: c.description,
    }));
  }

  execute(name, args, context) {
    const command = this.commands.get(name.toLowerCase());
    if (!command) return { success: false, message: `Unknown command: ${name}` };
    try {
      return command.handler(args, context);
    } catch (e) {
      return { success: false, message: `Command error: ${e.message}` };
    }
  }
}

module.exports = CommandRegistry;
