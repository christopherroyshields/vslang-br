export type RegExpMatchArrayWithIndices = RegExpMatchArray & {
  indices: [number, number] & {
    groups: {
      [key: string]: [number, number];
    };
  };
};
