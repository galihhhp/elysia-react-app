import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import pkg from "pg";
import dotenv from "dotenv";
import winston from "winston";

dotenv.config();

const TABLE = process.env.DB_TABLE || "main_table";
const COLUMN_ID = process.env.DB_COLUMN_ID || "id";
const COLUMN_TASK = process.env.DB_COLUMN_TASK || "task";

type DatabaseOperation =
  | "SELECT_TASKS"
  | "SELECT_TASK_BY_ID"
  | "INSERT_TASK"
  | "UPDATE_TASK"
  | "DELETE_TASK";
type LogContext = Record<string, any>;

const createLogger = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const logDir = isProduction ? "/app/logs" : "./logs";

  const transports: winston.transport[] = [new winston.transports.Console()];

  if (isProduction) {
    transports.push(
      new winston.transports.File({
        filename: `${logDir}/error.log`,
        level: "error",
      }),
      new winston.transports.File({
        filename: `${logDir}/combined.log`,
      }),
      new winston.transports.File({
        filename: `${logDir}/app.log`,
        level: "info",
      })
    );
  }

  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports,
  });
};

const createDatabasePool = () => {
  const { Pool } = pkg;

  const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "postgres",
    connectionTimeoutMillis: 10000,
  };

  const pool = new Pool(config);

  pool.on("connect", () => {
    logger.info("Database connection established", {
      target: "postgresql",
      host: config.host,
      database: config.database,
    });
  });

  pool.on("remove", () => {
    logger.info("Database connection removed", {
      target: "postgresql",
      host: config.host,
    });
  });

  return pool;
};

const logDatabaseOperation = (
  operation: DatabaseOperation,
  isStart: boolean = true,
  error?: string
) => {
  const baseContext: LogContext = {
    target: "postgresql",
    query: operation,
    timestamp: new Date(),
  };

  if (isStart) {
    logger.info("Calling database", baseContext);
  } else if (error) {
    logger.error("Database query failed", { ...baseContext, error });
  }
};

const handleDatabaseError = (
  operation: DatabaseOperation,
  err: unknown,
  set: any
): { success: false; message: string; error: string } => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  logDatabaseOperation(operation, false, errorMessage);

  set.status = 500;
  return {
    success: false as const,
    message: `Failed to ${operation.toLowerCase().includes("select")
      ? "fetch"
      : operation.toLowerCase().includes("update")
        ? "edit"
        : operation.toLowerCase().includes("delete")
          ? "delete"
          : "add"
      } task${operation.toLowerCase().includes("select") ? "s" : ""}`,
    error: errorMessage,
  };
};

const executeQuery = async <T>(
  operation: DatabaseOperation,
  query: string,
  params: any[] = [],
  set: any
): Promise<
  | { success: true; data: T }
  | { success: false; message: string; error: string }
> => {
  try {
    logDatabaseOperation(operation);

    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return { success: true, data: result.rows as T };
    } finally {
      client.release();
    }
  } catch (err) {
    return handleDatabaseError(operation, err, set);
  }
};

const logger = createLogger();
const pool = createDatabasePool();

const app = new Elysia()
  .use(cors())
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    logger.info("Request received", {
      source_ip: request.headers.get("x-forwarded-for") || "unknown",
      endpoint: url.pathname,
      method: request.method,
      timestamp: new Date(),
    });
  })
  .get("/", () => ({ message: "Hello from ElysiaJS!" }))
  .get("/tasks", async ({ set, request }) => {
    const start = Date.now();
    logger.info("GET /tasks called", { method: request.method, url: request.url });
    const result = await executeQuery<Array<{ id: number; task: string }>>(
      "SELECT_TASKS",
      `SELECT ${COLUMN_ID}, ${COLUMN_TASK} FROM ${TABLE} ORDER BY ${COLUMN_ID} ASC`,
      [],
      set
    );
    const duration = Date.now() - start;
    if (result.success) {
      logger.info("Tasks fetched", { count: result.data.length, duration });
      return { success: true, tasks: result.data };
    }
    logger.error("Failed to fetch tasks", { error: result.error, duration });
    return result;
  })
  .get("/tasks/:id", async ({ params, set, request }) => {
    const { id } = params as { id: string };
    const start = Date.now();
    logger.info("GET /tasks/:id called", { id, method: request.method, url: request.url });
    const result = await executeQuery<Array<{ id: number; task: string }>>(
      "SELECT_TASK_BY_ID",
      `SELECT ${COLUMN_ID}, ${COLUMN_TASK} FROM ${TABLE} WHERE ${COLUMN_ID} = $1`,
      [id],
      set
    );
    const duration = Date.now() - start;
    if (result.success && result.data.length > 0) {
      logger.info("Task found", { id, task: result.data[0], duration });
      return { success: true, task: result.data[0] };
    }
    logger.warn("Task not found", { id, duration });
    set.status = 404;
    return { success: false, message: "Task not found" };
  })
  .post("/tasks", async ({ body, set, request }) => {
    const start = Date.now();
    logger.info("POST /tasks called", { body, method: request.method, url: request.url });
    const { task } = body as { task?: string };
    if (!task) {
      set.status = 400;
      logger.warn("Task is required", { body });
      return { success: false, message: "Task is required" };
    }
    const result = await executeQuery<Array<{ id: number; task: string }>>(
      "INSERT_TASK",
      `INSERT INTO ${TABLE}(${COLUMN_TASK}) VALUES($1) RETURNING ${COLUMN_ID}, ${COLUMN_TASK}`,
      [task],
      set
    );
    const duration = Date.now() - start;
    if (result.success) {
      logger.info("Task added", { task: result.data[0], duration });
      return { success: true, message: "Task added successfully", task: result.data[0] };
    }
    logger.error("Failed to add task", { error: result.error, duration });
    return result;
  })
  .put("/tasks/:id", async ({ params, body, set, request }) => {
    if (process.env.FEATURE_EDIT_TASK !== "true") {
      set.status = 403;
      logger.warn("Edit task feature is disabled");
      throw new Error("Edit task feature is disabled");
    }
    const { id } = params as { id: string };
    const { task } = body as { task?: string };
    const start = Date.now();
    logger.info("PUT /tasks/:id called", { id, body, method: request.method, url: request.url });
    if (!task) {
      set.status = 400;
      logger.warn("Task is required for edit", { id, body });
      return { success: false, message: "Task is required" };
    }
    const result = await executeQuery<Array<{ id: number; task: string }>>(
      "UPDATE_TASK",
      `UPDATE ${TABLE} SET ${COLUMN_TASK} = $1 WHERE ${COLUMN_ID} = $2 RETURNING ${COLUMN_ID}, ${COLUMN_TASK}`,
      [task, id],
      set
    );
    const duration = Date.now() - start;
    if (result.success && result.data.length > 0) {
      logger.info("Task updated", { id, task: result.data[0], duration });
      return { success: true, message: "Task updated successfully", task: result.data[0] };
    }
    set.status = 404;
    logger.warn("Task not found for update", { id, duration });
    return { success: false, message: "Task not found" };
  })
  .delete("/tasks/:id", async ({ params, set, request }) => {
    if (process.env.FEATURE_DELETE_TASK !== "true") {
      set.status = 403;
      logger.warn("Delete task feature is disabled");
      throw new Error("Delete task feature is disabled");
    }
    const { id } = params as { id: string };
    const start = Date.now();
    logger.info("DELETE /tasks/:id called", { id, method: request.method, url: request.url });
    const result = await executeQuery<Array<{ id: number }>>(
      "DELETE_TASK",
      `DELETE FROM ${TABLE} WHERE ${COLUMN_ID} = $1 RETURNING ${COLUMN_ID}`,
      [id],
      set
    );
    const duration = Date.now() - start;
    if (result.success && result.data.length > 0) {
      logger.info("Task deleted", { id, duration });
      return { success: true, message: "Task deleted successfully", id: result.data[0][COLUMN_ID] };
    }
    set.status = 404;
    logger.warn("Task not found for delete", { id, duration });
    return { success: false, message: "Task not found" };
  })
  .listen(3000);

logger.info("Server started", {
  address: `http://localhost:3000`,
  timestamp: new Date(),
});

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
