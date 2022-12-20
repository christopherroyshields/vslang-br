import { ExpressionType } from "./ExpressionType";

export type Expression = {
  type?: ExpressionType;
  pos: [number, number];
};
