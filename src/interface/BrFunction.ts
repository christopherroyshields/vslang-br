import { FunctionParameter } from "./FunctionParameter";

export interface BrFunction {
  name: string,
  description?: string,
  documentation?: string,
  params?: FunctionParameter[]
}
