import FunctionParameter from "./FunctionParameter";

export default interface BrFunction {
  name: string,
  description?: string,
  documentation?: string,
  params?: FunctionParameter[]
}
