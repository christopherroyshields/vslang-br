export type RegExpExecArrayWithIndices = RegExpExecArray & {
  indices: [number, number] & {
    groups: {
      [key: string]: [number, number];
    };
  };
};
