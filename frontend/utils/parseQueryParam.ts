export const parseQueryParam = (param: string | null): number[] => {
  return param
    ? param
        .split(',')
        .map((p) => parseInt(p.trim()))
        .filter((p) => !isNaN(p))
    : [];
};
