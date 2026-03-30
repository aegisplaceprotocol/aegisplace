// Re-export Mongoose models for backward compatibility
// Files that import from "drizzle/schema" get the Mongoose models
export { OperatorModel, OperatorTokenModel } from "../server/db";
