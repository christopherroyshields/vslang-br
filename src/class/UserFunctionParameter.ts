import FunctionParameter from "../interface/FunctionParameter"
import { BrParamType } from "../types/BrParamType"

export default class UserFunctionParameter implements FunctionParameter {
  name: string = ""
  length?: number | undefined
  documentation?: string | undefined
  isReference: boolean = false
  isOptional: boolean = false
  type?: BrParamType
}
