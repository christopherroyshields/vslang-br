import { VariableType } from "../types/VariableType";

export type DimVariable = {
  name: string;
  type: VariableType;
  position: {
    start: number;
    end: number;
  };
};
