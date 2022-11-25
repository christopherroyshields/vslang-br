import BrFunction from "../interface/BrFunction"
import FunctionParameter from "../interface/FunctionParameter"

class InternalFunction implements BrFunction {
  generateSignature(): string {
    throw new Error("Method not implemented.")
  }
  name = ''
  description?: string
  documentation?: string
  params?: FunctionParameter[]
}