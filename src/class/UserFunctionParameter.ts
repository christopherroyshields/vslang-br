import FunctionParameter from "../interface/FunctionParameter"
import { VariableType } from "../types/VariableType"

export default class UserFunctionParameter implements FunctionParameter {
  name = ""
  length?: number | undefined
  documentation?: string | undefined
  isReference = false
  isOptional = false
  type?: VariableType
}
